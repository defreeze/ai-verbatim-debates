import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navigation: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Optimistic user state based on localStorage
  const [optimisticUser, setOptimisticUser] = useState(() => {
    return localStorage.getItem('lastUserLoggedIn') === 'true';
  });

  // Update localStorage when user logs in or out
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('lastUserLoggedIn', user ? 'true' : 'false');
      setOptimisticUser(!!user);
    }
  }, [loading, user]);

  // Use optimisticUser for initial render, real user after loading
  const showUser = loading ? optimisticUser : !!user;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center h-14">
                  <img src="/android-chrome-512x512.png" alt="DiscourseGraph Logo" className="h-10 w-10 object-contain" style={{ maxHeight: '2.5rem', opacity: 0.8 }} />
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/community/ranking"
                  className={`${
                    isActive('/community')
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  DiscourseGraph
                </Link>
                <Link
                  to="/engine"
                  className={`${
                    isActive('/') && location.pathname === '/engine'
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  AI Engine
                </Link>
                <Link
                  to="/about"
                  className={`${
                    isActive('/about')
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  About
                </Link>
              </div>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {showUser ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/account"
                    className="bg-blue-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  >
                    Account
                  </Link>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {/* Icon when menu is closed */}
                <svg
                  className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* Icon when menu is open */}
                <svg
                  className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Mobile menu dropdown */}
              {isOpen && (
                <React.Fragment>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-25 z-40"
                    onClick={() => setIsOpen(false)}
                  />
                  <div className="absolute right-0 top-16 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-700 z-50">
                    <div className="py-1 bg-gray-800">
                      <Link
                        to="/community/ranking"
                        className={`${
                          isActive('/community')
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        } block px-4 py-2 text-sm relative z-50`}
                        onClick={() => setIsOpen(false)}
                      >
                        DiscourseGraph
                      </Link>
                      <Link
                        to="/"
                        className={`${
                          isActive('/') && location.pathname === '/'
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        } block px-4 py-2 text-sm relative z-50`}
                        onClick={() => setIsOpen(false)}
                      >
                        Debate Engine
                      </Link>
                      <Link
                        to="/about"
                        className={`${
                          isActive('/about')
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        } block px-4 py-2 text-sm relative z-50`}
                        onClick={() => setIsOpen(false)}
                      >
                        About
                      </Link>
                    </div>
                    <div className="py-1 bg-gray-800">
                      {showUser ? (
                        <Link
                          to="/account"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white relative z-50"
                          onClick={() => setIsOpen(false)}
                        >
                          Account
                        </Link>
                      ) : (
                        <Link
                          to="/login"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white relative z-50"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign In
                        </Link>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;