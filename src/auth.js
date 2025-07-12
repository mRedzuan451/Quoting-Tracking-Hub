// src/auth.js
import { auth, db } from './firebase-config.js';
import { showPage, showLoadingSpinner, hideLoadingSpinner, displayMessage } from './ui-manager.js';

const USERS_COLLECTION = 'users';
const COMPANIES_COLLECTION = 'companies';

/**
 * Creates a new user with email and password.
 * Also creates a new company document for the user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
async function signUp(email, password) {
    showLoadingSpinner();
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create a new company document and link it to the user
        const companyRef = db.collection(COMPANIES_COLLECTION).doc(); // Auto-generate company ID
        await companyRef.set({
            ownerId: user.uid,
            name: `${user.email.split('@')[0]}'s Company`, // Default company name
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            settings: { // Default settings
                logoUrl: '',
                primaryColor: '#3498db',
                secondaryColor: '#2ecc71',
                fontFamily: 'Arial, sans-serif'
            }
        });

        // Update user's document to link to the new company
        await db.collection(USERS_COLLECTION).doc(user.uid).set({
            email: user.email,
            companyId: companyRef.id, // Store the auto-generated company ID
            role: 'owner', // Default role
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        displayMessage('auth-error-message', 'Account created successfully!', 'success');
        return userCredential;
    } catch (error) {
        console.error("Error signing up:", error);
        displayMessage('auth-error-message', error.message, 'error');
        throw error; // Re-throw to allow further handling if needed
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Signs in an existing user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
async function signIn(email, password) {
    showLoadingSpinner();
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        displayMessage('auth-error-message', 'Signed in successfully!', 'success');
        return userCredential;
    } catch (error) {
        console.error("Error signing in:", error);
        displayMessage('auth-error-message', error.message, 'error');
        throw error;
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Signs in with Google.
 * @returns {Promise<UserCredential>}
 */
async function signInWithGoogle() {
    showLoadingSpinner();
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const userCredential = await auth.signInWithPopup(provider);
        const user = userCredential.user;

        // Check if user already has a company associated
        const userDocRef = db.collection(USERS_COLLECTION).doc(user.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists || !userDoc.data().companyId) {
            // If new user or existing user without company, create a new company
            const companyRef = db.collection(COMPANIES_COLLECTION).doc();
            await companyRef.set({
                ownerId: user.uid,
                name: `${user.displayName || user.email.split('@')[0]}'s Company`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                settings: {
                    logoUrl: '',
                    primaryColor: '#3498db',
                    secondaryColor: '#2ecc71',
                    fontFamily: 'Arial, sans-serif'
                }
            });
            // Update user document with companyId
            await userDocRef.set({
                email: user.email,
                companyId: companyRef.id,
                role: 'owner',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }); // Use merge to update existing doc without overwriting
        } else {
            // If user already has a company, just ensure email is set if it wasn't
            await userDocRef.set({ email: user.email }, { merge: true });
        }

        displayMessage('auth-error-message', 'Signed in with Google successfully!', 'success');
        return userCredential;
    } catch (error) {
        console.error("Error signing in with Google:", error);
        displayMessage('auth-error-message', error.message, 'error');
        throw error;
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Signs out the current user.
 * @returns {Promise<void>}
 */
async function signOutUser() {
    showLoadingSpinner();
    try {
        await auth.signOut();
        displayMessage('auth-error-message', 'Signed out successfully!', 'success');
        showPage('auth-page'); // Redirect to login page after sign out
    } catch (error) {
        console.error("Error signing out:", error);
        displayMessage('auth-error-message', error.message, 'error');
        throw error;
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Sets up a listener for Firebase authentication state changes.
 * This is crucial for managing user sessions and UI updates.
 * @param {function} callback - Function to call with the user object (or null if logged out).
 */
function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}

/**
 * Retrieves a user's companyId and role from Firestore.
 * @param {string} userId
 * @returns {Promise<{companyId: string, role: string}|null>}
 */
async function getUserCompanyData(userId) {
    try {
        const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
        if (userDoc.exists) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching user company data:", error);
        return null;
    }
}

export {
    signUp,
    signIn,
    signInWithGoogle,
    signOutUser,
    onAuthStateChanged,
    getUserCompanyData
};