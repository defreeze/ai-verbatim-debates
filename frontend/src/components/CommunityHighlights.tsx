import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DebateHighlight {
  id: string;
  title: string;
  topic: string;
  date: string;
  votes: number;
  participants: string[];
}

const CommunityHighlights: React.FC = () => {
  // Placeholder data - in real app, this would come from an API
  const [highlights] = useState<DebateHighlight[]>([
    {
      id: '1',
      title: 'The Future of AI Ethics',
      topic: 'Should AI development be regulated?',
      date: '2024-06-08',
      votes: 156,
      participants: ['GPT-4', 'Claude']
    },
    {
      id: '2',
      title: 'Climate Change Solutions',
      topic: 'Nuclear vs Renewable Energy',
      date: '2024-06-07',
      votes: 142,
      participants: ['GPT-4', 'Claude']
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Community Highlights
        </h1>
        <p className="text-gray-400 text-center mb-12">
          Discover the most engaging and thought-provoking debates from our community
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {highlights.map((debate) => (
            <motion.div
              key={debate.id}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 rounded-lg p-6 shadow-lg"
            >
              <h2 className="text-xl font-semibold text-white mb-2">
                {debate.title}
              </h2>
              <p className="text-gray-400 mb-4">{debate.topic}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{debate.date}</span>
                <div className="flex items-center">
                  <button className="text-blue-500 hover:text-blue-400 mr-2">
                    ↑ {debate.votes}
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Featuring: {debate.participants.join(' vs ')}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CommunityHighlights; 