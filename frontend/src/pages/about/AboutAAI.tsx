import React from 'react';

const AboutAAI: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <section className="mb-12">
        <p className="text-lg text-gray-300 mb-6">
          AI Verbatim is a revolutionary platform designed to elevate the quality of AI-driven debates through structured, 
          evidence-based discussions. Our platform combines cutting-edge AI technology with rigorous debate principles to 
          create meaningful and insightful exchanges.
        </p>
      </section>

      <section className="mb-12">
        <h3 className="text-2xl font-semibold text-white mb-4">Our Philosophy</h3>
        <div className="space-y-4">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
            <h4 className="text-xl font-medium text-blue-400 mb-2">Truth Through Dialogue</h4>
            <p className="text-gray-300">
              We believe that the best way to uncover truth is through structured dialogue. Our platform facilitates 
              debates that are grounded in facts, logical reasoning, and mutual respect.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
            <h4 className="text-xl font-medium text-blue-400 mb-2">AI-Enhanced, Human-Centered</h4>
            <p className="text-gray-300">
              While we leverage advanced AI technology, our platform remains fundamentally human-centered. The AI serves 
              to enhance, not replace, human reasoning and decision-making capabilities.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
            <h4 className="text-xl font-medium text-blue-400 mb-2">Evidence-Based Approach</h4>
            <p className="text-gray-300">
              Every debate on our platform is supported by verifiable evidence. Our system encourages participants to 
              back their arguments with credible sources and factual data.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h3 className="text-2xl font-semibold text-white mb-4">How to Use AI Verbatim</h3>
        <div className="space-y-4">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
            <h4 className="text-xl font-medium text-blue-400 mb-2">1. Choose Your Topic</h4>
            <p className="text-gray-300">
              Select from a wide range of debate topics or propose your own. Our platform supports discussions across 
              various categories including fact-based, value-based, and policy debates.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
            <h4 className="text-xl font-medium text-blue-400 mb-2">2. Engage in Structured Debate</h4>
            <p className="text-gray-300">
              Follow our three-stage debate format: constructive arguments, rebuttals, and summary statements. This 
              structure ensures comprehensive and well-organized discussions.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
            <h4 className="text-xl font-medium text-blue-400 mb-2">3. Review and Learn</h4>
            <p className="text-gray-300">
              After each debate, review the discussion, examine the evidence presented, and learn from different 
              perspectives. Our platform promotes continuous learning and intellectual growth.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
            <h4 className="text-xl font-medium text-blue-400 mb-2">4. Share with the community</h4>
            <p className="text-gray-300">
              The community hub is the centre of the platform where you can share and discuss debates with other users.
              We are continually developing new features to make the platform more engaging and interactive.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutAAI; 