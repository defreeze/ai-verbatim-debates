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

export interface Backer {
  name: string;
  amount: number; // in USD or relevant currency
  message?: string;
  date: string; // ISO string
} 