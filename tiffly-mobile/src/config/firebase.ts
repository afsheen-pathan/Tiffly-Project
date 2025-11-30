import { initializeApp } from 'firebase/app';
// 1. Import these new auth functions
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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

// 2. Initialize Auth with Persistence
// This tells Firebase: "Save the user's login to the phone's storage"
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };