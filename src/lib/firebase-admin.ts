
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Ensure environment variables are loaded
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK cannot be initialized.");
}

// Initialize Firebase Admin once
function initializeAdmin(): Firestore {
  const apps = getApps();
  
  if (apps.length > 0) {
    return getFirestore(apps[0]);
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountString) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or empty.");
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    });
  } catch(e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it's a valid JSON string.", e);
    throw new Error("Firebase Admin initialization failed.");
  }
  
  return getFirestore();
}

const adminDb = initializeAdmin();

export { adminDb };
