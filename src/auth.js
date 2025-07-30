// src/auth.js
import { auth, db } from './firebase-config.js';
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged as onFirebaseAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp, collection } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create a new company document and link it to the user
        const companyRef = doc(collection(db, COMPANIES_COLLECTION));
        await setDoc(companyRef, {
            ownerId: user.uid,
            name: `${user.email.split('@')[0]}'s Company`, // Default company name
            createdAt: serverTimestamp(),
            settings: { // Default settings
                logoUrl: '',
                primaryColor: '#3498db',
                secondaryColor: '#2ecc71',
                fontFamily: 'Arial, sans-serif'
            }
        });

        // Update user's document to link to the new company
        await setDoc(doc(db, USERS_COLLECTION, user.uid), {
            email: user.email,
            companyId: companyRef.id, // Store the auto-generated company ID
            role: 'owner', // Default role
            createdAt: serverTimestamp()
        });

        displayMessage('auth-error-message', 'Account created successfully!', 'success');
        return userCredential;
    } catch (error) {
        console.error("Error signing up:", error);
        displayMessage('auth-error-message', error.message, 'error');
        throw error;
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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        const userDocRef = doc(db, USERS_COLLECTION, user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists() || !userDoc.data().companyId) {
            const companyRef = doc(collection(db, COMPANIES_COLLECTION));
            await setDoc(companyRef, {
                ownerId: user.uid,
                name: `${user.displayName || user.email.split('@')[0]}'s Company`,
                createdAt: serverTimestamp(),
                settings: {
                    logoUrl: '',
                    primaryColor: '#3498db',
                    secondaryColor: '#2ecc71',
                    fontFamily: 'Arial, sans-serif'
                }
            });
            await setDoc(userDocRef, {
                email: user.email,
                companyId: companyRef.id,
                role: 'owner',
                createdAt: serverTimestamp()
            }, { merge: true });
        } else {
            await setDoc(userDocRef, { email: user.email }, { merge: true });
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
        await signOut(auth);
        displayMessage('auth-error-message', 'Signed out successfully!', 'success');
        showPage('auth-page');
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
 * @param {function} callback - Function to call with the user object (or null if logged out).
 */
function onAuthStateChanged(callback) {
    return onFirebaseAuthStateChanged(auth, callback);
}

/**
 * Retrieves a user's companyId and role from Firestore.
 * @param {string} userId
 * @returns {Promise<{companyId: string, role: string}|null>}
 */
async function getUserCompanyData(userId) {
    try {
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
        if (userDoc.exists()) {
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