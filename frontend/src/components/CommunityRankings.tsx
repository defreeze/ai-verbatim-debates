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

const CommunityLibrary: React.FC = () => {
  const { user } = useAuth();
  const [debates, setDebates] = useState<PublicDebate[]>([]);
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
      let fetchedDebates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PublicDebate[];

      // Filter by category in memory if category is selected
      // This avoids needing a complex index
      if (selectedCategory !== 'all') {
        fetchedDebates = fetchedDebates.filter(debate => 
          debate.categories && debate.categories.includes(selectedCategory)
        );
      }
      
      console.log('Fetched debates:', fetchedDebates.length);
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
    if (expandedDebateId === debateId) {
      setExpandedDebateId(null);
    } else {
      setExpandedDebateId(debateId);
      
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
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
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
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
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
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
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

        {/* Star Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setStarFilter(false)}
            className={`px-3 py-1 rounded-lg transition-colors ${!starFilter ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}
          >
            All Debates
          </button>
          <button
            onClick={() => setStarFilter(true)}
            className={`px-3 py-1 rounded-lg transition-colors ${starFilter ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}
          >
            Starred
          </button>
        </div>

        {/* Loading, Error, or Debate List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <div className="text-gray-400 mt-4">Loading debates...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-white mb-4">No debates for this filter, generate your own!</div>
              <Link
                to="/"
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start a Debate
              </Link>
            </div>
          ) : (starFilter ? debates.filter(d => starredDebates.includes(d.id)) : debates).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">No debates found for the selected filters.</div>
              <div className="text-blue-400 text-lg font-light">Now is your chance to be the first! 🎉</div>
              <Link
                to="/"
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start a Debate
              </Link>
            </div>
          ) : (
            <>
              {(starFilter ? debates.filter(d => starredDebates.includes(d.id)) : debates).map((debate) => (
                <motion.div
                  key={debate.id}
                  className="bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start gap-4">
                    {/* Vote buttons */}
                    <div className="flex flex-col items-center space-y-2 w-24">
                      {[
                        { type: 'for', label: 'For', votes: debate.upvotes || 0, colors: ['#B162C9', '#822E8F'] },
                        { type: 'interesting', label: 'Interesting', votes: 0, colors: ['#A08BD1', '#A08BD1'] },
                        { type: 'against', label: 'Against', votes: debate.downvotes || 0, colors: ['#7140D9', '#1e40af'] },
                      ].map(({ type, label, votes, colors }) => {
                        const totalVotes = (debate.upvotes || 0) + (debate.downvotes || 0); // + interestingVotes if available
                        const percent = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                        const [bright, dark] = colors;
                        return (
                          <button
                            key={type}
                            className="w-full py-2 rounded-lg font-semibold text-white mb-1 shadow text-center transition-all relative overflow-hidden"
                            style={{ background: dark }}
                            // onClick handler can be added here if voting is needed
                          >
                            {/* Bright color bar from right to left, width = percent */}
                            <span
                              className="absolute top-0 right-0 h-full"
                              style={{ width: `${percent}%`, background: bright, zIndex: 1, borderRadius: '0.5rem' }}
                            />
                            <span className="relative z-10 block text-xs font-bold" style={{ textAlign: 'center' }}>{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Debate content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-medium text-white">{debate.topic}</h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleStarDebate(debate.id)}
                            className="focus:outline-none"
                            title={starredDebates.includes(debate.id) ? 'Unstar' : 'Star'}
                          >
                            <FaStarIcon
                              className={`h-5 w-5 ${starredDebates.includes(debate.id) ? 'text-yellow-400' : 'text-gray-400'}`}
                              style={{ filter: starredDebates.includes(debate.id) ? 'drop-shadow(0 0 2px #facc15)' : 'none' }}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {debate.categories.map((category) => (
                          <span
                            key={category}
                            className="px-2 py-1 text-xs rounded-full bg-gray-700/50 text-gray-300"
                          >
                            {category}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex justify-between items-center">
                        <button
                          onClick={() => toggleDebateExpansion(debate.id)}
                          className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          {expandedDebateId === debate.id ? 'Hide Debate' : 'View Debate'}
                        </button>
                        <span className="text-sm text-gray-400">
                          Shared {new Date(debate.sharedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Expanded debate content */}
                      <AnimatePresence>
                        {expandedDebateId === debate.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-4"
                          >
                            {debate.rounds.map((round, roundIndex) => (
                              <div key={roundIndex} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-gray-300 font-medium">
                                    Round {roundIndex + 1} - {round.speaker}
                                  </h4>
                                  <button
                                    onClick={() => toggleRoundExpansion(`${debate.id}-${roundIndex}`)}
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                  >
                                    {expandedRounds.has(`${debate.id}-${roundIndex}`) ? 'Show Less' : 'Show More'}
                                  </button>
                                </div>
                                <div className="text-gray-300">
                                  {expandedRounds.has(`${debate.id}-${roundIndex}`) ? round.text : round.summary}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityLibrary; 