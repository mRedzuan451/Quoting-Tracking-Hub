// src/firebase-config.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import Authentication service
import { getFirestore } from "firebase/firestore"; // Import Firestore service
import { getStorage } from "firebase/storage"; // Import Storage service

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Get service instances using the new modular syntax
const auth = getAuth(app); // For Authentication
const db = getFirestore(app); // For Firestore Database
const storage = getStorage(app); // For Firebase Storage

// Export these instances so they can be imported and used in other modules
export { auth, db, storage };

console.log("Firebase initialized and services exported using modular SDK.");