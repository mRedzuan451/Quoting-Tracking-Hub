// src/company-settings.js
import { db, storage } from './firebase-config.js';
import { displayMessage, showLoadingSpinner, hideLoadingSpinner } from './ui-manager.js';

const COMPANIES_COLLECTION = 'companies';
const STORAGE_LOGOS_PATH = 'company_logos/';

/**
 * Fetches current company settings from Firestore.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object|null>} The settings object or null if not found.
 */
async function getCompanySettings(companyId) {
    if (!companyId) return null;
    showLoadingSpinner();
    try {
        const companyDoc = await db.collection(COMPANIES_COLLECTION).doc(companyId).get();
        if (companyDoc.exists && companyDoc.data().settings) {
            return companyDoc.data().settings;
        }
        return null;
    } catch (error) {
        console.error("Error fetching company settings:", error);
        displayMessage('settings-message', 'Failed to load settings.', 'error');
        return null;
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Saves updated company settings to Firestore.
 * @param {string} companyId - The ID of the company.
 * @param {object} newSettings - Object containing updated settings.
 * @returns {Promise<void>}
 */
async function updateCompanySettings(companyId, newSettings) {
    if (!companyId || !newSettings) throw new Error("Company ID and settings are required.");
    showLoadingSpinner();
    try {
        await db.collection(COMPANIES_COLLECTION).doc(companyId).update({
            settings: newSettings // Overwrite the entire settings object
        });
        displayMessage('settings-message', 'Settings updated successfully!', 'success');
    } catch (error) {
        console.error("Error updating company settings:", error);
        displayMessage('settings-message', 'Failed to save settings.', 'error');
        throw error;
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Uploads an image file to Firebase Storage and returns its public URL.
 * @param {string} companyId - The ID of the company.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} The public URL of the uploaded image.
 */
async function uploadCompanyLogo(companyId, file) {
    if (!companyId || !file) throw new Error("Company ID and file are required for logo upload.");
    showLoadingSpinner();
    try {
        const storageRef = storage.ref();
        const logoRef = storageRef.child(`${STORAGE_LOGOS_PATH}${companyId}/${file.name}`);
        const uploadTask = await logoRef.put(file);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        displayMessage('settings-message', 'Logo uploaded successfully!', 'success');
        return downloadURL;
    } catch (error) {
        console.error("Error uploading company logo:", error);
        displayMessage('settings-message', 'Failed to upload logo.', 'error');
        throw error;
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Applies company branding dynamically by updating CSS variables and logo image.
 * @param {object} settings - The company settings object.
 */
function applyCompanyBranding(settings) {
    if (!settings) {
        console.warn("No settings provided to apply branding.");
        return;
    }

    const root = document.documentElement; // Get the :root element

    // Apply colors
    if (settings.primaryColor) {
        root.style.setProperty('--primary-brand-color', settings.primaryColor);
        // Also update RGB components for rgba() usage if needed (e.g., box-shadow)
        // This requires converting hex to RGB. For simplicity, we'll assume a simpler usage for now.
    }
    if (settings.secondaryColor) {
        root.style.setProperty('--secondary-brand-color', settings.secondaryColor);
    }

    // Apply font family
    if (settings.fontFamily) {
        root.style.setProperty('--body-font-family', settings.fontFamily);
    }

    // Apply logo
    const logoElements = document.querySelectorAll('.header-logo'); // Get all elements with class 'header-logo'
    if (settings.logoUrl) {
        logoElements.forEach(img => {
            img.src = settings.logoUrl;
            img.classList.remove('hidden'); // Show the logo if URL exists
        });
    } else {
        logoElements.forEach(img => {
            img.src = ''; // Clear src if no logo
            img.classList.add('hidden'); // Hide if no logo
        });
    }
}

export {
    getCompanySettings,
    updateCompanySettings,
    uploadCompanyLogo,
    applyCompanyBranding
};