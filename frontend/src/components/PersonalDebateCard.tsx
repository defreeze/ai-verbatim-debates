import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';

interface PersonalDebate {
  id: string;
  topic: string;
  userId: string;
  userDisplayName: string;
  timestamp: string;
  categories: string[];
  model1: {
    name: string;
    stance: number;
    rhetoricStyle: string;
  };
  model2: {
    name: string;
    stance: number;
    rhetoricStyle: string;
  };
  rounds: Array<{
    speaker: string;
    text: string;
    summary: string;
  }>;
}

interface PersonalDebateCardProps {
  debate: PersonalDebate;
}

const PersonalDebateCard: React.FC<PersonalDebateCardProps> = ({ debate }) => {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);

  const shareToPublic = async () => {
    if (!user) return;
    
    try {
      setIsSharing(true);
      
      // Get the debate from personal history
      const personalDebateRef = doc(db, `users/${user.uid}/debates/${debate.id}`);
      const personalDebateSnap = await getDoc(personalDebateRef);
      
      if (!personalDebateSnap.exists()) {
        throw new Error('Debate not found in personal history');
      }
      
      const debateData = personalDebateSnap.data();
      
      // Ensure we have a valid ID
      const debateId = debateData.id || debate.id;
      if (!debateId) {
        throw new Error('No valid debate ID found');
      }
      
      // Add public fields
      const publicDebateData = {
        ...debateData,
        id: debateId, // Ensure ID is included
        sharedAt: new Date().toISOString(),
        views: 0,
        upvotes: 1, // Start with creator's upvote
        downvotes: 0,
        votes: {
          [user.uid]: 'upvote' // Record creator's upvote
        }
      };
      
      // Use the same ID when creating the public debate
      const publicDebateRef = doc(db, 'public_debates', debateId);
      await setDoc(publicDebateRef, publicDebateData);
      
      setIsShared(true);
      setError({ type: 'success', message: 'Debate shared successfully!' });
      
    } catch (error) {
      console.error('Error sharing debate:', error);
      setError({ type: 'error', message: 'Failed to share debate. Please try again.' });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default PersonalDebateCard; 