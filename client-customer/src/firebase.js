// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
console.log("Firebase Config Loaded:", {
    apiKeyPresent: !!firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    domain: firebaseConfig.authDomain
});

// Initialize Firebase only if config is present
let app;
let auth;

if (firebaseConfig.apiKey) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
    } catch (e) {
        console.error("Firebase Init Failed:", e);
    }
} else {
    console.warn("Firebase Config missing completely. Phone auth will not work.");
}

export { auth };

// Helper to setup Recaptcha
export const setupRecaptcha = (buttonId) => {
    if (!auth) {
        console.error("Firebase Auth not initialized (Missing Config)");
        return null;
    }
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
                console.log('Recaptcha Verified');
            }
        });
    }
    return window.recaptchaVerifier;
};
