import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, increment, deleteField, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ThreadedDiscussion from './ThreadedDiscussion';
import type { PublicDebate } from '../types/debate';

// 4-pointed star SVG component
const FourPointStarIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    {/* Subtle white center highlight */}
    <circle cx="12" cy="12" r="2.2" fill="white" fillOpacity="0.7" />
    <polygon points="12,2 15,12 12,22 9,12" />
    <polygon points="2,12 12,9 22,12 12,15" />
  </svg>
);



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
  const [showLoadingIcon, setShowLoadingIcon] = useState(false);
  const [expandedDebateId, setExpandedDebateId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
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
  const [debateRounds, setDebateRounds] = useState<Record<string, Array<{ speaker: string; text: string; summary: string }>>>({});
  const [roundsLoading, setRoundsLoading] = useState<Record<string, boolean>>({});
  const [roundsError, setRoundsError] = useState<Record<string, string>>({});
  
  // New filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For the input field value
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Only close if clicking outside of any dropdown
      if (!target.closest('.dropdown-container')) {
        setShowCategoryDropdown(false);
        setShowSortDropdown(false);
        setShowTimeDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDebates();
  }, [sortBy, timeFilter, selectedCategory, searchQuery]);

  // Show loading icon only after 1 second
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowLoadingIcon(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingIcon(false);
    }
  }, [loading]);

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

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        fetchedDebates = fetchedDebates.filter(debate => 
          debate.topic.toLowerCase().includes(query) ||
          debate.categories.some(cat => cat.toLowerCase().includes(query))
        );
      }
      
      console.log('Fetched discourse:', fetchedDebates.length);
      setDebates(fetchedDebates);
      
    } catch (error) {
      console.error('Error fetching discourse:', error);
      if (error instanceof Error) {
        setError(`Unable to load discourse: ${error.message}`);
      } else {
        setError('Unable to load discourse. Please try again later.');
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
      if (!debateRounds[debateId]) {
        setRoundsLoading(prev => ({ ...prev, [debateId]: true }));
        setRoundsError(prev => ({ ...prev, [debateId]: '' }));
        try {
          console.log('[toggleDebateExpansion] Fetching debate:', debateId);
          const debateRef = doc(db, 'public_debates', debateId);
          console.log('[toggleDebateExpansion] Firestore ref path:', debateRef.path);
          const debateSnap = await getDoc(debateRef);
          console.log('[toggleDebateExpansion] getDoc result exists:', debateSnap.exists());
          if (debateSnap.exists()) {
            const data = debateSnap.data();
            console.log('[toggleDebateExpansion] Debate data:', data);
            if (Array.isArray(data.rounds)) {
              setDebateRounds(prev => ({ ...prev, [debateId]: data.rounds }));
              // Do NOT set an error if no rounds, just handle in render
            } else {
              setDebateRounds(prev => ({ ...prev, [debateId]: [] }));
            }
          } else {
            console.warn('[toggleDebateExpansion] Debate not found in Firestore:', debateId);
            setRoundsError(prev => ({ ...prev, [debateId]: 'Debate not found.' }));
          }
        } catch (error) {
          console.error('[toggleDebateExpansion] Error fetching debate:', error);
          setRoundsError(prev => ({ ...prev, [debateId]: 'Error fetching debate rounds.' }));
        } finally {
          setRoundsLoading(prev => ({ ...prev, [debateId]: false }));
        }
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

  /*
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
  */

  /*
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
  */

  // Helper functions for dropdown labels
  const getSortLabel = (sort: SortOption): string => {
    switch (sort) {
      case 'newest': return 'Most Recent';
      case 'popular': return 'Most Popular';
      case 'controversial': return 'Most Controversial';
      default: return 'Most Recent';
    }
  };

  const getTimeLabel = (time: TimeFilter): string => {
    switch (time) {
      case 'all': return 'All Time';
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'All Time';
    }
  };

  const getCategoryLabel = (category: string): string => {
    return category === 'all' ? 'All Categories' : category;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSearchInput('');
    setSelectedCategory('all');
    setSortBy('newest');
    setTimeFilter('all');
    setStarFilter(false);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchQuery.trim() !== '' || 
           selectedCategory !== 'all' || 
           sortBy !== 'newest' || 
           timeFilter !== 'all' || 
           starFilter;
  };

  // Handle search on Enter key press
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchInput);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  // Color functions for stance-based styling (matching DebateEngine)
  const interpolateColor = (value: number): string => {
    const colors = {
      blue: [30,144,255],    // blue-300 (very bright blue)
      gray: [75, 75, 75],     // neutral gray
      purple: [192, 132, 252],    // purple-400 (bright purple)
    };

    let r, g, b;
    if (value <= 0) {
      // Interpolate between blue and gray
      const t = (value + 1); // -1 to 0 -> 0 to 1
      r = colors.blue[0] + (colors.gray[0] - colors.blue[0]) * t;
      g = colors.blue[1] + (colors.gray[1] - colors.blue[1]) * t;
      b = colors.blue[2] + (colors.gray[2] - colors.blue[2]) * t;
    } else {
      // Interpolate between gray and purple
      const t = value; // 0 to 1
      r = colors.gray[0] + (colors.purple[0] - colors.gray[0]) * t;
      g = colors.gray[1] + (colors.purple[1] - colors.gray[1]) * t;
      b = colors.gray[2] + (colors.purple[2] - colors.gray[2]) * t;
    }

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  const getStanceColor = (value: number): string => {
    return interpolateColor(value);
  };

  const getStanceBackgroundColor = (value: number): string => {
    const color = interpolateColor(value);
    return color.replace('rgb', 'rgba').replace(')', ', 0.2)');
  };

  const getRoundTitle = (roundNumber: number): { title: string; description: string } => {
    switch (roundNumber) {
      case 1:
        return {
          title: "Round 1: Constructive Arguments",
          description: "Each speaker presents their initial position with strongest possible arguments."
        };
      case 2:
        return {
          title: "Round 2: Rebuttal",
          description: "Speakers address opposing arguments and strengthen their positions."
        };
      case 3:
        return {
          title: "Round 3: Summary",
          description: "Final statements incorporating and addressing previous points."
        };
      default:
        return {
          title: `Round ${roundNumber}`,
          description: ""
        };
    }
  };

  // Portal-based Dropdown component
  const FilterDropdown = ({ 
    label, 
    value, 
    options, 
    onChange, 
    isOpen, 
    onToggle 
  }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    isOpen: boolean;
    onToggle: () => void;
  }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const updatePosition = () => {
          if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
              top: rect.bottom + 4,
              left: rect.left,
              width: rect.width
            });
          }
        };

        // Initial position
        updatePosition();

        // Update position on scroll and resize
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
        };
      }
    }, [isOpen]);

    const dropdownContent = isOpen ? (
      <div 
        className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-[9999]"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width
        }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            onClick={(e) => {
              e.stopPropagation();
              onChange(option.value);
              onToggle();
            }}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
              value === option.value ? 'text-blue-400 bg-gray-700/50' : 'text-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    ) : null;

    return (
      <div className="relative dropdown-container">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex items-center justify-between w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600/50 transition-colors"
        >
          <span className="text-sm">{label}</span>
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {dropdownContent && createPortal(dropdownContent, document.body)}
      </div>
    );
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
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Modern Filter System */}
          <div className="bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50">
            {/* Search Bar */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Find discourse on any topic or category..."
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {(searchQuery || searchInput) && (
                  <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                  </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Category Filter */}
              <FilterDropdown
                label={getCategoryLabel(selectedCategory)}
                value={selectedCategory}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map(cat => ({ value: cat, label: cat }))
                ]}
                onChange={setSelectedCategory}
                isOpen={showCategoryDropdown}
                onToggle={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowSortDropdown(false);
                  setShowTimeDropdown(false);
                }}
              />

              {/* Sort Filter */}
              <FilterDropdown
                label={getSortLabel(sortBy)}
                value={sortBy}
                options={[
                  { value: 'newest', label: 'Most Recent' },
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'controversial', label: 'Most Controversial' }
                ]}
                onChange={(value) => setSortBy(value as SortOption)}
                isOpen={showSortDropdown}
                onToggle={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowCategoryDropdown(false);
                  setShowTimeDropdown(false);
                }}
              />

              {/* Time Filter */}
              <FilterDropdown
                label={getTimeLabel(timeFilter)}
                value={timeFilter}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' }
                ]}
                onChange={(value) => setTimeFilter(value as TimeFilter)}
                isOpen={showTimeDropdown}
                onToggle={() => {
                  setShowTimeDropdown(!showTimeDropdown);
                  setShowCategoryDropdown(false);
                  setShowSortDropdown(false);
                }}
              />

              {/* Star Filter */}
              <div className="flex items-center">
                    <button
                  onClick={() => setStarFilter(!starFilter)}
                  className={`flex items-center justify-center w-full px-4 py-2 rounded-lg transition-colors ${
                    starFilter 
                      ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600/50'
                  }`}
                >
                  <FourPointStarIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Starred Only</span>
                    </button>
                </div>
              </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-700/50">
                <span className="text-sm text-gray-400">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    Search: "{searchQuery}"
                  <button
                      onClick={() => setSearchQuery('')}
                      className="ml-2 hover:text-blue-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                  </button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    Category: {selectedCategory}
                  <button
                      onClick={() => setSelectedCategory('all')}
                      className="ml-2 hover:text-blue-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                  </button>
                  </span>
                )}
                {sortBy !== 'newest' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    Sort: {getSortLabel(sortBy)}
                  <button
                      onClick={() => setSortBy('newest')}
                      className="ml-2 hover:text-blue-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                  </button>
                  </span>
                )}
                {timeFilter !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    Time: {getTimeLabel(timeFilter)}
                    <button
                      onClick={() => setTimeFilter('all')}
                      className="ml-2 hover:text-blue-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {starFilter && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-600/20 text-yellow-400 border border-yellow-500/30">
                    Starred Only
                    <button
                      onClick={() => setStarFilter(false)}
                      className="ml-2 hover:text-yellow-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                    <button
                  onClick={clearAllFilters}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Clear all
                    </button>
                  </div>
            )}
          </div>

          {/* Loading indicator */}
          {showLoadingIcon && (
            <div className="flex items-center justify-center py-12">
              <img 
                src="/android-chrome-512x512.png" 
                alt="Discourse Graph" 
                className="w-12 h-12 animate-spin"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Modern Filter System */}
          <div className="bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50">
            {/* Search Bar */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
              type="text"
              placeholder="Find discourse on any topic or category... "
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleSearchKeyPress}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {(searchQuery || searchInput) && (
                  <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
                  </button>
            )}
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Category Filter */}
              <FilterDropdown
                label={getCategoryLabel(selectedCategory)}
                value={selectedCategory}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map(cat => ({ value: cat, label: cat }))
                ]}
                onChange={setSelectedCategory}
                isOpen={showCategoryDropdown}
                onToggle={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowSortDropdown(false);
                  setShowTimeDropdown(false);
                }}
              />

              {/* Sort Filter */}
              <FilterDropdown
                label={getSortLabel(sortBy)}
                value={sortBy}
                options={[
                  { value: 'newest', label: 'Most Recent' },
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'controversial', label: 'Most Controversial' }
                ]}
                onChange={(value) => setSortBy(value as SortOption)}
                isOpen={showSortDropdown}
                onToggle={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowCategoryDropdown(false);
                  setShowTimeDropdown(false);
                }}
              />

              {/* Time Filter */}
              <FilterDropdown
                label={getTimeLabel(timeFilter)}
                value={timeFilter}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' }
                ]}
                onChange={(value) => setTimeFilter(value as TimeFilter)}
                isOpen={showTimeDropdown}
                onToggle={() => {
                  setShowTimeDropdown(!showTimeDropdown);
                  setShowCategoryDropdown(false);
                  setShowSortDropdown(false);
                }}
              />

              {/* Star Filter */}
              <div className="flex items-center">
                    <button
                  onClick={() => setStarFilter(!starFilter)}
                  className={`flex items-center justify-center w-full px-4 py-2 rounded-lg transition-colors ${
                    starFilter 
                      ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600/50'
                  }`}
                >
                  <FourPointStarIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Starred Only</span>
                    </button>
                </div>
              </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-700/50">
                <span className="text-sm text-gray-400">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    Search: "{searchQuery}"
                  <button
                      onClick={() => setSearchQuery('')}
                      className="ml-2 hover:text-blue-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                  </button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    Category: {selectedCategory}
                  <button
                      onClick={() => setSelectedCategory('all')}
                      className="ml-2 hover:text-blue-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                  </button>
                  </span>
                )}
                {sortBy !== 'newest' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    Sort: {getSortLabel(sortBy)}
                  <button
                      onClick={() => setSortBy('newest')}
                      className="ml-2 hover:text-blue-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                  </button>
                  </span>
                )}
                {timeFilter !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    Time: {getTimeLabel(timeFilter)}
                    <button
                      onClick={() => setTimeFilter('all')}
                      className="ml-2 hover:text-blue-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {starFilter && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-600/20 text-yellow-400 border border-yellow-500/30">
                    Starred Only
                    <button
                      onClick={() => setStarFilter(false)}
                      className="ml-2 hover:text-yellow-300"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                    <button
                  onClick={clearAllFilters}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Clear all
                    </button>
                  </div>
            )}
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

  // Get unique categories from all debates (currently unused)
  // const uniqueCategories = Array.from(
  //   new Set(debates.flatMap(debate => debate.categories))
  // ).sort();

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
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

        {/* Modern Filter System */}
        <div className="bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50">
          {/* Search Bar */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Find discourse on any topic or category... "
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleSearchKeyPress}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {(searchQuery || searchInput) && (
                <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
                </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Category Filter */}
            <FilterDropdown
              label={getCategoryLabel(selectedCategory)}
              value={selectedCategory}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat, label: cat }))
              ]}
              onChange={setSelectedCategory}
              isOpen={showCategoryDropdown}
              onToggle={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowSortDropdown(false);
                setShowTimeDropdown(false);
              }}
            />

            {/* Sort Filter */}
            <FilterDropdown
              label={getSortLabel(sortBy)}
              value={sortBy}
              options={[
                { value: 'newest', label: 'Most Recent' },
                { value: 'popular', label: 'Most Popular' },
                { value: 'controversial', label: 'Most Controversial' }
              ]}
              onChange={(value) => setSortBy(value as SortOption)}
              isOpen={showSortDropdown}
              onToggle={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowCategoryDropdown(false);
                setShowTimeDropdown(false);
              }}
            />

            {/* Time Filter */}
            <FilterDropdown
              label={getTimeLabel(timeFilter)}
              value={timeFilter}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' }
              ]}
              onChange={(value) => setTimeFilter(value as TimeFilter)}
              isOpen={showTimeDropdown}
              onToggle={() => {
                setShowTimeDropdown(!showTimeDropdown);
                setShowCategoryDropdown(false);
                setShowSortDropdown(false);
              }}
            />

            {/* Star Filter */}
            <div className="flex items-center">
                  <button
                onClick={() => setStarFilter(!starFilter)}
                className={`flex items-center justify-center w-full px-4 py-2 rounded-lg transition-colors ${
                  starFilter 
                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' 
                    : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600/50'
                }`}
              >
                <FourPointStarIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">Starred Only</span>
                  </button>
              </div>
            </div>

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-700/50">
              <span className="text-sm text-gray-400">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  Search: "{searchQuery}"
                <button
                    onClick={clearSearch}
                    className="ml-2 hover:text-blue-300"
                  >
                    <XMarkIcon className="h-3 w-3" />
                </button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  Category: {selectedCategory}
                <button
                    onClick={() => setSelectedCategory('all')}
                    className="ml-2 hover:text-blue-300"
                  >
                    <XMarkIcon className="h-3 w-3" />
                </button>
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  Sort: {getSortLabel(sortBy)}
                <button
                    onClick={() => setSortBy('newest')}
                    className="ml-2 hover:text-blue-300"
                  >
                    <XMarkIcon className="h-3 w-3" />
                </button>
                </span>
              )}
              {timeFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  Time: {getTimeLabel(timeFilter)}
                  <button
                    onClick={() => setTimeFilter('all')}
                    className="ml-2 hover:text-blue-300"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {starFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-600/20 text-yellow-400 border border-yellow-500/30">
                  Starred Only
                  <button
                    onClick={() => setStarFilter(false)}
                    className="ml-2 hover:text-yellow-300"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
                  <button
                onClick={clearAllFilters}
                className="text-xs text-gray-400 hover:text-white underline"
              >
                Clear all
                  </button>
                </div>
          )}
        </div>



        {/* Loading, Error, or Debate List */}
        <div className="space-y-3">
          {loading && showLoadingIcon ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <img 
                  src="/android-chrome-512x512.png" 
                  alt="Discourse Graph" 
                  className="w-12 h-12 animate-spin"
                />
                <div className="text-gray-400">Loading debates...</div>
              </div>
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
                            <FourPointStarIcon
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
                        <Link
                          to={`/debate/${debate.id}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          View Discourse
                        </Link>
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
                            {roundsLoading[debate.id] ? (
                              <div className="flex items-center justify-center gap-2 text-gray-400">
                                <img 
                                  src="/android-chrome-512x512.png" 
                                  alt="Discourse Graph" 
                                  className="w-4 h-4 animate-spin"
                                />
                                Loading debate rounds...
                              </div>
                            ) : roundsError[debate.id] ? (
                              <div className="text-red-400">{roundsError[debate.id]}</div>
                            ) : debateRounds[debate.id] && debateRounds[debate.id].length === 0 ? (
                              <div className="text-gray-400">No rounds found for this debate.</div>
                            ) : debateRounds[debate.id] ? (
                              Array.from({ length: Math.ceil(debateRounds[debate.id].length / 2) }, (_, roundIndex) => {
                                const roundNumber = roundIndex + 1;
                                const firstSpeakerIndex = roundIndex * 2;
                                const secondSpeakerIndex = firstSpeakerIndex + 1;
                                const roundInfo = getRoundTitle(roundNumber);
                                
                                return (
                                  <div key={roundNumber} className="space-y-4">
                                    <div className="mb-6">
                                      <h3 className="text-xl font-semibold text-gray-300 mb-2 border-b border-gray-700/50 pb-2">
                                        {roundInfo.title}
                                      </h3>
                                      <p className="text-sm text-gray-400 italic">
                                        {roundInfo.description}
                                      </p>
                                    </div>
                                    
                                    {debateRounds[debate.id][firstSpeakerIndex] && (
                                      <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="flex justify-start"
                                      >
                                        <div 
                                          className="w-3/4 p-6 rounded-lg shadow-xl backdrop-blur-sm"
                                          style={{ 
                                            background: `linear-gradient(135deg, ${getStanceBackgroundColor(debate.model1.stance).replace('0.1', '0.2')}, ${getStanceBackgroundColor(debate.model1.stance).replace('0.1', '0.1')})`,
                                            border: `1px solid ${getStanceBackgroundColor(debate.model1.stance).replace('0.1', '0.3')}`,
                                          }}
                                        >
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="text-lg font-semibold" style={{ color: getStanceColor(debate.model1.stance) }}>
                                              First Speaker
                                            </div>
                                    <button
                                              onClick={() => toggleRoundExpansion(`${debate.id}-${firstSpeakerIndex}`)}
                                              className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
                                            >
                                              {expandedRounds.has(`${debate.id}-${firstSpeakerIndex}`) ? (
                                                <>
                                                  <span className="text-sm">Show Less</span>
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                  </svg>
                                                </>
                                              ) : (
                                                <>
                                                  <span className="text-sm">Show More</span>
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                  </svg>
                                                </>
                                              )}
                                    </button>
                                  </div>
                                                                                    <ThreadedDiscussion
                                            debateId={debate.id}
                                            roundIndex={firstSpeakerIndex}
                                            speakerIndex={0}
                                            content={expandedRounds.has(`${debate.id}-${firstSpeakerIndex}`) ? 
                                              debateRounds[debate.id][firstSpeakerIndex].text : 
                                              debateRounds[debate.id][firstSpeakerIndex].summary
                                            }
                                          />
                                  </div>
                                      </motion.div>
                                    )}
                                    
                                    {debateRounds[debate.id][secondSpeakerIndex] && (
                                      <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="flex justify-end"
                                      >
                                        <div 
                                          className="w-3/4 p-6 rounded-lg shadow-xl backdrop-blur-sm"
                                          style={{ 
                                            background: `linear-gradient(135deg, ${getStanceBackgroundColor(debate.model2.stance).replace('0.1', '0.2')}, ${getStanceBackgroundColor(debate.model2.stance).replace('0.1', '0.1')})`,
                                            border: `1px solid ${getStanceBackgroundColor(debate.model2.stance).replace('0.1', '0.3')}`,
                                          }}
                                        >
                                          <div className="flex items-center justify-between mb-3">
                                            <button
                                              onClick={() => toggleRoundExpansion(`${debate.id}-${secondSpeakerIndex}`)}
                                              className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
                                            >
                                              {expandedRounds.has(`${debate.id}-${secondSpeakerIndex}`) ? (
                                                <>
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                  </svg>
                                                  <span className="text-sm">Show Less</span>
                                                </>
                                              ) : (
                                                <>
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                  </svg>
                                                  <span className="text-sm">Show More</span>
                                                </>
                                              )}
                                            </button>
                                            <div className="text-lg font-semibold" style={{ color: getStanceColor(debate.model2.stance) }}>
                                              Second Speaker
                                </div>
                                          </div>
                                          <ThreadedDiscussion
                                            debateId={debate.id}
                                            roundIndex={secondSpeakerIndex}
                                            speakerIndex={1}
                                            content={expandedRounds.has(`${debate.id}-${secondSpeakerIndex}`) ? 
                                              debateRounds[debate.id][secondSpeakerIndex].text : 
                                              debateRounds[debate.id][secondSpeakerIndex].summary
                                            }
                                          />
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              // Fallback: show summaries from initial debate object if not expanded
                              debate.rounds && debate.rounds.map((round, roundIndex) => (
                                <div key={roundIndex} className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <h4 className="text-gray-300 font-medium">
                                      Round {roundIndex + 1} - {round.speaker}
                                    </h4>
                                  </div>
                                  <div className="text-gray-300">
                                    {round.summary}
                                  </div>
                                </div>
                              ))
                            )}
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