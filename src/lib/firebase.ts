
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// A more helpful error message if the configuration is missing or empty.
if (!firebaseConfig.apiKey) {
    throw new Error(`Firebase configuration is missing in your .env file.

To fix this:
1. Go to your Firebase project console.
2. Navigate to Project Settings (click the gear icon ⚙️).
3. Under the "General" tab, scroll to the "Your apps" card.
4. Find and select your Web App.
5. Look for the 'firebaseConfig' object and copy the values.
6. Paste these values into the corresponding NEXT_PUBLIC_... variables in your .env file.
7. IMPORTANT: Restart the development server after saving the .env file.`);
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
