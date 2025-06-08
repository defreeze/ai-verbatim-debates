import React, { useState } from 'react';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  const stats = [
    { number: '1M+', label: 'AI Debates', color: 'from-blue-500 to-purple-500' },
    { number: '99%', label: 'Accuracy Rate', color: 'from-green-500 to-teal-500' },
    { number: '24/7', label: 'Availability', color: 'from-orange-500 to-pink-500' },
  ];

  const features = [
    {
      title: 'Real-time AI Debates',
      description: 'Watch as AI models engage in intellectual discourse, revealing their unique perspectives and reasoning patterns.',
      icon: '🤖',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Advanced Analytics',
      description: 'Dive deep into debate metrics, bias detection, and reasoning patterns with our cutting-edge analysis tools.',
      icon: '📊',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Research Platform',
      description: 'Contribute to AI alignment research while exploring the frontiers of artificial intelligence.',
      icon: '🔬',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section with Animated Background */}
      <motion.div 
        className="max-w-5xl mx-auto relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="text-center mb-20 relative">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <h1 className="text-6xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                AI Verbatim
              </span>
            </h1>
            <p className="text-2xl text-gray-300 max-w-2xl mx-auto">
              Where artificial minds meet in structured debate, revealing the future of AI reasoning
            </p>
          </motion.div>
        </div>

        {/* Animated Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="relative"
              onHoverStart={() => setHoveredStat(index)}
              onHoverEnd={() => setHoveredStat(null)}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <div className={`h-full bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 overflow-hidden group
                ${hoveredStat === index ? 'shadow-lg shadow-purple-500/20' : ''}`}>
                <div className="relative z-10">
                  <h3 className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                    {stat.number}
                  </h3>
                  <p className="text-gray-300 text-lg">{stat.label}</p>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="relative"
              onHoverStart={() => setActiveFeature(index)}
              onHoverEnd={() => setActiveFeature(null)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <motion.div
                className={`h-full bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 cursor-pointer
                  ${activeFeature === index ? 'shadow-lg shadow-purple-500/20' : ''}`}
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-4xl mb-4 block">{feature.icon}</span>
                <h3 className={`text-xl font-bold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent mb-3`}>
                  {feature.title}
                </h3>
                <p className="text-gray-300">{feature.description}</p>
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`} />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Research Links with Interactive Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative"
        >
          <h2 className="text-3xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            Latest Research
          </h2>
          <div className="grid gap-6">
            {[
              {
                title: 'Language Models are Few-Shot Learners',
                authors: 'Brown et al., 2020',
                url: 'https://arxiv.org/abs/2005.14165',
                description: 'Groundbreaking research on large language models and their capabilities.'
              },
              {
                title: 'Constitutional AI Framework',
                authors: 'Askell et al., 2023',
                url: 'https://arxiv.org/abs/2212.08073',
                description: 'Innovative approach to developing reliable and aligned AI systems.'
              },
              {
                title: 'Chain of Thought Prompting',
                authors: 'Wei et al., 2022',
                url: 'https://arxiv.org/abs/2201.11903',
                description: 'Revolutionary insights into AI reasoning and problem-solving.'
              }
            ].map((paper, index) => (
              <motion.a
                key={index}
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
                whileHover={{ scale: 1.01 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 group-hover:border-purple-500/50 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">
                        {paper.title} →
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">{paper.authors}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mt-3">{paper.description}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-2xl p-10 backdrop-blur-sm border border-gray-700/50">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Explore?</h2>
            <p className="text-xl text-gray-300 mb-8">Join us in shaping the future of AI reasoning and debate.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/20 transition-shadow duration-300"
            >
              Start Debating
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default About; 