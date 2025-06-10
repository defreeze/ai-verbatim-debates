import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Debate {
  id: string;
  topic: string;
  timestamp: string;
  categories: string[];
  isPro: boolean;
  isPublic?: boolean;
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
  rounds: {
    speaker: string;
    text: string;
    summary: string;
  }[];
}

const DebateHistory: React.FC = () => {
  const { user } = useAuth();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDebateId, setExpandedDebateId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [sharingDebate, setSharingDebate] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (shareSuccess) {
      const timer = setTimeout(() => {
        setShareSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shareSuccess]);

  // Get unique categories from all debates
  const uniqueCategories = Array.from(
    new Set(debates.flatMap(debate => debate.categories))
  ).sort();

  useEffect(() => {
    if (user) {
      fetchDebates();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDebates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const debatesRef = collection(db, `users/${user!.uid}/debates`);
      const q = query(debatesRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedDebates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Debate[];
      
      setDebates(fetchedDebates);
    } catch (error) {
      console.error('Error fetching debates:', error);
      setError('Unable to load your debate history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDebateExpansion = (debateId: string) => {
    setExpandedDebateId(expandedDebateId === debateId ? null : debateId);
  };

  const toggleRoundExpansion = (roundKey: string) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roundKey)) {
        newSet.delete(roundKey);
      } else {
        newSet.add(roundKey);
      }
      return newSet;
    });
  };

  const shareWithCommunity = async (debateId: string) => {
    if (!user) {
      console.log('No user found, cannot share debate');
      return;
    }
    
    try {
      setSharingDebate(debateId);
      console.log('Starting to share debate:', debateId);
      
      // Get the debate to share
      const debate = debates.find(d => d.id === debateId);
      if (!debate) {
        console.error('Debate not found:', debateId);
        throw new Error('Debate not found');
      }

      console.log('Found debate to share:', debate);
      
      // Create the public debate document
      const publicDebateRef = collection(db, 'public_debates');
      const publicDebateData = {
        ...debate,
        isPublic: true,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        upvotes: 1, // Start with one upvote
        downvotes: 0,
        views: 0,
        sharedAt: new Date().toISOString()
      };
      
      console.log('Preparing public debate data:', publicDebateData);
      
      try {
        const docRef = await addDoc(publicDebateRef, publicDebateData);
        console.log('Successfully added public debate with ID:', docRef.id);
      } catch (error) {
        console.error('Error adding to public_debates:', error);
        throw error;
      }
      
      // Update the original debate document
      try {
        const debateRef = doc(db, `users/${user.uid}/debates/${debateId}`);
        await updateDoc(debateRef, {
          isPublic: true
        });
        console.log('Successfully updated original debate');
      } catch (error) {
        console.error('Error updating original debate:', error);
        throw error;
      }
      
      // Update local state
      setDebates(prev => {
        const updated = prev.map(debate => 
          debate.id === debateId ? { ...debate, isPublic: true } : debate
        );
        console.log('Updated local debates state:', updated);
        return updated;
      });
      
      console.log('Share process completed successfully');
      setShareSuccess('Debate shared successfully! It will appear in Community Rankings.');
      
    } catch (error) {
      console.error('Error in shareWithCommunity:', error);
      setShareSuccess('Failed to share debate. Please try again.');
    } finally {
      setSharingDebate(null);
    }
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

  const filteredDebates = debates
    .filter(debate => {
      const matchesCategory = selectedCategory === 'all' || debate.categories.includes(selectedCategory);
      const matchesSearch = debate.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debate.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800/30 rounded-lg p-8 text-center backdrop-blur-sm border border-gray-700/50">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Sign in to View Your Debate History
            </h2>
            <p className="text-gray-300 mb-6">
              Create an account or sign in to keep track of all your AI debates.
            </p>
            <Link 
              to="/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Add success message */}
        {shareSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
              shareSuccess.includes('Failed') ? 'bg-red-500' : 'bg-green-500'
            } text-white z-50`}
          >
            {shareSuccess}
          </motion.div>
        )}
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 bg-clip-text text-transparent mb-2">
            Your Debate History
          </h1>
          <p className="text-gray-400">
            {debates.length} {debates.length === 1 ? 'debate' : 'debates'} in your history
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search debates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Debates List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredDebates.map(debate => (
              <motion.div
                key={debate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden"
              >
                {/* Debate Header */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{debate.topic}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {debate.categories.map(category => (
                          <span
                            key={category}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md text-sm"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {formatDate(debate.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => shareWithCommunity(debate.id)}
                        disabled={debate.isPublic || sharingDebate === debate.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          debate.isPublic 
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {sharingDebate === debate.id ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Sharing...
                          </span>
                        ) : debate.isPublic ? (
                          'Shared with Community'
                        ) : (
                          'Share with Community'
                        )}
                      </button>
                      <button
                        onClick={() => toggleDebateExpansion(debate.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Toggle debate details"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-6 w-6 transform transition-transform ${
                            expandedDebateId === debate.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Speaker Information */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* First Speaker */}
                    <div className={`p-3 rounded-lg ${getStanceBackgroundColor(debate.model1.stance)}`}>
                      <h4 className="text-gray-300 mb-2">First Speaker</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Model:</span>
                          <span className="text-white">{debate.model1.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Position:</span>
                          <span className={getStanceColor(debate.model1.stance)}>
                            {getStanceLabel(debate.model1.stance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Style:</span>
                          <span className="text-white capitalize">{debate.model1.rhetoricStyle}</span>
                        </div>
                      </div>
                    </div>

                    {/* Second Speaker */}
                    <div className={`p-3 rounded-lg ${getStanceBackgroundColor(debate.model2.stance)}`}>
                      <h4 className="text-gray-300 mb-2">Second Speaker</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Model:</span>
                          <span className="text-white">{debate.model2.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Position:</span>
                          <span className={getStanceColor(debate.model2.stance)}>
                            {getStanceLabel(debate.model2.stance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Style:</span>
                          <span className="text-white capitalize">{debate.model2.rhetoricStyle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Debate Content */}
                <AnimatePresence>
                  {expandedDebateId === debate.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-700/50"
                    >
                      <div className="p-4 space-y-4">
                        {debate.rounds.map((round, roundIndex) => {
                          const roundKey = `${debate.id}-${roundIndex}`;
                          const isExpanded = expandedRounds.has(roundKey);
                          const isFirstSpeaker = round.speaker === "First Speaker";
                          const speakerStance = isFirstSpeaker ? debate.model1.stance : debate.model2.stance;

                          return (
                            <div
                              key={roundKey}
                              className="flex justify-start w-full"
                            >
                              <div
                                className={`rounded-lg p-4 ${getStanceBackgroundColor(speakerStance)} ${
                                  isFirstSpeaker 
                                    ? 'w-3/4 mr-auto' 
                                    : 'w-3/4 ml-auto'
                                }`}
                              >
                                <div className={`flex items-center mb-2 ${
                                  isFirstSpeaker ? 'justify-between' : 'flex-row-reverse justify-between'
                                }`}>
                                  <h4 className="text-lg font-medium text-white">
                                    {round.speaker}
                                  </h4>
                                  <button
                                    onClick={() => toggleRoundExpansion(roundKey)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                  >
                                    {isExpanded ? 'Show Less' : 'Show More'}
                                  </button>
                                </div>
                                <div className="text-gray-300">
                                  {isExpanded ? round.text : round.summary}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredDebates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No debates found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebateHistory; 