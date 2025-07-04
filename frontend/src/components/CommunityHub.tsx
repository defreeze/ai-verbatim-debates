import React, { useMemo } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import CommunityLibrary from './CommunityRankings';
import DebateHistory from './DebateHistory';
import { useAuth } from '../hooks/useAuth';

const CommunityHub: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const randomText = useMemo(() => {
    return Math.random() < 0.75
      ? 'Humans discuss here, inspired and guided by ever scrutinizable AI.'
      : 'think for yourself';
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-relaxed pb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600">
            Community Hub
          </h1>
          <p className="text-xl text-gray-400 font-light tracking-wide text-center">
            {location.pathname.endsWith('/history')
              ? 'Your own debate generations, accesable only to you'
              : randomText}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <nav className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 inline-flex">
            <NavLink
              to="/community/ranking"
              className={({ isActive }) =>
                `px-6 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`
              }
            >
              Community Forum
            </NavLink>
            <NavLink
              to="/community/history"
              className={({ isActive }) =>
                `px-6 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`
              }
            >
              Account Activity
            </NavLink>
          </nav>
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/ranking" element={<CommunityLibrary />} />
          <Route path="/history" element={<DebateHistory />} />
        </Routes>
      </div>
    </div>
  );
};

export default CommunityHub;
export {}; 