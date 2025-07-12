// src/firebase-config.js

// Firebase configuration object - REPLACE WITH YOUR OWN CONFIG!
// You can find this in your Firebase project settings -> Project settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
    // measurementId: "G-YOUR_MEASUREMENT_ID" // Optional, if you're using Google Analytics
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Get service instances
const auth = firebase.auth(); // For Authentication
const db = firebase.firestore(); // For Firestore Database
const storage = firebase.storage(); // For Firebase Storage

// Export these instances so they can be imported and used in other modules
export { auth, db, storage };

console.log("Firebase initialized and services exported.");