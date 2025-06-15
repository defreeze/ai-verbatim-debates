import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, increment, deleteField, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { Link } from 'react-router-dom';
import { FaStar as FaStarIcon } from 'react-icons/fa';

interface PublicDebate {
  id: string;
  topic: string;
  userId: string;
  userDisplayName: string;
  timestamp: string;
  sharedAt: string;
  views: number;
  upvotes: number;
  downvotes: number;
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

type SortOption = 'newest' | 'popular' | 'controversial';
type TimeFilter = 'all' | 'today' | 'week' | 'month';
type VoteType = 'upvote' | 'downvote';

// Add categories constant
const categories = [
  'Politics',
  'Technology',
  'Philosophy',
  'Science',
  'Society',
  'Economics',
  'Environment',
  'Ethics',
  'Culture',
  'Funny'
];

// Replace FaStarIcon with a 4-pointed star SVG inline component
const FourPointStarIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <polygon points="12,3 15,12 12,21 9,12" />
    <polygon points="3,12 12,15 21,12 12,9" />
  </svg>
);

const CommunityLibrary: React.FC = () => {
  console.log('CommunityLibrary component rendered');
  const { user } = useAuth();
  const [debates, setDebates] = useState<PublicDebate[]>([]);
  const [debateRounds, setDebateRounds] = useState<Record<string, PublicDebate['rounds']>>({});
  const [roundsLoading, setRoundsLoading] = useState<Record<string, boolean>>({});
  const [roundsError, setRoundsError] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDebateId, setExpandedDebateId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userVotes, setUserVotes] = useState<Record<string, VoteType>>({});
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [starredDebates, setStarredDebates] = useState<string[]>(() => {
    const saved = localStorage.getItem('starredDebates');
    return saved ? JSON.parse(saved) : [];
  });
  const [starFilter, setStarFilter] = useState(false);

  useEffect(() => {
    fetchDebates();
  }, [sortBy, timeFilter, selectedCategory]);

  // Add new effect to load user votes when user changes
  useEffect(() => {
    if (user) {
      loadUserVotes();
    } else {
      // If user logs out, only load from localStorage
      const savedVotes = localStorage.getItem('userVotes');
      if (savedVotes) {
        setUserVotes(JSON.parse(savedVotes));
      }
    }
  }, [user]);

  // Add new function to load user votes from Firebase
  const loadUserVotes = async () => {
    try {
      const publicDebatesRef = collection(db, 'public_debates');
      const querySnapshot = await getDocs(query(publicDebatesRef));
      
      const votes: Record<string, VoteType> = {};
      querySnapshot.docs.forEach(doc => {
        const debate = doc.data();
        if (debate.votes && debate.votes[user!.uid]) {
          votes[doc.id] = debate.votes[user!.uid];
        }
      });
      
      // Merge with localStorage votes
      const savedVotes = localStorage.getItem('userVotes');
      const localVotes = savedVotes ? JSON.parse(savedVotes) : {};
      
      setUserVotes({ ...localVotes, ...votes });
      localStorage.setItem('userVotes', JSON.stringify({ ...localVotes, ...votes }));
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

  // Load starred debates from Firestore on login
  useEffect(() => {
    const loadStarredFromFirebase = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().starredDebates) {
          setStarredDebates(userSnap.data().starredDebates);
          localStorage.setItem('starredDebates', JSON.stringify(userSnap.data().starredDebates));
        }
      }
    };
    loadStarredFromFirebase();
  }, [user]);

  const fetchDebates = async () => {
    console.log('fetchDebates called');
    try {
      setLoading(true);
      setError(null);
      
      const publicDebatesRef = collection(db, 'public_debates');
      let q = query(publicDebatesRef);
      
      // First add the sorting since it's required for pagination
      switch (sortBy) {
        case 'newest':
          q = query(q, orderBy('sharedAt', 'desc'));
          break;
        case 'popular':
          q = query(q, orderBy('upvotes', 'desc'));
          break;
        case 'controversial':
          q = query(q, orderBy('downvotes', 'desc'));
          break;
      }

      // Then add time filter if needed
      if (timeFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (timeFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        q = query(q, where('sharedAt', '>=', startDate.toISOString()));
      }

      // Get all documents that match the time and sort criteria
      const querySnapshot = await getDocs(q);
      let fetchedDebates = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Exclude rounds from initial fetch
        const { rounds, ...rest } = data;
        return { id: doc.id, ...rest };
      }) as PublicDebate[];

      // Filter by category in memory if category is selected
      // This avoids needing a complex index
      if (selectedCategory !== 'all') {
        fetchedDebates = fetchedDebates.filter(debate => 
          debate.categories && debate.categories.includes(selectedCategory)
        );
      }
      
      console.log('Fetched debates:', fetchedDebates);
      setDebates(fetchedDebates);
      
    } catch (error) {
      console.error('Error fetching debates:', error);
      if (error instanceof Error) {
        setError(`Unable to load debates: ${error.message}`);
      } else {
        setError('Unable to load debates. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleDebateExpansion = async (debateId: string) => {
    console.log('toggleDebateExpansion called for:', debateId);
    if (expandedDebateId === debateId) {
      setExpandedDebateId(null);
    } else {
      setExpandedDebateId(debateId);
      // Only fetch rounds if not already loaded
      if (!debateRounds[debateId]) {
        setRoundsLoading(prev => ({ ...prev, [debateId]: true }));
        setRoundsError(prev => ({ ...prev, [debateId]: '' }));
        try {
          console.log('Attempting to fetch debate with ID:', debateId);
          const debateRef = doc(db, 'public_debates', debateId);
          const debateSnap = await getDoc(debateRef);
          if (debateSnap.exists()) {
            const data = debateSnap.data();
            console.log('Fetched debate data for ID', debateId, ':', data);
            if (Array.isArray(data.rounds) && data.rounds.length > 0) {
              setDebateRounds(prev => ({ ...prev, [debateId]: data.rounds }));
            } else {
              setDebateRounds(prev => ({ ...prev, [debateId]: [] }));
              setRoundsError(prev => ({ ...prev, [debateId]: 'No rounds found for this debate.' }));
            }
          } else {
            console.log('No debate found in Firestore for ID:', debateId);
            setRoundsError(prev => ({ ...prev, [debateId]: 'Debate not found.' }));
          }
        } catch (error) {
          console.error('Error fetching debate rounds:', error);
          setRoundsError(prev => ({ ...prev, [debateId]: 'Error fetching debate rounds.' }));
        } finally {
          setRoundsLoading(prev => ({ ...prev, [debateId]: false }));
        }
      }
      
      // Increment view count
      try {
        const debateRef = doc(db, 'public_debates', debateId);
        await updateDoc(debateRef, {
           views: increment(1)
         });
        
        // Update local state
        setDebates(prev => prev.map(debate => 
          debate.id === debateId 
            ? { ...debate, views: (debate.views || 0) + 1 }
            : debate
        ));
      } catch (error) {
        console.error('Error updating view count:', error);
      }
    }
  };

  const toggleRoundExpansion = (roundKey: string) => {
    setExpandedRounds(prev => {
      const newSet = new Set<string>();
      Array.from(prev).forEach(id => newSet.add(id));
      if (newSet.has(roundKey)) {
        newSet.delete(roundKey);
      } else {
        newSet.add(roundKey);
      }
      return newSet;
    });
  };

  const handleVote = async (debateId: string, voteType: VoteType) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    console.log('Current user:', user);
    console.log('Attempting to vote:', { debateId, voteType });

    try {
      const debateRef = doc(db, 'public_debates', debateId);
      
      // First get the current debate data
      const debateSnap = await getDoc(debateRef);
      if (!debateSnap.exists()) {
        console.error('Debate document not found:', debateId);
        // Show error message to user
        setError(`Unable to find debate. It may have been deleted. Please refresh the page.`);
        return;
      }
      
      console.log('Current debate data:', debateSnap.data());
      
      const currentVote = userVotes[debateId];
      console.log('Current user vote:', currentVote);
      
      const updates: any = {};

      // Handle vote removal (clicking same button)
      if (currentVote === voteType) {
        console.log('Removing vote');
        // Decrement the vote count
        updates[`${voteType}s`] = increment(-1);
        // Remove the user's vote
        updates[`votes.${user.uid}`] = deleteField();
        
        // Update local state
        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[debateId];
          localStorage.setItem('userVotes', JSON.stringify(newVotes));
          return newVotes;
        });
      } 
      // Handle vote change or new vote
      else {
        console.log('Adding/changing vote');
        // Add new vote
        updates[`${voteType}s`] = increment(1);
        // Store vote type as 'upvote' or 'downvote' string
        updates[`votes.${user.uid}`] = voteType;
        
        // Remove old vote if exists
        if (currentVote) {
          updates[`${currentVote}s`] = increment(-1);
        }
        
        // Update local state
        setUserVotes(prev => {
          const newVotes = { ...prev, [debateId]: voteType };
          localStorage.setItem('userVotes', JSON.stringify(newVotes));
          return newVotes;
        });
      }

      console.log('Applying updates:', updates);
      
      // Perform the update
      await updateDoc(debateRef, updates);
      console.log('Update successful');
      
      // Refresh debates to get updated vote counts
      await fetchDebates();
    } catch (error) {
      console.error('Error voting:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        // Show user-friendly error message
        setError(`Unable to vote at this time. ${error.message}`);
      } else {
        setError('Unable to vote at this time. Please try again later.');
      }
    }
  };

  const calculateVotePercentage = (upvotes: number, downvotes: number): number => {
    const total = upvotes + downvotes;
    if (total === 0) return 100; // If no votes, show 100%
    return Math.round((upvotes / total) * 100);
  };

  const getVoteColor = (percentage: number): string => {
    if (percentage >= 75) return 'text-green-500';
    if (percentage >= 50) return 'text-blue-500';
    if (percentage >= 25) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStanceColor = (stance: number): string => {
    if (stance <= -0.8) return 'text-red-500';
    if (stance <= -0.3) return 'text-red-400';
    if (stance <= 0.3) return 'text-gray-400';
    if (stance <= 0.8) return 'text-green-400';
    return 'text-green-500';
  };

  const getStanceBackgroundColor = (stance: number): string => {
    if (stance <= -0.8) return 'bg-red-900/20';
    if (stance <= -0.3) return 'bg-red-800/20';
    if (stance <= 0.3) return 'bg-gray-800/20';
    if (stance <= 0.8) return 'bg-green-800/20';
    return 'bg-green-900/20';
  };

  const getStanceLabel = (value: number): string => {
    if (value <= -0.8) return 'Strongly Against';
    if (value <= -0.3) return 'Against';
    if (value <= 0.3) return 'Neutral';
    if (value <= 0.8) return 'For';
    return 'Strongly For';
  };

  const toggleStarDebate = async (debateId: string) => {
    setStarredDebates(prev => {
      let updated;
      if (prev.includes(debateId)) {
        updated = prev.filter(id => id !== debateId);
      } else {
        updated = [...prev, debateId];
      }
      localStorage.setItem('starredDebates', JSON.stringify(updated));
      // Sync to Firestore if logged in
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, { starredDebates: updated }, { merge: true });
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full bg-surface border border-neutral rounded-2xl p-8 shadow-xl">
          {/* Filters */}
          <div className="bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Categories */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Categories</h3>
                  <div className="flex-1 border-b border-gray-700/50"></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    key="all"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort and Time Options */}
              <div className="sm:border-l sm:pl-6 border-gray-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Sort By</h3>
                  <div className="flex-1 border-b border-gray-700/50"></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSortBy('popular')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      sortBy === 'popular'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    Most Popular
                  </button>
                  <button
                    onClick={() => setSortBy('newest')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      sortBy === 'newest'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    Most Recent
                  </button>
                  <button
                    onClick={() => setSortBy('controversial')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      sortBy === 'controversial'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    Most Controversial
                  </button>
                </div>

                {/* Time Filter */}
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Time Period</h3>
                    <div className="flex-1 border-b border-gray-700/50"></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTimeFilter('all')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        timeFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => setTimeFilter('today')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        timeFilter === 'today'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setTimeFilter('week')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        timeFilter === 'week'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => setTimeFilter('month')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        timeFilter === 'month'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      This Month
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full bg-surface border border-neutral rounded-2xl p-8 shadow-xl">
          {/* Keep the filters visible during error */}
          <div className="bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Categories */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Categories</h3>
                  <div className="flex-1 border-b border-gray-700/50"></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    key="all"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort and Time Options */}
              <div className="sm:border-l sm:pl-6 border-gray-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Sort By</h3>
                  <div className="flex-1 border-b border-gray-700/50"></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSortBy('popular')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      sortBy === 'popular'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    Most Popular
                  </button>
                  <button
                    onClick={() => setSortBy('newest')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      sortBy === 'newest'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    Most Recent
                  </button>
                  <button
                    onClick={() => setSortBy('controversial')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      sortBy === 'controversial'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    Most Controversial
                  </button>
                </div>

                {/* Time Filter */}
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Time Period</h3>
                    <div className="flex-1 border-b border-gray-700/50"></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTimeFilter('all')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        timeFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => setTimeFilter('today')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        timeFilter === 'today'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setTimeFilter('week')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        timeFilter === 'week'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => setTimeFilter('month')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        timeFilter === 'month'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      This Month
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error message */}
          <div className="text-center py-12">
            <div className="text-white mb-4">No debates for this filter, generate your own!</div>
            <Link
              to="/"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start a Debate
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get unique categories from all debates
  const uniqueCategories = Array.from(
    new Set(debates.flatMap(debate => debate.categories))
  ).sort();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-surface border border-neutral rounded-2xl p-8 shadow-xl">
        {/* Login Modal */}
        <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
          <div className="text-center text-white">
            <h3 className="text-xl font-semibold mb-3">
              Login Required
            </h3>
            <p className="mb-6">
              You need to be logged in to vote on debates.
            </p>
            <Link 
              to="/login"
              className="inline-block bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </Modal>

        {/* Filters */}
        <div className="bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Categories */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Categories</h3>
                <div className="flex-1 border-b border-gray-700/50"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  key="all"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort and Time Options */}
            <div className="sm:border-l sm:pl-6 border-gray-700/50">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Sort By</h3>
                <div className="flex-1 border-b border-gray-700/50"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    sortBy === 'popular'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  Most Popular
                </button>
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    sortBy === 'newest'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  Most Recent
                </button>
                <button
                  onClick={() => setSortBy('controversial')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    sortBy === 'controversial'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  Most Controversial
                </button>
              </div>

              {/* Time Filter */}
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Time Period</h3>
                  <div className="flex-1 border-b border-gray-700/50"></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTimeFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      timeFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => setTimeFilter('today')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      timeFilter === 'today'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setTimeFilter('week')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      timeFilter === 'week'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setTimeFilter('month')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      timeFilter === 'month'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    This Month
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>DEBUG: This should always render if not loading or error.</div>
    </div>
  );
};

export default CommunityLibrary;