import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Navigation from './components/Navigation';
import DebateEngine from './components/DebateEngine';
import Login from './components/Login';
import About from './components/About';
import History from './components/History';
import Account from './components/Account';
import CommunityHub from './components/CommunityHub';
import { useAuth } from './hooks/useAuth';
import CommunityRankings from './components/CommunityRankings';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navigation />
          <Routes>
            <Route path="/" element={<DebateEngine />} />
            <Route path="/history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />
            <Route path="/community/*" element={<CommunityHub />}>
              <Route path="ranking" element={<CommunityRankings />} />
              <Route path="history" element={<Navigate to="/community/history" replace />} />
            </Route>
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 