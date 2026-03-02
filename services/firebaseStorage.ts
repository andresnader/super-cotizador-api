// Firebase Storage Service
// Handles file uploads (logo, etc.) to Firebase Storage

import { storage } from './firebase';
import { getCurrentUserId } from './firebaseAuth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Upload a logo file to Firebase Storage
 * Returns the public download URL
 */
export async function uploadLogo(file: File): Promise<string> {
    const userId = getCurrentUserId();
    const extension = file.name.split('.').pop() || 'png';
    const storageRef = ref(storage, `users/${userId}/logo.${extension}`);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
}

/**
 * Upload a base64 data URL as logo to Firebase Storage
 * Useful for migrating existing base64 logos
 */
export async function uploadLogoFromDataURL(dataURL: string): Promise<string> {
    const userId = getCurrentUserId();

    // Convert data URL to blob
    const response = await fetch(dataURL);
    const blob = await response.blob();

    const extension = blob.type.split('/')[1] || 'png';
    const storageRef = ref(storage, `users/${userId}/logo.${extension}`);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
}
