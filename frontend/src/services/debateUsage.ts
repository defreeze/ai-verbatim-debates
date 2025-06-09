import { db } from '../config/firebase.config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp,
  runTransaction,
  Transaction 
} from 'firebase/firestore';
import { DebateUsage } from '../types';

const DEBATE_USAGE_COLLECTION = 'debateUsage';
const INITIAL_FREE_DEBATES = 2;
const FREE_DEBATE_REFRESH_DAYS = 6;
const TEST_EMAIL = 'alexthevries@gmail.com';

const checkFreeDebateRefresh = (lastDebateTime: Timestamp): boolean => {
  const now = new Date();
  const lastDebateDate = lastDebateTime.toDate();
  const daysSinceLastDebate = (now.getTime() - lastDebateDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastDebate > FREE_DEBATE_REFRESH_DAYS;
};

const shouldResetTestAccount = (lastUpdate: Timestamp): boolean => {
  const now = new Date();
  const lastUpdateDate = lastUpdate.toDate();
  
  // Check if the last update was on a different calendar day
  return lastUpdateDate.getDate() !== now.getDate() ||
         lastUpdateDate.getMonth() !== now.getMonth() ||
         lastUpdateDate.getFullYear() !== now.getFullYear();
};

export const getDebateUsage = async (userId: string, userEmail: string | null): Promise<DebateUsage | null> => {
  try {
    console.log('Getting debate usage for:', { userId, userEmail });
    const docRef = doc(db, DEBATE_USAGE_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as DebateUsage;
      console.log('Existing debate usage:', data);
      
      // Special case for test account - case insensitive comparison and once per day
      if (userEmail?.toLowerCase() === TEST_EMAIL.toLowerCase() && 
          shouldResetTestAccount(data.updatedAt) && 
          data.freeDebatesRemaining < 100) {
        console.log('Test account detected, updating to 100 debates (daily reset)');
        const updatedData = {
          ...data,
          freeDebatesRemaining: 100,
          updatedAt: Timestamp.now()
        };
        await updateDoc(docRef, updatedData);
        return updatedData;
      }
      
      // Check if user should get a free debate refresh
      if (data.freeDebatesRemaining === 0 && checkFreeDebateRefresh(data.lastDebateStarted)) {
        const updatedData = {
          ...data,
          freeDebatesRemaining: 1,
          updatedAt: Timestamp.now()
        };
        await updateDoc(docRef, updatedData);
        return updatedData;
      }
      
      return data;
    }
    
    // Initialize debate usage for new users
    console.log('Initializing new debate usage');
    const now = Timestamp.now();
    const initialUsage: DebateUsage = {
      userId,
      totalDebates: 0,
      freeDebatesRemaining: userEmail?.toLowerCase() === TEST_EMAIL.toLowerCase() ? 100 : INITIAL_FREE_DEBATES,
      lastDebateStarted: now,
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(docRef, initialUsage);
    console.log('Created initial usage:', initialUsage);
    return initialUsage;
  } catch (error) {
    console.error('Error getting debate usage:', error);
    return null;
  }
};

export const incrementDebateCount = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, DEBATE_USAGE_COLLECTION, userId);
    
    // Use a transaction to ensure atomic updates
    await runTransaction(db, async (transaction: Transaction) => {
      const docSnap = await transaction.get(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as DebateUsage;
        console.log('Current debate data before increment:', data);
        
        // Check if user has free debates or should get a refresh
        let freeDebatesRemaining = data.freeDebatesRemaining;
        if (freeDebatesRemaining === 0 && checkFreeDebateRefresh(data.lastDebateStarted)) {
          freeDebatesRemaining = 1;
        }
        
        // Only decrement free debates if they have any
        if (freeDebatesRemaining > 0) {
          freeDebatesRemaining--;
        }
        
        const updateData = {
          totalDebates: data.totalDebates + 1,
          freeDebatesRemaining,
          lastDebateStarted: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log('Updating with transaction:', updateData);
        transaction.update(docRef, updateData);
      } else {
        // Initialize with first debate
        const now = Timestamp.now();
        const initialData = {
          userId,
          totalDebates: 1,
          freeDebatesRemaining: INITIAL_FREE_DEBATES - 1,
          lastDebateStarted: now,
          createdAt: now,
          updatedAt: now
        };
        console.log('Creating new debate usage with transaction:', initialData);
        transaction.set(docRef, initialData);
      }
    });
    
    console.log('Successfully completed debate count increment transaction');
  } catch (error) {
    console.error('Error in incrementDebateCount transaction:', error);
    throw error; // Re-throw to handle in the component
  }
}; 