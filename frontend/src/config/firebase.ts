import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Check for missing config
if (Object.values(firebaseConfig).some(v => !v)) {
  throw new Error('Firebase configuration is missing. Please set all REACT_APP_FIREBASE_* variables in your .env file.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth and Firestore instances
const auth = getAuth(app);

// Ensure persistence is set before exporting or using auth
const setAuthPersistence = setPersistence(auth, browserLocalPersistence)
  .catch((err) => {
    console.error('Failed to set Firebase Auth persistence:', err);
  });

export { auth, setAuthPersistence };
export const db = getFirestore(app);

// Add some error handling for development
if (!process.env.REACT_APP_FIREBASE_API_KEY) {
  console.error(
    'Firebase configuration is missing. Make sure you have created a .env file with the required Firebase configuration.'
  );
} 