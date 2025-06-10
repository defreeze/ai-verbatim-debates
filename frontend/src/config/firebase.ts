import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEwhogPgxMC0ogq2nTWa62yrqgxMhMDRk",
  authDomain: "ai-verbatim.firebaseapp.com",
  projectId: "ai-verbatim",
  storageBucket: "ai-verbatim.firebasestorage.app",
  messagingSenderId: "1081214572617",
  appId: "1:1081214572617:web:b3bc0abd5224ea27cc8798"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Add some error handling for development
if (!process.env.REACT_APP_FIREBASE_API_KEY) {
  console.error(
    'Firebase configuration is missing. Make sure you have created a .env file with the required Firebase configuration.'
  );
} 