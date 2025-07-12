// src/quote-generator.js
import { db } from './firebase-config.js';
import { displayMessage, showLoadingSpinner, hideLoadingSpinner } from './ui-manager.js';

const COMPANIES_COLLECTION = 'companies';

/**
 * Adds a new empty item row to the quote form dynamically.
 */
function addQuoteItemRow() {
    const container = document.getElementById('quote-items-container');
    const newRow = document.createElement('div');
    newRow.classList.add('quote-item');
    newRow.innerHTML = `
        <input type="text" class="item-description" placeholder="Description" required>
        <input type="number" class="item-quantity" placeholder="Qty" min="1" value="1" required>
        <input type="number" class="item-price" placeholder="Unit Price" step="0.01" min="0" required>
        <span class="item-total">$0.00</span>
        <button type="button" class="btn-danger remove-item-btn">X</button>
    `;
    container.appendChild(newRow);
    attachQuoteItemListeners(newRow); // Re-attach listeners for new row
    calculateQuoteTotals(); // Recalculate totals
}

/**
 * Attaches event listeners to quantity and price inputs within a quote item row.
 * @param {HTMLElement} rowElement - The HTML element of the quote item row.
 */
function attachQuoteItemListeners(rowElement) {
    const quantityInput = rowElement.querySelector('.item-quantity');
    const priceInput = rowElement.querySelector('.item-price');
    const removeBtn = rowElement.querySelector('.remove-item-btn');

    const updateItemTotal = () => {
        const qty = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const itemTotal = qty * price;
        rowElement.querySelector('.item-total').textContent = `$${itemTotal.toFixed(2)}`;
        calculateQuoteTotals();
    };

    quantityInput.addEventListener('input', updateItemTotal);
    priceInput.addEventListener('input', updateItemTotal);

    removeBtn.addEventListener('click', (event) => {
        if (document.querySelectorAll('.quote-item').length > 1) { // Ensure at least one row remains
            event.target.closest('.quote-item').remove();
            calculateQuoteTotals();
        } else {
            displayMessage('quote-message', 'Cannot remove the last quote item.', 'error');
        }
    });
}

/**
 * Calculates subtotal, discount, tax, and grand total in real-time.
 */
