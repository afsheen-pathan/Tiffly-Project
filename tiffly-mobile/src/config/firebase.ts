// tiffly-mobile/src/config/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

// --- THIS IS THE NEW, CORRECT IMPORT ---
// We import initializeAuth AND the persistence layer from 'firebase/auth'
import { initializeAuth, indexedDBLocalPersistence } from 'firebase/auth'; 
// ----------------------------------------

// We still need this package, as Expo polyfills indexedDB with it.
// The 'npm install' command we ran earlier is all we need.
import '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration (this is correct)
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

// --- THIS IS THE FIX ---
// This tells Firebase (v10+) to use indexedDB for persistence.
// In React Native, Expo automatically makes this use AsyncStorage behind the scenes.
// This fixes the 'auth/configuration-not-found' error.
export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence 
});
// -----------------------

export const db = getFirestore(app);