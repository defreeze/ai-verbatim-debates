import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { Link } from 'react-router-dom';

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
  'Culture'
];

const CommunityRankings: React.FC = () => {
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

  useEffect(() => {
    fetchDebates();
  }, [sortBy, timeFilter, selectedCategory]);

  useEffect(() => {
    // Load user's votes from localStorage
    const savedVotes = localStorage.getItem('userVotes');
    if (savedVotes) {
      setUserVotes(JSON.parse(savedVotes));
    }
  }, []);

  const fetchDebates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const publicDebatesRef = collection(db, 'public_debates');
      
      console.log('Fetching public debates...');
      
      // Build query based on filters
      let q = query(publicDebatesRef);
      console.log('Initial query created');
      
      // Log the current filters
      console.log('Current filters:', {
        timeFilter,
        sortBy,
        selectedCategory
      });
      
      // Add time filter
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
      
      // Add category filter
      if (selectedCategory !== 'all') {
        q = query(q, where('categories', 'array-contains', selectedCategory));
      }
      
      // Add sorting
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
      
      const querySnapshot = await getDocs(q);
      const fetchedDebates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PublicDebate[];
      
      console.log('Fetched debates:', fetchedDebates.length);
      setDebates(fetchedDebates);
      
    } catch (error) {
      console.error('Error fetching debates:', error);
      setError('Unable to load debates. Please try again later.');
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

    try {
      const debateRef = doc(db, 'public_debates', debateId);
      const currentVote = userVotes[debateId];
      
      // Remove previous vote if exists
      if (currentVote) {
        await updateDoc(debateRef, {
          [currentVote + 's']: increment(-1)
        });
      }
      
      // Add new vote if different from current vote
      if (currentVote !== voteType) {
        await updateDoc(debateRef, {
          [voteType + 's']: increment(1)
        });

        // Update local state
        setUserVotes(prev => {
          const newVotes = { ...prev, [debateId]: voteType };
          localStorage.setItem('userVotes', JSON.stringify(newVotes));
          return newVotes;
        });
      } else {
        // Remove vote if clicking the same button
        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[debateId];
          localStorage.setItem('userVotes', JSON.stringify(newVotes));
          return newVotes;
        });
      }
      
      // Refresh debates to get updated vote counts
      fetchDebates();
    } catch (error) {
      console.error('Error voting:', error);
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

  const getStanceLabel = (stance: number): string => {
    if (stance <= -0.8) return 'Strongly Against';
    if (stance <= -0.3) return 'Against';
    if (stance <= 0.3) return 'Neutral';
    if (stance <= 0.8) return 'For';
    return 'Strongly For';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">{error}</div>
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

        {/* Debate List */}
        <div className="space-y-4">
          {debates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No debates found. Check back later or try different filters.
            </div>
          ) : (
            debates.map((debate) => (
              <motion.div
                key={debate.id}
                className="bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-4">
                  {/* Vote buttons */}
                  <div className="flex flex-col items-center space-y-2">
                    <button 
                      onClick={() => handleVote(debate.id, 'upvote')}
                      className={`p-2 rounded-lg transition-colors ${
                        userVotes[debate.id] === 'upvote'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                      }`}
                      title={user ? 'Upvote' : 'Login to vote'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Vote percentage */}
                    <span className={`text-sm font-medium ${
                      getVoteColor(calculateVotePercentage(debate.upvotes, debate.downvotes))
                    }`}>
                      {calculateVotePercentage(debate.upvotes, debate.downvotes)}%
                    </span>

                    <button 
                      onClick={() => handleVote(debate.id, 'downvote')}
                      className={`p-2 rounded-lg transition-colors ${
                        userVotes[debate.id] === 'downvote'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                      }`}
                      title={user ? 'Downvote' : 'Login to vote'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {/* Debate content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-medium text-white">{debate.topic}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span title="Views" className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {debate.views || 0}
                        </span>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityRankings; 