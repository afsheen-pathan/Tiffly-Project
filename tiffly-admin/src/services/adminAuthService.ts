// src/services/adminAuthService.ts
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export type SignInData = {
  email: string;
  password: string;
};

// Admin Sign In Function
export const signInAdmin = async (data: SignInData) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().role === 'admin') {
      return { user };
    } else {
      await firebaseSignOut(auth);
      return { error: 'Not authorized as admin.' };
    }
  } catch (error) { // Removed ': Error'
    // It's good practice to check if it's an error object before accessing properties
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error signing in admin: ", message);
    return { error };
  }
};

// Admin Sign Out Function
export const signOutAdmin = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) { // Removed ': Error'
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error signing out admin:", message);
    return { error };
  }
};