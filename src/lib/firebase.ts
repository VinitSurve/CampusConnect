
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let firebase_error: Error | null = null;

try {
  const requiredConfig: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId'];
  const missingConfig = requiredConfig.filter(key => !firebaseConfig[key]);

  if (missingConfig.length > 0) {
    const error = new Error(`Firebase configuration is missing or incomplete in your .env file.
Missing keys: ${missingConfig.join(', ')}

To fix this:
1. Go to your Firebase project console.
2. Navigate to Project Settings (click the gear icon ⚙️).
3. Under the "General" tab, scroll to the "Your apps" card.
4. Find and select your Web App.
5. Look for the 'firebaseConfig' object and copy the values.
6. Paste these values into the corresponding NEXT_PUBLIC_... variables in your .env file.
7. IMPORTANT: Restart the development server after saving the .env file.`);
    
    firebase_error = error;
    console.error("--- FIREBASE INIT ERROR ---");
    console.error(error.message);
    console.error("Firebase features will be disabled.");
    console.error("---------------------------");

  } else {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }

} catch (e) {
    firebase_error = e as Error;
    console.error("--- FIREBASE INIT ERROR ---");
    console.error(firebase_error.message);
    console.error("Firebase features will be disabled.");
    console.error("---------------------------");
}

export { app, auth, db, firebase_error };
