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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900 rounded-lg p-8 shadow-xl"
      >
        <h1 className="text-3xl font-bold text-white mb-6">About AI Verbatim Debates</h1>
        
        <div className="space-y-6 text-gray-300">
          <p className="text-lg">
            This platform implements a sophisticated AI debate system based on the research methodology 
            outlined in the paper "Can LLMs Beat Humans in Debating?"
          </p>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Our Debate Process</h2>
            <p className="mb-4">
              Our AI debaters implement the methodology from the research paper "Can LLMs Beat Humans in Debating?", 
              which introduces a dynamic multi-agent framework designed to enhance LLMs' capabilities in competitive debate:
            </p>
            
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl text-white mb-2">1. Information Processing</h3>
                <p>The AI acts as a Searcher agent, analyzing the debate topic and stance, gathering relevant information, 
                and identifying key arguments and potential counterpoints while avoiding hallucinations.</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl text-white mb-2">2. Strategic Planning</h3>
                <p>Taking on the role of an Analyzer agent, the AI develops a debate strategy by evaluating argument 
                strength, organizing points in a logical sequence, and preparing responses to anticipated counterarguments.</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl text-white mb-2">3. Argument Construction</h3>
                <p>As a Writer agent, the AI constructs compelling arguments supported by evidence and logical reasoning, 
                ensuring coherence and persuasiveness while maintaining factual accuracy.</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl text-white mb-2">4. Dynamic Response</h3>
                <p>The AI combines Analyzer and Writer roles to process opposing arguments in real-time, 
                identify their strengths and weaknesses, and formulate effective counterarguments.</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl text-white mb-2">5. Quality Assurance</h3>
                <p>Acting as a Reviewer agent, the AI evaluates and refines its arguments, ensuring they meet 
                debate standards, maintain logical consistency, and effectively advance the overall position.</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Customization Features</h2>
            <p>
              Users can customize various aspects of the AI debaters, including their stance, 
              personality, and debate style. Advanced settings allow for fine-tuning of the model's 
              behavior and rhetorical approach.
            </p>
          </div>

          <div className="mt-8 text-sm text-gray-400">
            <p>
              This implementation builds upon academic research in AI debate systems and natural 
              language processing, aiming to create engaging and insightful debate experiences.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About; 