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
    const modelKey = `model${modelNum}` as const;
    const model = settings[modelKey as keyof DebateSettings] as AIModel;
    setSettings({
      ...settings,
      [modelKey]: {
        ...model,
        [setting]: value
      }
    });
  };

  const startDebate = async () => {
    if (!settings.topic) return;
    setIsDebating(true);
    // API call to backend will be implemented here
  };

  const getModelSettings = (modelNum: number) => {
    const key = `model${modelNum}` as keyof DebateSettings;
    return settings[key] as AIModel;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4 text-center">AI Verbatim</h1>
        <p className="text-xl text-gray-400 mb-8 text-center">The Frontier Destination for AI Debates</p>

        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-8">
          <div className="mb-8">
            <label className="block text-lg mb-2 text-white">Debate Topic</label>
            <input
              type="text"
              value={settings.topic}
              onChange={handleTopicChange}
              className="w-full bg-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a topic for debate..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((modelNum) => {
              const model = getModelSettings(modelNum);
              return (
                <div key={modelNum} className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-xl mb-4 text-white">AI Model {modelNum}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-gray-300">Model</label>
                      <select
                        value={model.name}
                        onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'name', e.target.value)}
                        className="w-full bg-gray-600 rounded px-3 py-2 text-white"
                      >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-1 text-gray-300">Temperature</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={model.temperature}
                        onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'temperature', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-400">
                        {model.temperature}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-gray-300">System Prompt</label>
                      <textarea
                        value={model.systemPrompt}
                        onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'systemPrompt', e.target.value)}
                        className="w-full bg-gray-600 rounded px-3 py-2 h-24 text-white"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={startDebate}
              disabled={isDebating || !settings.topic}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 py-3 rounded-lg font-semibold transition-colors text-white"
            >
              {isDebating ? 'Debate in Progress...' : 'Start Debate'}
            </button>
          </div>
        </div>

        {debate.length > 0 && (
          <div className="space-y-4">
            {debate.map((entry, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  entry.speaker === 'AI 1' ? 'bg-blue-900' : 'bg-purple-900'
                }`}
              >
                <div className="font-semibold mb-2 text-white">{entry.speaker}</div>
                <div className="text-gray-200">{entry.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebateEngine;