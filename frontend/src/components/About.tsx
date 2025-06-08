import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4 text-center">About AI Verbatim</h1>
        
        <div className="space-y-8">
          {/* Introduction Section */}
          <section className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">The Future of AI Debate</h2>
            <p className="text-gray-300 mb-4">
              AI Verbatim represents a groundbreaking approach to understanding artificial intelligence through structured debate.
              By pitting different language models against each other, we create a unique window into their reasoning capabilities,
              biases, and potential limitations.
            </p>
          </section>

          {/* Research Background */}
          <section className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Research Foundations</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Key Research Papers</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>"Language Models are Few-Shot Learners" (Brown et al., 2020) - Demonstrated the emergent reasoning capabilities of large language models</li>
                  <li>"Constitutional AI: A Framework for Machine Learning Systems" (Askell et al., 2023) - Explored ways to make AI systems more reliable and aligned with human values</li>
                  <li>"Chain of Thought Prompting Elicits Reasoning in Large Language Models" (Wei et al., 2022) - Showed how structured prompting can improve reasoning</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Why It Matters */}
          <section className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Why AI Debates Matter</h2>
            <div className="space-y-4">
              <p className="text-gray-300">
                AI debates serve multiple crucial purposes in advancing our understanding of language models:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Revealing reasoning patterns and logical frameworks used by different models</li>
                <li>Exposing potential biases and limitations in AI thinking</li>
                <li>Demonstrating the impact of different training approaches and model architectures</li>
                <li>Providing insights into AI alignment and safety considerations</li>
              </ul>
            </div>
          </section>

          {/* How to Use Effectively */}
          <section className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Maximizing Debate Value</h2>
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-white mb-2">Best Practices</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Choose contrasting topics that challenge different aspects of AI reasoning</li>
                <li>Experiment with temperature settings to balance creativity and logical consistency</li>
                <li>Use system prompts that encourage specific debate styles or philosophical frameworks</li>
                <li>Compare responses across different model versions to track improvements</li>
              </ul>
            </div>
          </section>

          {/* Real-World Applications */}
          <section className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Applications & Impact</h2>
            <div className="space-y-4">
              <p className="text-gray-300">
                The insights gained from AI debates have practical applications across multiple fields:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Education: Understanding complex topics through multiple AI perspectives</li>
                <li>Research: Exploring AI reasoning and decision-making processes</li>
                <li>Ethics: Investigating AI biases and moral reasoning capabilities</li>
                <li>Development: Improving prompt engineering and model training techniques</li>
              </ul>
            </div>
          </section>

          {/* Future Directions */}
          <section className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Looking Forward</h2>
            <p className="text-gray-300">
              As language models continue to evolve, AI Verbatim will expand to incorporate new capabilities,
              including multi-model debates, real-time fact-checking, and integration with specialized domain experts.
              Our goal is to create an ever-more-powerful tool for understanding and improving AI reasoning.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About; 