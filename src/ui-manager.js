// src/ui-manager.js

// Cache commonly used DOM elements for performance
const appContainer = document.getElementById('app-container');
const loadingSpinner = document.getElementById('loading-spinner');
const loadingMessage = document.getElementById('loading-message');

const authPage = document.getElementById('auth-page');
const dashboardPage = document.getElementById('dashboard-page');
const quotePage = document.getElementById('quote-page');
const trackerPage = document.getElementById('tracker-page');
const settingsPage = document.getElementById('settings-page');

const allAppSections = document.querySelectorAll('.app-section');

/**
 * Hides all app sections and displays only the requested section.
 * @param {string} pageId - The ID of the section to display (e.g., 'auth-page', 'dashboard-page').
 */
function showPage(pageId) {
    allAppSections.forEach(section => {
        section.classList.add('hidden');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        // Ensure the scroll position is reset when switching pages
        appContainer.scrollTop = 0;
    } else {
        console.error(`Page with ID "${pageId}" not found.`);
    }
}

/**
 * Displays the loading spinner and message.
 */
function showLoadingSpinner() {
    loadingSpinner.classList.remove('hidden');
    loadingMessage.classList.remove('hidden');
}

/**
 * Hides the loading spinner and message.
 */
function hideLoadingSpinner() {
    loadingSpinner.classList.add('hidden');
    loadingMessage.classList.add('hidden');
}

/**
 * Displays a message (success or error) in a specified element.
 * @param {string} elementId - The ID of the HTML element where the message should be displayed.
 * @param {string} message - The message text.
 * @param {'success'|'error'|'clear'} type - The type of message ('success', 'error', or 'clear' to hide).
 * @param {number} duration - How long the message should be visible in milliseconds (default 5000).
 */
function displayMessage(elementId, message, type = 'clear', duration = 5000) {
    const messageElement = document.getElementById(elementId);
    if (!messageElement) {
        console.warn(`Message element with ID "${elementId}" not found.`);
        return;
    }

    // Clear previous classes and content
    messageElement.classList.remove('success-message', 'error-message');
    messageElement.textContent = '';
    messageElement.classList.add('hidden'); // Ensure it's hidden by default

    if (type === 'success' && message) {
        messageElement.textContent = message;
        messageElement.classList.add('success-message');
        messageElement.classList.remove('hidden');
    } else if (type === 'error' && message) {
        messageElement.textContent = message;
        messageElement.classList.add('error-message');
        messageElement.classList.remove('hidden');
    } else if (type === 'clear') {
        // Already cleared
    }

    // Auto-hide messages after a duration
    if (type !== 'clear' && duration > 0) {
        setTimeout(() => {
            messageElement.classList.add('hidden');
            messageElement.textContent = '';
        }, duration);
    }
}

// Utility functions to get references to frequently used HTML elements
// This can grow as you add more elements you frequently interact with
const getAuthElements = () => ({
    authForm: document.getElementById('auth-form'),
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    authSubmitBtn: document.getElementById('auth-submit-btn'),
    authGoogleBtn: document.getElementById('auth-google-btn'),
    authToggleText: document.getElementById('auth-toggle-text'),
    authToggleBtn: document.getElementById('auth-toggle-btn'),
    authErrorMessage: document.getElementById('auth-error-message')
});

const getDashboardElements = () => ({
    logoutBtn: document.getElementById('logout-btn'),
    generateQuoteBtn: document.getElementById('generate-quote-btn'),
    viewTrackerBtn: document.getElementById('view-tracker-btn'),
    companySettingsBtn: document.getElementById('company-settings-btn'),
    summaryIncome: document.getElementById('summary-income'),
    summaryExpenses: document.getElementById('summary-expenses'),
    summaryProfit: document.getElementById('summary-profit'),
    companyLogoHeader: document.getElementById('company-logo-header')
});

const getQuoteElements = () => ({
    backToDashboardFromQuote: document.getElementById('back-to-dashboard-from-quote'),
    quoteForm: document.getElementById('quote-form'),
    clientNameInput: document.getElementById('client-name'),
    quoteDateInput: document.getElementById('quote-date'),
    quoteItemsContainer: document.getElementById('quote-items-container'),
    addItemBtn: document.getElementById('add-item-btn'),
    quoteDiscountInput: document.getElementById('quote-discount'),
    quoteTaxInput: document.getElementById('quote-tax'),
    quoteSubtotalDisplay: document.getElementById('quote-subtotal'),
    quoteGrandTotalDisplay: document.getElementById('quote-grand-total'),
    copyQuoteBtn: document.getElementById('copy-quote-btn'),
    printQuoteBtn: document.getElementById('print-quote-btn'),
    saveQuoteBtn: document.getElementById('save-quote-btn'),
    quoteMessage: document.getElementById('quote-message'),
    companyLogoQuote: document.getElementById('company-logo-quote')
});

const getTrackerElements = () => ({
    backToDashboardFromTracker: document.getElementById('back-to-dashboard-from-tracker'),
    trackerTotalIncome: document.getElementById('tracker-total-income'),
    trackerTotalExpenses: document.getElementById('tracker-total-expenses'),
    trackerNetProfit: document.getElementById('tracker-net-profit'),
    addEntryForm: document.getElementById('add-entry-form'),
    entryType: document.getElementById('entry-type'),
    entryDescription: document.getElementById('entry-description'),
    entryAmount: document.getElementById('entry-amount'),
    entryDate: document.getElementById('entry-date'),
    entryCategory: document.getElementById('entry-category'),
    trackerEntriesList: document.getElementById('tracker-entries-list'),
    entryMessage: document.getElementById('entry-message'),
    companyLogoTracker: document.getElementById('company-logo-tracker')
});

const getSettingsElements = () => ({
    backToDashboardFromSettings: document.getElementById('back-to-dashboard-from-settings'),
    companySettingsForm: document.getElementById('company-settings-form'),
    logoUploadInput: document.getElementById('logo-upload'),
    currentLogoPreview: document.getElementById('current-logo-preview'),
    primaryColorPicker: document.getElementById('primary-color-picker'),
    secondaryColorPicker: document.getElementById('secondary-color-picker'),
    fontSelector: document.getElementById('font-selector'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    settingsMessage: document.getElementById('settings-message'),
    companyLogoSettings: document.getElementById('company-logo-settings')
});


export {
    showPage,
    showLoadingSpinner,
    hideLoadingSpinner,
    displayMessage,
    getAuthElements,
    getDashboardElements,
    getQuoteElements,
    getTrackerElements,
    getSettingsElements
};