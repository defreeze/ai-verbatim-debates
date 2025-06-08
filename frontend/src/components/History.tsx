import React from 'react';
import { useAuth } from '../hooks/useAuth';

const History: React.FC = () => {
  const { user } = useAuth();

  // This is a placeholder for the debate history
  const mockDebates = [
    {
      id: 1,
      topic: "Should AI systems have rights?",
      date: "2024-02-08",
      rounds: 5,
      winner: "Model 1"
    },
    {
      id: 2,
      topic: "Is space exploration worth the cost?",
      date: "2024-02-07",
      rounds: 3,
      winner: "Model 2"
    },
    {
      id: 3,
      topic: "Should social media be regulated?",
      date: "2024-02-06",
      rounds: 4,
      winner: "Draw"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Debate History</h1>
      
      {!user ? (
        <div className="text-center text-gray-400">
          Please sign in to view your debate history
        </div>
      ) : (
        <div className="grid gap-6">
          {mockDebates.map(debate => (
            <div key={debate.id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">{debate.topic}</h2>
                  <p className="text-gray-400">Date: {debate.date}</p>
                  <p className="text-gray-400">Rounds: {debate.rounds}</p>
                </div>
                <div className={`px-3 py-1 rounded ${
                  debate.winner === "Draw" 
                    ? "bg-gray-600 text-gray-200"
                    : debate.winner === "Model 1"
                    ? "bg-blue-600 text-white"
                    : "bg-purple-600 text-white"
                }`}>
                  {debate.winner}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button className="text-blue-400 hover:text-blue-300 text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History; 