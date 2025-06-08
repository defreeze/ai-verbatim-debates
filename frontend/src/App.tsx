import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Navigation from './components/Navigation';
import DebateEngine from './components/DebateEngine';
import Login from './pages/Login';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Navigation />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/engine" element={<DebateEngine />} />
            <Route path="/" element={<Navigate to="/engine" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 