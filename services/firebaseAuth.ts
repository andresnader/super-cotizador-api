// Firebase Authentication Service
// Replaces the Google OAuth logic from google.ts

import { auth } from './firebase';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

/**
 * Sign in with Google via Firebase Auth popup
 */
export async function signInWithGoogle(): Promise<{
    user: User;
    userInfo: { name: string; email: string; picture: string };
}> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    return {
        user,
        userInfo: {
            name: user.displayName || 'Usuario',
            email: user.email || '',
            picture: user.photoURL || ''
        }
    };
}

/**
 * Sign out from Firebase
 */
export async function signOutFirebase(): Promise<void> {
    await firebaseSignOut(auth);
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

/**
 * Get current user's UID (used as document path in Firestore)
 */
export function getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) throw new Error('No user is currently signed in');
    return user.uid;
}

/**
 * Listen for auth state changes
 * Returns an unsubscribe function
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
}

export type { User };
