// Firebase Configuration
// Project: logincatalog-2441f (Super Cotizador)

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCpXrvyoCKxfUs9tCb785psnuXl4_FIySw",
    authDomain: "logincatalog-2441f.firebaseapp.com",
    projectId: "logincatalog-2441f",
    storageBucket: "logincatalog-2441f.firebasestorage.app",
    messagingSenderId: "614182702115",
    appId: "1:614182702115:web:08fd151773aa9f56b63596",
    measurementId: "G-GPS5X4Q3Z0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth, Firestore, and Storage instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

