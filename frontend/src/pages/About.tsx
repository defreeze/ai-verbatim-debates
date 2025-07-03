import React, { useState } from 'react';
import AboutAAI from './about/AboutAAI';
import AboutScience from './about/AboutScience';
import AboutBackers from './about/AboutBackers';

const About: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'aai' | 'science' | 'backers'>('aai');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold leading-relaxed pb-2 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600">
            About DiscourseGraph
          </h1>
          <p className="text-xl text-gray-400 font-light tracking-wide mt-2 mb-8">
            Learn about the vision, how it is realised and how to support it          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <nav className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 inline-flex">
            <button
              onClick={() => setActiveTab('aai')}
              className={`px-6 py-2 rounded-lg transition-colors ${
                activeTab === 'aai'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              The Philosophy
            </button>
            <button
              onClick={() => setActiveTab('science')}
              className={`px-6 py-2 rounded-lg transition-colors ${
                activeTab === 'science'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              The Science
            </button>
            <button
              onClick={() => setActiveTab('backers')}
              className={`px-6 py-2 rounded-lg transition-colors ${
                activeTab === 'backers'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              The Backers
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-8">
          {activeTab === 'aai' && <AboutAAI />}
          {activeTab === 'science' && <AboutScience />}
          {activeTab === 'backers' && <AboutBackers />}
        </div>
      </div>
    </div>
  );
};

export default About; 