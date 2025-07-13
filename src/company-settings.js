// src/company-settings.js
import { db, storage } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Modular Firestore imports
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Modular Storage imports
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
        const companyDocRef = doc(db, COMPANIES_COLLECTION, companyId); // Modular doc
        const companyDoc = await getDoc(companyDocRef); // Modular getDoc
        if (companyDoc.exists() && companyDoc.data().settings) { // .exists() for modular
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
        const companyDocRef = doc(db, COMPANIES_COLLECTION, companyId); // Modular doc
        await updateDoc(companyDocRef, { // Modular updateDoc
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
        const logoRef = ref(storage, `${STORAGE_LOGOS_PATH}${companyId}/${file.name}`); // Modular ref
        const uploadTaskSnapshot = await uploadBytes(logoRef, file); // Modular uploadBytes
        const downloadURL = await getDownloadURL(uploadTaskSnapshot.ref); // Modular getDownloadURL
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