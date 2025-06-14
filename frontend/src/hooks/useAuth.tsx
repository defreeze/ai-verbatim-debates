import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getDebateUsage } from '../services/debateUsage';

// Extend the User type to include our custom properties
export interface User extends FirebaseUser {
  isPro?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<Omit<AuthState, 'signInWithGoogle' | 'signInWithGithub' | 'signInWithEmail' | 'signOut'>>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          // Combine Firebase user with additional data
          const user: User = {
            ...firebaseUser,
            isPro: userData?.isPro || false
          };
          
          setAuthState({ user, loading: false, error: null });
        } else {
          setAuthState({ user: null, loading: false, error: null });
        }
      } catch (error) {
        setAuthState({ 
          user: null, 
          loading: false, 
          error: error instanceof Error ? error : new Error('An unknown error occurred') 
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Helper function to create/update user document
  const createUserDocument = async (user: FirebaseUser) => {
    try {
      // Check if user document already exists
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // This is a new user, create their document
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isPro: false, // Default to free tier
          createdAt: Timestamp.now()
        });

        // Initialize debate usage for new user with 2 free debates
        await getDebateUsage(user.uid, user.email);
      } else {
        // Update existing user document
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          updatedAt: Timestamp.now()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to sign in with Google')
      }));
      throw error;
    }
  };

  const signInWithGithub = async () => {
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to sign in with GitHub')
      }));
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocument(result.user);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to sign in with email')
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to sign out')
      }));
      throw error;
    }
  };

  const value: AuthState = {
    ...authState,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 