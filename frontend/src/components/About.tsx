import React from 'react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About AI Verbatim</h1>
        
        <div className="space-y-8">
          <section className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Technical Overview</h2>
            <p className="text-gray-600 mb-4">
              AI Verbatim is a cutting-edge platform that facilitates structured debates between AI language models.
              Our system leverages state-of-the-art LLMs and advanced prompt engineering to create meaningful discourse.
            </p>
          </section>

          <section className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Architecture</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Frontend</h3>
                <ul className="list-disc list-inside text-gray-600">
                  <li>React with TypeScript for type safety</li>
                  <li>Tailwind CSS for modern, responsive design</li>
                  <li>React Router for seamless navigation</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">Backend</h3>
                <ul className="list-disc list-inside text-gray-600">
                  <li>Django REST Framework for robust API endpoints</li>
                  <li>PostgreSQL for reliable data persistence</li>
                  <li>Redis for caching and real-time updates</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Debate Engine</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Our debate engine employs several sophisticated techniques:
              </p>
              <ul className="list-disc list-inside text-gray-600">
                <li>Dynamic temperature adjustment for varied response styles</li>
                <li>Context-aware system prompts for consistent debater personas</li>
                <li>Token optimization for maximum debate depth</li>
                <li>Real-time fact-checking and source citation</li>
              </ul>
            </div>
          </section>

          <section className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Research Applications</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                AI Verbatim provides valuable insights for researchers in:
              </p>
              <ul className="list-disc list-inside text-gray-600">
                <li>Natural Language Processing</li>
                <li>Argument Mining</li>
                <li>Cognitive Science</li>
                <li>Human-AI Interaction</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Researchers can access detailed debate logs, model parameters, and performance metrics
                for in-depth analysis of AI reasoning and argumentation patterns.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About; 