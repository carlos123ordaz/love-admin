import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
const firebaseConfig = {
    apiKey: "AIzaSyApwDsko4ePWR0aFxqJVoTQivMlWO-T3aw",
    authDomain: "lovepage-304fb.firebaseapp.com",
    projectId: "lovepage-304fb",
    storageBucket: "lovepage-304fb.firebasestorage.app",
    messagingSenderId: "609826567191",
    appId: "1:609826567191:web:665b6a148e647bca861852",
    measurementId: "G-8SDH3NRZQK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;