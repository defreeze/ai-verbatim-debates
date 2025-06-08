import React, { useState } from 'react';
import { processDebateText } from '../utils/debateProcessor';
import DebateVisualizer from './DebateVisualizer';

// Import the ProcessedDebate type
import type { ProcessedDebate } from '../utils/debateProcessor';

const DebateView: React.FC = () => {
  const [speaker1Name, setSpeaker1Name] = useState('');
  const [speaker2Name, setSpeaker2Name] = useState('');
  const [transcript, setTranscript] = useState('');
  const [processedDebate, setProcessedDebate] = useState<ProcessedDebate | null>(null);

  const handleProcessDebate = () => {
    if (!speaker1Name || !speaker2Name || !transcript) {
      alert('Please fill in all fields');
      return;
    }

    const processed = processDebateText({
      speaker1Name,
      speaker2Name,
      transcript
    });

    setProcessedDebate(processed);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Speaker 1 Name</label>
            <input
              type="text"
              value={speaker1Name}
              onChange={(e) => setSpeaker1Name(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Speaker 2 Name</label>
            <input
              type="text"
              value={speaker2Name}
              onChange={(e) => setSpeaker2Name(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Debate Transcript</label>
          <div className="mt-1">
            <textarea
              rows={10}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder={`Format example:\n\n${speaker1Name || 'Speaker1'}: Your point here...\n\n${speaker2Name || 'Speaker2'}: Response here...\n\n${speaker1Name || 'Speaker1'}: Counter-argument here...`}
            />
          </div>
        </div>

        <button
          onClick={handleProcessDebate}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Visualize Debate
        </button>
      </div>

      {processedDebate && (
        <div className="mt-8">
          <DebateVisualizer debate={processedDebate} />
        </div>
      )}
    </div>
  );
};

export default DebateView; 