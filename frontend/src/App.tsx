import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Navigation from './components/Navigation';
import DebateEngine from './components/DebateEngine';
import Login from './components/Login';
import About from './components/About';
import History from './components/History';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navigation />
          <Routes>
            <Route path="/" element={<DebateEngine />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 