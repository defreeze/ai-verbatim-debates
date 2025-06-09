import { Timestamp } from 'firebase/firestore';

export interface DebateUsage {
  userId: string;
  totalDebates: number;
  freeDebatesRemaining: number;
  lastDebateStarted: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface User {
  email: string | null;
  uid: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
} 