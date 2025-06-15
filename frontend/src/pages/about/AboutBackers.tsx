import React from 'react';
import { Backer } from '../../types';

// Mock data for demonstration
const backers: Backer[] = [
  { name: 'Alice Smith', amount: 50, message: 'Keep up the great work!', date: '2024-06-01' },
  { name: 'Bob Lee', amount: 20, date: '2024-06-03' },
  { name: 'Charlie Kim', amount: 100, message: 'Proud to support the community.', date: '2024-06-05' },
];

const AboutBackers: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <section className="mb-12">
        <p className="text-lg text-gray-300 mb-6">
          The platform stays independent and community-driven through your support. Paid subscriptions help, but direct donations from backers make an even bigger impact in keeping the platform running and free.
        </p>
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg mb-8">
          <h3 className="text-xl font-semibold text-blue-400 mb-2">Why Donate?</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>To keep the platform running and free to use</li>
            <li>To keep the platform independent, free from outside influence</li>
            <li>To help us build new features and improve accessibility for all</li>
          </ul>
          <p className="mt-4 text-gray-400">
            Every donation, no matter the size, is recognized here. Thank you for helping us stay independent!
          </p>
        </div>
        <div className="bg-gray-900/60 rounded-lg p-6 border border-gray-700/50">
          <h3 className="text-xl font-semibold text-white mb-4">Our Backers</h3>
          <div className="backdrop-blur-[8px] blur-[6px] select-none pointer-events-none">
            {backers.length === 0 ? (
              <p className="text-gray-400">No donations yet. Be the first to support us!</p>
            ) : (
              <ul className="space-y-4">
                {backers.map((backer, idx) => (
                  <li key={idx} className="bg-gray-800/40 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="font-semibold text-blue-300">{backer.name}</span>
                      <span className="ml-2 text-gray-400 text-sm">on {new Date(backer.date).toLocaleDateString()}</span>
                      {backer.message && (
                        <div className="mt-1 text-gray-300 italic">"{backer.message}"</div>
                      )}
                    </div>
                    <div className="mt-2 md:mt-0 text-lg font-bold text-green-400">${backer.amount}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-400">We currently do not accept donations.</p>
        </div>
      </section>
    </div>
  );
};

export default AboutBackers; 