function calculateQuoteTotals() {
    let subtotal = 0;
    document.querySelectorAll('.quote-item').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        subtotal += qty * price;
    });

    const discountPercent = parseFloat(document.getElementById('quote-discount').value) || 0;
    const taxPercent = parseFloat(document.getElementById('quote-tax').value) || 0;

    const discountAmount = subtotal * (discountPercent / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * (taxPercent / 100);
    const grandTotal = subtotalAfterDiscount + taxAmount;

    document.getElementById('quote-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('quote-grand-total').textContent = `$${grandTotal.toFixed(2)}`;
}

/**
 * Resets the quote generator form to its initial state.
 */
function resetQuoteForm() {
    document.getElementById('quote-form').reset();
    document.getElementById('quote-date').valueAsDate = new Date(); // Set current date
    document.getElementById('quote-items-container').innerHTML = `
        <div class="quote-item">
            <input type="text" class="item-description" placeholder="Description" required>
            <input type="number" class="item-quantity" placeholder="Qty" min="1" value="1" required>
            <input type="number" class="item-price" placeholder="Unit Price" step="0.01" min="0" required>
            <span class="item-total">$0.00</span>
            <button type="button" class="btn-danger remove-item-btn">X</button>
        </div>
    `;
    attachQuoteItemListeners(document.querySelector('.quote-item')); // Attach listeners to the initial row
    calculateQuoteTotals();
    displayMessage('quote-message', '', 'clear'); // Clear any previous messages
}


/**
 * Gathers current quote data from the form.
 * @returns {object} The structured quote data.
 */
function getQuoteData() {
    const clientName = document.getElementById('client-name').value;
    const quoteDate = document.getElementById('quote-date').value;
    const discount = parseFloat(document.getElementById('quote-discount').value) || 0;
    const tax = parseFloat(document.getElementById('quote-tax').value) || 0;

    const items = [];
    document.querySelectorAll('.quote-item').forEach(row => {
        const description = row.querySelector('.item-description').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const unitPrice = parseFloat(row.querySelector('.item-price').value) || 0;
        items.push({ description, quantity, unitPrice });
    });

    // Recalculate totals definitively before returning
    let subtotal = 0;
    items.forEach(item => subtotal += item.quantity * item.unitPrice);

    const discountAmount = subtotal * (discount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * (tax / 100);
    const grandTotal = subtotalAfterDiscount + taxAmount;

    return {
        clientName,
        quoteDate,
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discountPercent: discount,
        taxPercent: tax,
        grandTotal: parseFloat(grandTotal.toFixed(2)),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
}


/**
 * Formats the quote data into a readable string for copying.
 * @param {object} quoteData - The structured quote data.
 * @returns {string} The formatted quote text.
 */
function formatQuoteText(quoteData) {
    let text = `Quote for: ${quoteData.clientName}\n`;
    text += `Date: ${quoteData.quoteDate}\n\n`;
    text += "Items:\n";
    quoteData.items.forEach(item => {
        text += `- ${item.description} (Qty: ${item.quantity}) @ $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}\n`;
    });
    text += `\nSubtotal: $${quoteData.subtotal.toFixed(2)}\n`;
    if (quoteData.discountPercent > 0) {
        text += `Discount (${quoteData.discountPercent}%): $${(quoteData.subtotal * (quoteData.discountPercent / 100)).toFixed(2)}\n`;
    }
    if (quoteData.taxPercent > 0) {
        const subtotalAfterDiscount = quoteData.subtotal * (1 - (quoteData.discountPercent / 100));
        text += `Tax (${quoteData.taxPercent}%): $${(subtotalAfterDiscount * (quoteData.taxPercent / 100)).toFixed(2)}\n`;
    }
    text += `Grand Total: $${quoteData.grandTotal.toFixed(2)}`;
    return text;
}

/**
 * Triggers the browser's print dialog for the current page content.
 */
function printQuote() {
    window.print(); // Simple way to print current page content
}

/**
 * Saves the current quote as a quote document and creates an invoice entry.
 * @param {object} quoteData - The structured quote data.
 * @param {string} companyId - The ID of the company.
 * @param {string} userId - The ID of the current user.
 * @returns {Promise<void>}
 */
async function saveQuoteAsInvoice(quoteData, companyId, userId) {
    if (!companyId || !userId) {
        displayMessage('quote-message', 'Authentication error: Company or user ID missing.', 'error');
        return;
    }
    showLoadingSpinner();
    try {
        // Save the full quote object
        const quoteRef = await db.collection(COMPANIES_COLLECTION).doc(companyId)
                                 .collection('quotes').add(quoteData);
        console.log("Quote saved with ID:", quoteRef.id);

        // Create a simplified invoice entry from the quote
        const invoiceEntry = {
            type: 'invoice',
            description: `Invoice for ${quoteData.clientName} (Quote ID: ${quoteRef.id.substring(0, 8)})`,
            amount: quoteData.grandTotal,
            date: quoteData.quoteDate,
            category: 'Quote/Project',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            quoteRef: quoteRef.id // Reference to the original quote
        };

        await db.collection(COMPANIES_COLLECTION).doc(companyId)
                .collection('invoices').add(invoiceEntry);

        displayMessage('quote-message', 'Quote saved and added to tracker successfully!', 'success');
        resetQuoteForm(); // Clear form after saving
    } catch (error) {
        console.error("Error saving quote as invoice:", error);
        displayMessage('quote-message', 'Failed to save quote and add to tracker.', 'error');
    } finally {
        hideLoadingSpinner();
    }
}

export {
    addQuoteItemRow,
    calculateQuoteTotals,
    getQuoteData,
    formatQuoteText,
    printQuote,
    saveQuoteAsInvoice,
    attachQuoteItemListeners, // Exported to be called initially by app.js
    resetQuoteForm // Exported for external reset if needed
};