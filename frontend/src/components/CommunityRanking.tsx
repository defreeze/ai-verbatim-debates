import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DebatePost {
  id: string;
  topic: string;
  upvotes: number;
  comments: number;
  category: string;
  author: string;
  timestamp: string;
}

const categories = [
  'All',
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

const mockDebates: DebatePost[] = [
  {
    id: '1',
    topic: 'AI should be given legal rights',
    upvotes: 156,
    comments: 23,
    category: 'Technology',
    author: 'TechDebater',
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    topic: 'Universal basic income is necessary',
    upvotes: 98,
    comments: 45,
    category: 'Economics',
    author: 'EconExpert',
    timestamp: '5 hours ago'
  },
  // Add more mock debates as needed
];

const CommunityRanking: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'controversial'>('popular');

  return (
    <div className="space-y-8">
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

          {/* Sort Options */}
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
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  sortBy === 'recent'
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
          </div>
        </div>
      </div>

      {/* Debate List */}
      <div className="space-y-4">
        {mockDebates.map((debate) => (
          <motion.div
            key={debate.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/30 rounded-lg p-6 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Upvote Column */}
              <div className="flex flex-col items-center space-y-1">
                <button className="text-gray-400 hover:text-blue-500 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                <span className="text-lg font-semibold text-blue-500">
                  {debate.upvotes}
                </span>
              </div>

              {/* Content Column */}
              <div className="flex-1">
                <h3 className="text-xl font-medium text-white mb-2">
                  {debate.topic}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="bg-gray-700/50 px-2 py-1 rounded">
                    {debate.category}
                  </span>
                  <span>by {debate.author}</span>
                  <span>{debate.timestamp}</span>
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    {debate.comments} comments
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors">
                View Debate
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CommunityRanking; 