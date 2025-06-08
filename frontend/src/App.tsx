import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Navigation from './components/Navigation';
import DebateEngine from './components/DebateEngine';
import Login from './components/Login';
import History from './components/History';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navigation />
          <Routes>
            <Route path="/" element={<div>Welcome to AI Verbatim</div>} />
            <Route path="/engine" element={<DebateEngine />} />
            <Route path="/history" element={<History />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 