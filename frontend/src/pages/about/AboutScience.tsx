import React from 'react';

const AboutScience: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <section className="mb-12">
        <p className="text-lg text-gray-300 mb-6">
          AI Verbatim is powered by a sophisticated multi-agent framework that leverages advanced Language Models (LLMs) 
          to achieve human-level performance in competitive debate. Our system employs a dynamic architecture where 
          specialized agents work together to deliver comprehensive and accurate debates.
        </p>
      </section>

      <section className="mb-12">
        <h3 className="text-2xl font-semibold text-white mb-4">Multi-Agent Architecture</h3>
        <div className="mb-8">
          <img 
            src="/agent4debate.png" 
            alt="Multi-Agent System Architecture" 
            className="w-full rounded-lg shadow-lg mb-4 border border-gray-700"
          />
          <p className="text-sm text-gray-400 text-center">
             The basis of the multi agent logic framework is shown here. It is designed to optimize their capabilities in competitive debate
          </p>
          <p className="text-sm text-blue-400 hover:text-blue-300 transition-colors text-center mt-1">
            <a href="https://github.com/ZhangYiqun018/agent-for-debate" target="_blank" rel="noopener noreferrer">
              Source: Agent4Debate Research Framework
            </a>
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
            <h4 className="text-xl font-medium text-white mb-2">Specialized Agents</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-blue-400">Searcher Agent</h5>
                <p className="text-gray-300">
                  Responsible for gathering relevant information and evidence from various sources to support arguments 
                  and fact-checking.
                </p>
              </div>
              <div>
                <h5 className="font-medium text-blue-400">Analyzer Agent</h5>
                <p className="text-gray-300">
                  Processes and analyzes gathered information, evaluates argument strength, and identifies logical 
                  connections and potential counterarguments.
                </p>
              </div>
              <div>
                <h5 className="font-medium text-blue-400">Writer Agent</h5>
                <p className="text-gray-300">
                  Crafts coherent and persuasive arguments, incorporating evidence and analysis while maintaining 
                  proper debate structure and flow.
                </p>
              </div>
              <div>
                <h5 className="font-medium text-blue-400">Reviewer Agent</h5>
                <p className="text-gray-300">
                  Ensures quality control by checking for accuracy, logical consistency, and adherence to debate format 
                  and rules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h3 className="text-2xl font-semibold text-white mb-4">Debate Structure</h3>
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg space-y-4">
          <div>
            <h4 className="text-xl font-medium text-white mb-2">Three-Stage Format</h4>
            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-blue-400">1. Constructive Arguments</h5>
                <p className="text-gray-300">
                  Initial presentation of main arguments and supporting evidence, establishing the foundation for debate.
                </p>
              </div>
              <div>
                <h5 className="font-medium text-blue-400">2. Rebuttals</h5>
                <p className="text-gray-300">
                  Critical analysis and response to opposing arguments, highlighting weaknesses and presenting counter-evidence.
                </p>
              </div>
              <div>
                <h5 className="font-medium text-blue-400">3. Summary Statements</h5>
                <p className="text-gray-300">
                  Concise recap of key points, reinforcement of strongest arguments, and final appeal to the audience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h3 className="text-2xl font-semibold text-white mb-4">Performance and Validation</h3>
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
          <p className="text-gray-300 mb-4">
            Our system has been extensively tested across 200 debate matches, covering 66 unique debate motions in three 
            categories: Fact, Value, and Policy. Performance evaluation using Elo ranking systems has demonstrated that 
            our AI agents can achieve and sometimes exceed human-level performance in structured debates.
          </p>
          <div className="space-y-2">
            <p className="text-gray-300">
              Key achievements include:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
              <li>Competitive performance against experienced human debaters</li>
              <li>Strong results across all debate categories</li>
              <li>Consistent fact-checking and evidence-based argumentation</li>
              <li>Dynamic adaptation to different debate styles and topics</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutScience; 