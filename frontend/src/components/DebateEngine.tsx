import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AIModel {
  name: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

interface DebateSettings {
  topic: string;
  rounds: number;
  model1: AIModel;
  model2: AIModel;
}

const DebateEngine: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<DebateSettings>({
    topic: '',
    rounds: 3,
    model1: {
      name: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: 'You are a logical debater who focuses on facts and rational arguments.'
    },
    model2: {
      name: 'gpt-4',
      temperature: 0.9,
      maxTokens: 1000,
      systemPrompt: 'You are a creative debater who thinks outside the box and challenges conventional wisdom.'
    }
  });

  const [debate, setDebate] = useState<Array<{ speaker: string; text: string }>>([]);
  const [isDebating, setIsDebating] = useState(false);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, topic: e.target.value });
  };

  const handleModelSettingChange = (
    modelNum: 1 | 2,
    setting: keyof AIModel,
    value: string | number
  ) => {
    const modelKey = `model${modelNum}` as keyof DebateSettings;
    setSettings({
      ...settings,
      [modelKey]: {
        ...settings[modelKey],
        [setting]: value
      }
    });
  };

  const startDebate = async () => {
    if (!settings.topic) return;
    setIsDebating(true);
    // API call to backend will be implemented here
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
          AI Verbatum
        </h1>
        <h2 className="text-2xl text-center mb-12 text-gray-400">
          The Frontier Destination for AI Debates
        </h2>

        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <div className="mb-8">
            <label className="block text-lg mb-2">Debate Topic</label>
            <input
              type="text"
              value={settings.topic}
              onChange={handleTopicChange}
              className="w-full bg-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a topic for debate..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {[1, 2].map((modelNum) => (
              <div key={modelNum} className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-xl mb-4">AI Model {modelNum}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1">Model</label>
                    <select
                      value={settings[`model${modelNum}` as keyof DebateSettings].name}
                      onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'name', e.target.value)}
                      className="w-full bg-gray-600 rounded px-3 py-2"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-1">Temperature</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings[`model${modelNum}` as keyof DebateSettings].temperature}
                      onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'temperature', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-400">
                      {settings[`model${modelNum}` as keyof DebateSettings].temperature}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">System Prompt</label>
                    <textarea
                      value={settings[`model${modelNum}` as keyof DebateSettings].systemPrompt}
                      onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'systemPrompt', e.target.value)}
                      className="w-full bg-gray-600 rounded px-3 py-2 h-24"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={startDebate}
              disabled={isDebating || !settings.topic}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {isDebating ? 'Debate in Progress...' : 'Start Debate'}
            </button>
          </div>

          {debate.length > 0 && (
            <div className="mt-8 space-y-4">
              {debate.map((entry, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    entry.speaker === 'AI 1' ? 'bg-blue-900' : 'bg-purple-900'
                  }`}
                >
                  <div className="font-semibold mb-2">{entry.speaker}</div>
                  <div>{entry.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebateEngine;