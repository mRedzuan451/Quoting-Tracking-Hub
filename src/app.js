// src/app.js
import { auth, db } from './firebase-config.js'; // Ensure db is imported if used directly here
import {
    signUp, signIn, signInWithGoogle, signOutUser, onAuthStateChanged, getUserCompanyData
} from './auth.js';
import {
    getCompanySettings, updateCompanySettings, uploadCompanyLogo, applyCompanyBranding
} from './company-settings.js';
import {
    addQuoteItemRow, calculateQuoteTotals, getQuoteData, formatQuoteText, printQuote, saveQuoteAsInvoice, attachQuoteItemListeners, resetQuoteForm
} from './quote-generator.js';
import {
    addEntry, getEntries, deleteEntry, renderEntries, calculateSummary
} from './financial-tracker.js';
import {
    showPage, showLoadingSpinner, hideLoadingSpinner, displayMessage,
    getAuthElements, getDashboardElements, getQuoteElements, getTrackerElements, getSettingsElements
} from './ui-manager.js';

// Global variables for current user and company data
let currentUser = null;
let currentCompanyId = null;

// Get references to all necessary UI elements
const ui = {
    auth: getAuthElements(),
    dashboard: getDashboardElements(),
    quote: getQuoteElements(),
    tracker: getTrackerElements(),
    settings: getSettingsElements(),
};

/**
 * Initializes the application by setting up auth state listener and event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    showLoadingSpinner();
    setupEventListeners();
    initializeAuthStateListener();
    resetQuoteForm(); // Initialize quote form with one row and current date
    ui.quote.quoteDateInput.valueAsDate = new Date(); // Set current date for quote form
    ui.tracker.entryDate.valueAsDate = new Date(); // Set current date for tracker entry form
});

/**
 * Sets up all global and component-specific event listeners.
 */
function setupEventListeners() {
    // --- Auth Page Listeners ---
    ui.auth.authForm.addEventListener('submit', handleAuthFormSubmit);
    ui.auth.authGoogleBtn.addEventListener('click', signInWithGoogle);
    ui.auth.authToggleBtn.addEventListener('click', toggleAuthMode);

    // --- Dashboard Page Listeners ---
    ui.dashboard.logoutBtn.addEventListener('click', signOutUser);
    ui.dashboard.generateQuoteBtn.addEventListener('click', () => {
        showPage('quote-page');
        resetQuoteForm(); // Ensure quote form is fresh
    });
    ui.dashboard.viewTrackerBtn.addEventListener('click', async () => {
        showPage('tracker-page');
        if (currentCompanyId) {
            await getEntries(currentCompanyId); // Load tracker data
        }
    });
    ui.dashboard.companySettingsBtn.addEventListener('click', async () => {
        showPage('settings-page');
        if (currentCompanyId) {
            const settings = await getCompanySettings(currentCompanyId);
            if (settings) {
                // Populate settings form
                ui.settings.primaryColorPicker.value = settings.primaryColor || '#3498db';
                ui.settings.secondaryColorPicker.value = settings.secondaryColor || '#2ecc71';
                ui.settings.fontSelector.value = settings.fontFamily || 'Arial, sans-serif';
                if (settings.logoUrl) {
                    ui.settings.currentLogoPreview.src = settings.logoUrl;
                    ui.settings.currentLogoPreview.classList.remove('hidden');
                } else {
                    ui.settings.currentLogoPreview.classList.add('hidden');
                    ui.settings.currentLogoPreview.src = '';
                }
            }
        }
    });

    // --- Quote Generator Page Listeners ---
    ui.quote.backToDashboardFromQuote.addEventListener('click', () => showPage('dashboard-page'));
    ui.quote.addItemBtn.addEventListener('click', addQuoteItemRow);
    ui.quote.quoteItemsContainer.addEventListener('input', (event) => {
        // Event delegation for dynamically added item inputs
        if (event.target.classList.contains('item-quantity') || event.target.classList.contains('item-price')) {
            const row = event.target.closest('.quote-item');
            const qty = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const itemTotal = qty * price;
            row.querySelector('.item-total').textContent = `$${itemTotal.toFixed(2)}`;
            calculateQuoteTotals();
        }
    });
    ui.quote.quoteItemsContainer.addEventListener('click', (event) => {
        // Event delegation for dynamically added remove buttons
        if (event.target.classList.contains('remove-item-btn')) {
            if (document.querySelectorAll('.quote-item').length > 1) { // Ensure at least one row remains
                event.target.closest('.quote-item').remove();
                calculateQuoteTotals();
            } else {
                displayMessage('quote-message', 'Cannot remove the last quote item.', 'error');
            }
        }
    });

    ui.quote.quoteDiscountInput.addEventListener('input', calculateQuoteTotals);
    ui.quote.quoteTaxInput.addEventListener('input', calculateQuoteTotals);
    ui.quote.copyQuoteBtn.addEventListener('click', handleCopyQuote);
    ui.quote.printQuoteBtn.addEventListener('click', printQuote);
    ui.quote.quoteForm.addEventListener('submit', handleSaveQuote);

    // --- Financial Tracker Page Listeners ---
    ui.tracker.backToDashboardFromTracker.addEventListener('click', () => showPage('dashboard-page'));
    ui.tracker.addEntryForm.addEventListener('submit', handleAddEntry);
    // Listen for custom event from financial-tracker.js to trigger deletion
    document.addEventListener('delete-tracker-entry', (event) => {
        const { entryId, entryType } = event.detail;
        if (currentCompanyId) {
            deleteEntry(currentCompanyId, entryType, entryId);
        }
    });

    // --- Company Settings Page Listeners ---
    ui.settings.backToDashboardFromSettings.addEventListener('click', () => showPage('dashboard-page'));
    ui.settings.companySettingsForm.addEventListener('submit', handleSaveSettings);
    ui.settings.logoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                ui.settings.currentLogoPreview.src = e.target.result;
                ui.settings.currentLogoPreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            ui.settings.currentLogoPreview.src = '';
            ui.settings.currentLogoPreview.classList.add('hidden');
        }
    });

    // Initialize the single quote item's listeners
    if (document.querySelector('.quote-item')) {
        attachQuoteItemListeners(document.querySelector('.quote-item'));
    }
}

/**
 * Handles the authentication form submission (Login/Signup).
 * @param {Event} event
 */
async function handleAuthFormSubmit(event) {
    event.preventDefault();
    const email = ui.auth.authEmail.value;
    const password = ui.auth.authPassword.value;
    const isSigningUp = ui.auth.authSubmitBtn.textContent.toLowerCase() === 'sign up';

    displayMessage('auth-error-message', '', 'clear'); // Clear previous messages

    if (isSigningUp) {
        await signUp(email, password);
    } else {
        await signIn(email, password);
    }
}

/**
 * Toggles between Login and Signup modes on the auth page.
 */
function toggleAuthMode() {
    if (ui.auth.authSubmitBtn.textContent.toLowerCase() === 'login') {
        ui.auth.authSubmitBtn.textContent = 'Sign Up';
        ui.auth.authToggleText.textContent = 'Already have an account?';
        ui.auth.authToggleBtn.textContent = 'Login';
    } else {
        ui.auth.authSubmitBtn.textContent = 'Login';
        ui.auth.authToggleText.textContent = "Don't have an account?";
        ui.auth.authToggleBtn.textContent = 'Sign Up';
    }
    displayMessage('auth-error-message', '', 'clear'); // Clear messages on toggle
}

/**
 * Handles copying quote text to clipboard.
 */
async function handleCopyQuote() {
    const quoteData = getQuoteData();
    const formattedText = formatQuoteText(quoteData);
    try {
        await navigator.clipboard.writeText(formattedText);
        displayMessage('quote-message', 'Quote copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy quote: ', err);
        displayMessage('quote-message', 'Failed to copy quote to clipboard.', 'error');
    }
}

/**
 * Handles saving the quote as an invoice.
 * @param {Event} event
 */
async function handleSaveQuote(event) {
    event.preventDefault();
    displayMessage('quote-message', '', 'clear'); // Clear previous messages

    const quoteData = getQuoteData();
    if (!quoteData.clientName || quoteData.items.length === 0 || quoteData.grandTotal === 0) {
        displayMessage('quote-message', 'Please fill in client name and add at least one item with a valid amount.', 'error');
        return;
    }

    if (currentUser && currentCompanyId) {
        await saveQuoteAsInvoice(quoteData, currentCompanyId, currentUser.uid);
    } else {
        displayMessage('quote-message', 'User not authenticated or company ID not found.', 'error');
    }
}

/**
 * Handles adding a new financial entry.
 * @param {Event} event
 */
async function handleAddEntry(event) {
    event.preventDefault();
    displayMessage('entry-message', '', 'clear'); // Clear previous messages

    const type = ui.tracker.entryType.value;
    const description = ui.tracker.entryDescription.value.trim();
    const amount = parseFloat(ui.tracker.entryAmount.value);
    const date = ui.tracker.entryDate.value;
    const category = ui.tracker.entryCategory.value.trim();

    if (!description || isNaN(amount) || amount <= 0 || !date) {
        displayMessage('entry-message', 'Please fill in description, a valid amount, and date.', 'error');
        return;
    }

    if (currentUser && currentCompanyId) {
        await addEntry(currentCompanyId, currentUser.uid, type, description, amount, date, category);
    } else {
        displayMessage('entry-message', 'User not authenticated or company ID not found.', 'error');
    }
}

/**
 * Handles saving company settings.
 * @param {Event} event
 */
async function handleSaveSettings(event) {
    event.preventDefault();
    displayMessage('settings-message', '', 'clear'); // Clear previous messages

    if (!currentCompanyId) {
        displayMessage('settings-message', 'Company ID not found. Cannot save settings.', 'error');
        return;
    }

    const newSettings = {
        primaryColor: ui.settings.primaryColorPicker.value,
        secondaryColor: ui.settings.secondaryColorPicker.value,
        fontFamily: ui.settings.fontSelector.value,
        logoUrl: ui.settings.currentLogoPreview.src // Use current preview src as base
    };

    const logoFile = ui.settings.logoUploadInput.files[0];
    if (logoFile) {
        try {
            const logoUrl = await uploadCompanyLogo(currentCompanyId, logoFile);
            newSettings.logoUrl = logoUrl; // Update with new uploaded URL
        } catch (error) {
            console.error("Error uploading logo during settings save:", error);
            // Don't block saving other settings if logo upload fails
            displayMessage('settings-message', 'Logo upload failed, but other settings may be saved.', 'error');
        }
    }

    try {
        await updateCompanySettings(currentCompanyId, newSettings);
        applyCompanyBranding(newSettings); // Apply immediately after saving
        displayMessage('settings-message', 'Company settings saved successfully!', 'success');
    } catch (error) {
        console.error("Error saving company settings:", error);
        displayMessage('settings-message', 'Failed to save company settings.', 'error');
    }
}

/**
 * Initializes and manages the Firebase authentication state listener.
 */
function initializeAuthStateListener() {
    onAuthStateChanged(async (user) => {
        currentUser = user;
        hideLoadingSpinner();
        if (user) {
            console.log("User logged in:", user.uid);
            try {
                const userData = await getUserCompanyData(user.uid);
                if (userData && userData.companyId) {
                    currentCompanyId = userData.companyId;
                    console.log("User company ID:", currentCompanyId);
                    const companySettings = await getCompanySettings(currentCompanyId);
                    if (companySettings) {
                        applyCompanyBranding(companySettings);
                    } else {
                        console.warn("No company settings found for this company ID.");
                        // Apply default branding if no settings found
                        applyCompanyBranding({
                            logoUrl: '',
                            primaryColor: '#3498db',
                            secondaryColor: '#2ecc71',
                            fontFamily: 'Arial, sans-serif'
                        });
                    }
                    showPage('dashboard-page');
                    await getEntries(currentCompanyId); // Load initial tracker data for dashboard summary
                } else {
                    console.log("User document or companyId not found for:", user.uid);
                    showPage('auth-page'); // Force back to auth if no company link
                    displayMessage('auth-error-message', 'Please sign up or ensure your account has a company associated.', 'error');
                }
            } catch (error) {
                console.error("Error during auth state change processing:", error);
                showPage('auth-page'); // Fallback to auth page on error
                displayMessage('auth-error-message', 'An error occurred. Please try again.', 'error');
            }
        } else {
            console.log("User logged out.");
            currentUser = null;
            currentCompanyId = null;
            showPage('auth-page');
        }
    });
}