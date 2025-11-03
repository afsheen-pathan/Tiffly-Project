// tiffly-admin/src/config/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Use getAuth for web

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvXcYlDZS6ksen8VYoMd0SUwpoSQUmvxw",
  authDomain: "tiffly-app.firebaseapp.com",
  projectId: "tiffly-app",
  storageBucket: "tiffly-app.firebasestorage.app",
  messagingSenderId: "672010256347",
  appId: "1:672010256347:web:4fbd19d39927e4292d71fe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- ADD THESE LINES ---
// Standard web exports
export const auth = getAuth(app);
export const db = getFirestore(app);