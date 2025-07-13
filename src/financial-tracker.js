// src/financial-tracker.js
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore"; // Modular Firestore imports
import { displayMessage, showLoadingSpinner, hideLoadingSpinner } from './ui-manager.js';

const COMPANIES_COLLECTION = 'companies';
const INVOICES_COLLECTION = 'invoices';
const EXPENSES_COLLECTION = 'expenses';

/**
 * Adds a new invoice or expense entry to Firestore.
 * @param {string} companyId - The ID of the company.
 * @param {string} userId - The ID of the current user.
 * @param {string} type - 'invoice' or 'expense'.
 * @param {string} description
 * @param {number} amount
 * @param {string} date - YYYY-MM-DD format.
 * @param {string} category - Optional category.
 * @returns {Promise<void>}
 */
async function addEntry(companyId, userId, type, description, amount, date, category = '') {
    if (!companyId || !userId || !type || !description || !amount || !date) {
        displayMessage('entry-message', 'All fields (except category) are required.', 'error');
        return;
    }
    showLoadingSpinner();
    try {
        const collectionRef = type === 'invoice'
            ? collection(db, COMPANIES_COLLECTION, companyId, INVOICES_COLLECTION) // Modular collection ref
            : collection(db, COMPANIES_COLLECTION, companyId, EXPENSES_COLLECTION); // Modular collection ref

        await addDoc(collectionRef, { // Modular addDoc
            userId,
            description,
            amount: parseFloat(amount), // Ensure amount is stored as a number
            date,
            category,
            createdAt: serverTimestamp() // Modular serverTimestamp
        });
        displayMessage('entry-message', `${type === 'invoice' ? 'Invoice' : 'Expense'} added successfully!`, 'success');
        document.getElementById('add-entry-form').reset(); // Clear form
        getEntries(companyId); // Refresh entries
    } catch (error) {
        console.error(`Error adding ${type} entry:`, error);
        displayMessage('entry-message', `Failed to add ${type} entry.`, 'error');
        throw error;
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Fetches all invoice and expense entries for a given company from Firestore.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<Array<object>>} An array of all entries, sorted by date.
 */
async function getEntries(companyId) {
    if (!companyId) return [];
    showLoadingSpinner();
    try {
        const invoicesQuery = query(collection(db, COMPANIES_COLLECTION, companyId, INVOICES_COLLECTION), orderBy('date', 'desc')); // Modular query
        const expensesQuery = query(collection(db, COMPANIES_COLLECTION, companyId, EXPENSES_COLLECTION), orderBy('date', 'desc')); // Modular query

        const invoicesSnapshot = await getDocs(invoicesQuery); // Modular getDocs
        const expensesSnapshot = await getDocs(expensesQuery); // Modular getDocs

        const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'invoice' }));
        const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'expense' }));

        const allEntries = [...invoices, ...expenses];

        // Sort all entries by date (most recent first)
        allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        renderEntries(allEntries);
        calculateSummary(allEntries);
        return allEntries;
    } catch (error) {
        console.error("Error fetching entries:", error);
        displayMessage('entry-message', 'Failed to load financial entries.', 'error');
        return [];
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Deletes a specific entry from Firestore.
 * @param {string} companyId - The ID of the company.
 * @param {string} entryType - 'invoice' or 'expense'.
 * @param {string} entryId - The ID of the entry to delete.
 * @returns {Promise<void>}
 */
async function deleteEntry(companyId, entryType, entryId) {
    if (!companyId || !entryType || !entryId) return;
    showLoadingSpinner();
    try {
        const collectionPath = entryType === 'invoice' ? INVOICES_COLLECTION : EXPENSES_COLLECTION;
        const entryDocRef = doc(db, COMPANIES_COLLECTION, companyId, collectionPath, entryId); // Modular doc
        await deleteDoc(entryDocRef); // Modular deleteDoc
        displayMessage('entry-message', `Entry deleted successfully!`, 'success');
        getEntries(companyId); // Refresh entries after deletion
    } catch (error) {
        console.error("Error deleting entry:", error);
        displayMessage('entry-message', 'Failed to delete entry.', 'error');
        throw error;
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Takes an array of entries and dynamically renders them into the tracker's list/table in the UI.
 * @param {Array<object>} entries - Array of financial entries.
 */
function renderEntries(entries) {
    const tableBody = document.getElementById('tracker-entries-list');
    tableBody.innerHTML = ''; // Clear previous entries

    if (entries.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No entries yet.</td></tr>`;
        return;
    }

    entries.forEach(entry => {
        const row = document.createElement('tr');
        const amountClass = entry.type === 'invoice' ? 'income' : 'expense';
        const formattedAmount = entry.type === 'invoice' ? `+$${entry.amount.toFixed(2)}` : `-$${entry.amount.toFixed(2)}`;

        row.innerHTML = `
            <td>${entry.date}</td>
            <td><span class="entry-type ${entry.type}">${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</span></td>
            <td>${entry.description}</td>
            <td class="${amountClass}">${formattedAmount}</td>
            <td><button class="btn-danger delete-entry-btn" data-id="${entry.id}" data-type="${entry.type}">Delete</button></td>
        `;
        tableBody.appendChild(row);
    });

    // Attach event listeners for delete buttons
    tableBody.querySelectorAll('.delete-entry-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const entryId = event.target.dataset.id;
            const entryType = event.target.dataset.type;
            if (confirm(`Are you sure you want to delete this ${entryType} entry?`)) {
                document.dispatchEvent(new CustomEvent('delete-tracker-entry', { detail: { entryId, entryType } }));
            }
        });
    });
}

/**
 * Calculates and displays Total Income, Total Expenses, and Net Profit.
 * @param {Array<object>} entries - Array of financial entries.
 */
function calculateSummary(entries) {
    let totalIncome = 0;
    let totalExpenses = 0;

    entries.forEach(entry => {
        if (entry.type === 'invoice') {
            totalIncome += entry.amount;
        } else if (entry.type === 'expense') {
            totalExpenses += entry.amount;
        }
    });

    const netProfit = totalIncome - totalExpenses;

    document.getElementById('summary-income').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('summary-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('summary-profit').textContent = `$${netProfit.toFixed(2)}`;
    // Also update tracker-specific summary
    document.getElementById('tracker-total-income').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('tracker-total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('tracker-net-profit').textContent = `$${netProfit.toFixed(2)}`;
}


export {
    addEntry,
    getEntries,
    deleteEntry,
    renderEntries,
    calculateSummary
};