import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDebateUsage } from '../services/debateUsage';
import { DebateUsage } from '../types';
import { Timestamp } from 'firebase/firestore';

const Account: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [debateUsage, setDebateUsage] = useState<DebateUsage | null>(null);

  useEffect(() => {
    const fetchDebateUsage = async () => {
      if (user) {
        console.log('Fetching debate usage for user:', { 
          uid: user.uid, 
          email: user.email,
          user: user // Log full user object
        });
        const usage = await getDebateUsage(user.uid, user.email);
        console.log('Received debate usage:', usage);
        setDebateUsage(usage);
      }
    };
    fetchDebateUsage();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const formatDate = (value: string | undefined | Timestamp | null) => {
    if (!value) return 'Unknown';
    
    let date: Date;
    if (typeof value === 'string') {
      date = new Date(value);
    } else if (value instanceof Timestamp) {
      date = value.toDate();
    } else {
      return 'Unknown';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const memberSinceDate = formatDate(user.metadata?.creationTime);
  const lastDebateDate = debateUsage?.lastDebateStarted ? formatDate(debateUsage.lastDebateStarted) : 'Never';

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg shadow-xl p-6 md:p-8 space-y-8 border border-gray-700/50">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Account Settings</h2>
            
            {/* Profile Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Email</label>
                  <div className="mt-1 text-white">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Account Type</label>
                  <div className="mt-1 text-white">Free Plan</div>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">Usage Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-400">Member Since</div>
                  <div className="mt-1 text-2xl font-semibold text-white">
                    {memberSinceDate}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div 
                    className="text-sm font-medium text-gray-400 cursor-help flex items-center gap-1"
                    title="After a week without debates you get 1 for free!"
                  >
                    Free Debates Remaining
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white flex items-center gap-2">
                    {debateUsage?.freeDebatesRemaining || 0}
                    {debateUsage?.freeDebatesRemaining === 0 && debateUsage?.lastDebateStarted && (
                      <span className="text-sm text-gray-400 font-normal">
                        (Refreshes after 6 days of inactivity)
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-400">Last Debate</div>
                  <div className="mt-1 text-2xl font-semibold text-white">
                    {lastDebateDate}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-400">Total Debates Generated</div>
                  <div className="mt-1 text-2xl font-semibold text-white">
                    {debateUsage?.totalDebates || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">Subscription</h3>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                <h4 className="text-lg font-medium text-white">Free Plan</h4>
                <p className="mt-2 text-gray-300">Upgrade to Pro for unlimited debates and advanced features.</p>
                <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">Account Actions</h3>
              <div className="flex justify-center">
                <button
                  onClick={handleSignOut}
                  className="w-32 bg-red-600/20 text-red-500 border border-red-600/30 px-4 py-2 rounded hover:bg-red-600/30 transition-colors text-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account; 