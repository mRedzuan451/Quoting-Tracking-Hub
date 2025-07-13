// src/firebase-config.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import Authentication service
import { getFirestore } from "firebase/firestore"; // Import Firestore service
import { getStorage } from "firebase/storage"; // Import Storage service

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBg6U1xu6hRjbgS5SyjBXa3QAbEb8LzEn0",
    authDomain: "quote-track-hub.firebaseapp.com",
    projectId: "quote-track-hub",
    storageBucket: "quote-track-hub.firebasestorage.app",
    messagingSenderId: "181893116482",
    appId: "1:181893116482:web:ac2ea5c9b348f9265b33db"
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