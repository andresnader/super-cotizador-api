import { GOOGLE_CONFIG } from '../config/google';

// Declare global types for Google APIs
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

// Callback for when both GAPI and GIS are loaded
const checkAndEnableAuth = () => {
    if (gapiInited && gisInited) {
        console.log('Google APIs initialized successfully');
    }
};

// Initialize GAPI client
export const initGapi = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.gapi.load('client', {
                callback: async () => {
                    try {
                        await window.gapi.client.init({
                            discoveryDocs: GOOGLE_CONFIG.DISCOVERY_DOCS,
                        });
                        gapiInited = true;
                        checkAndEnableAuth();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: () => reject(new Error('Failed to load GAPI client'))
            });
        };
        script.onerror = () => reject(new Error('Failed to load GAPI script'));
        document.body.appendChild(script);
    });
};

// Initialize GIS (Google Identity Services)
export const initGis = (tokenCallback: (response: any) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CONFIG.CLIENT_ID,
                scope: GOOGLE_CONFIG.SCOPES,
                callback: tokenCallback,
            });
            gisInited = true;
            checkAndEnableAuth();
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load GIS script'));
        document.body.appendChild(script);
    });
};

// Request access token
export const requestAccessToken = (prompt: 'consent' | '' = '') => {
    if (!tokenClient) {
        throw new Error('Token client not initialized');
    }
    tokenClient.requestAccessToken({ prompt });
};

// Set the access token
export const setAccessToken = (token: any) => {
    window.gapi.client.setToken(token);
};

// Revoke token
export const revokeToken = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
            window.gapi.client.setToken(null);
        });
    }
};

// Check if user is signed in
export const isSignedIn = (): boolean => {
    const token = window.gapi?.client?.getToken();
    return token !== null && token !== undefined;
};

// Get current user info
export const getUserInfo = async () => {
    if (!isSignedIn()) {
        throw new Error('User not signed in');
    }

    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${window.gapi.client.getToken().access_token}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw error;
    }
};
