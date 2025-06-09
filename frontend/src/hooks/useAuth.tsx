import React, { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import { auth } from '../config/firebase.config';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';

interface User {
  email: string | null;
  uid: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

interface AuthContextType {
  user: User | null;
  signIn: (user: FirebaseUser) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          metadata: {
            creationTime: firebaseUser.metadata.creationTime,
            lastSignInTime: firebaseUser.metadata.lastSignInTime
          }
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = (firebaseUser: FirebaseUser) => {
    setUser({
      email: firebaseUser.email,
      uid: firebaseUser.uid,
      metadata: {
        creationTime: firebaseUser.metadata.creationTime,
        lastSignInTime: firebaseUser.metadata.lastSignInTime
      }
    });
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth; 