import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AIModel {
  name: string;
  stance: number;
  rhetoricStyle: string;
  maxTokens: number;
  systemPrompt: string;
  showGuidance: boolean;
}

interface DebateSettings {
  topic: string;
  rounds: number;
  model1: AIModel;
  model2: AIModel;
}

const rhetoricStyles = [
  {
    value: 'standard',
    label: 'Standard',
    description: 'Uses the standard rhetoric style of the AI model without adjusting its tone'
  },
  {
    value: 'formal',
    label: 'Formal / Academic',
    description: 'Uses scholarly language, cites research, and maintains professional tone'
  },
  {
    value: 'casual',
    label: 'Casual / Conversational',
    description: 'Adopts a friendly, approachable tone with everyday language'
  },
  {
    value: 'emotional',
    label: 'Emotional / Passionate',
    description: 'Emphasizes personal impact and appeals to emotions'
  },
  {
    value: 'factual',
    label: 'Dry / Factual',
    description: 'Focuses purely on data and objective information'
  },
  {
    value: 'persuasive',
    label: 'Persuasive / Rhetorical',
    description: 'Uses rhetorical devices and compelling arguments'
  }
];

// Popular debate topics
const debateTopics = [
  "Should artificial intelligence be given legal rights?",
  "Is universal basic income necessary in an AI-driven economy?",
  "Should social media companies be held responsible for misinformation?",
  "Is space colonization essential for humanity's survival?",
  "Should genetic engineering of human embryos be allowed?",
  "Is a cashless society beneficial or harmful?",
  "Should voting be mandatory in democratic countries?",
  "Is nuclear energy the solution to climate change?",
  "Should autonomous vehicles be required to prioritize passenger or pedestrian safety?",
  "Is internet access a fundamental human right?",
  "Should governments ban deepfake content entirely?",
  "Is it ethical to use AI for hiring decisions?",
  "Is cryptocurrency a viable replacement for traditional currency?",
  "Is it ethical to create conscious AI?",
  "Should autonomous drones be allowed in warfare?",
  "Should human workers compete with AI for creative jobs?",
  "Should governments ban deepfake content entirely?",
  "Is it ethical to use AI for hiring decisions?",
  "Is cryptocurrency a viable replacement for traditional currency?",
  "Is it ethical to create conscious AI?",
  "Should autonomous drones be allowed in warfare?",
  "Should human workers compete with AI for creative jobs?",
  "Should countries implement a four-day workweek?",
  "Is privacy more important than national security?",
  "Should fossil fuel companies be held legally liable for climate change?",
  "Should healthcare be completely free in all countries?",
  "Should the voting age be lowered to 16?",
  "Should borders be open in a globalized world?",
  "Is homeschooling better than traditional schooling?",
  "Should meat consumption be taxed to fight climate change?",
  "Is cancel culture a threat to free speech?",
  "Should recreational drug use be legalized worldwide?",
  "Should social media platforms be age-restricted to 16+?",
  "Are beauty standards harmful to society?",
  "Should all museums return artifacts to their countries of origin?",
  "Is it ethical to have children in a world facing climate crisis?",
  "Should nationalism be considered a threat to global peace?",
  "Is space tourism worth the environmental cost?",
  "Should humanity aim to become a multi-planet species or fix Earth first?",
  "Should pineapple be allowed on pizza?",
  "Is it better to be an early bird or a night owl?",
  "Are e-books better than physical books?",
  "Should we ban reality TV shows?",
  "Is coffee superior to tea?",
  "Should emojis be used in professional emails?",
  "Is it acceptable to wear socks with sandals?",
  "Is it better to vacation in the mountains or at the beach?",
  "Should video games be considered a sport?",
  "Is it better to binge-watch a series or watch it week by week?"
];

const DebateEngine: React.FC = () => {
  const { user } = useAuth();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [settings, setSettings] = useState<DebateSettings>({
    topic: '',
    rounds: 3,
    model1: {
      name: 'gpt-4',
      stance: -1,
      rhetoricStyle: 'standard',
      maxTokens: 1000,
      systemPrompt: '',
      showGuidance: false
    },
    model2: {
      name: 'gpt-4',
      stance: 1,
      rhetoricStyle: 'standard',
      maxTokens: 1000,
      systemPrompt: '',
      showGuidance: false
    }
  });

  const [debate, setDebate] = useState<Array<{ speaker: string; text: string }>>([]);
  const [isDebating, setIsDebating] = useState(false);

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, topic: e.target.value });
  };

  const handleRandomTopic = () => {
    const randomIndex = Math.floor(Math.random() * debateTopics.length);
    setSettings({ ...settings, topic: debateTopics[randomIndex] });
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

  const getStanceLabel = (value: number): string => {
    if (value <= -0.8) return 'Strongly Against';
    if (value <= -0.3) return 'Against';
    if (value <= 0.3) return 'Neutral';
    if (value <= 0.8) return 'For';
    return 'Strongly For';
  };

  const getStanceColor = (value: number): string => {
    if (value <= -0.8) return 'rgb(239 68 68)'; // red-500
    if (value <= -0.3) return 'rgb(248 113 113)'; // red-400
    if (value <= 0.3) return 'rgb(107 114 128)'; // gray-500
    if (value <= 0.8) return 'rgb(74 222 128)'; // green-400
    return 'rgb(34 197 94)'; // green-500
  };

  const toggleGuidance = () => {
    setShowAdvancedSettings(!showAdvancedSettings);
    setSettings({
      ...settings,
      model1: {
        ...settings.model1,
        showGuidance: !showAdvancedSettings
      },
      model2: {
        ...settings.model2,
        showGuidance: !showAdvancedSettings
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4 text-center">AI Verbatim</h1>
        <p className="text-xl text-gray-400 mb-8 text-center">The Frontier Destination for AI Debates</p>

        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-8">
          <div className="mb-8">
            <label className="block text-lg mb-2 text-white">Debate Topic</label>
            <div className="flex gap-4">
              <input
                type="text"
                value={settings.topic}
                onChange={handleTopicChange}
                className="flex-1 bg-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a topic for debate..."
              />
              <button
                onClick={handleRandomTopic}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white flex items-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Random Topic
              </button>
            </div>
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
                      <label className="block mb-1 text-gray-300">Argument Stance</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-red-500 text-sm">Against</span>
                        <input
                          type="range"
                          min="-1"
                          max="1"
                          step="0.1"
                          value={model.stance}
                          onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'stance', parseFloat(e.target.value))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, rgb(239 68 68), rgb(107 114 128), rgb(34 197 94))`,
                          }}
                        />
                        <span className="text-green-500 text-sm">For</span>
                      </div>
                      <div className="text-sm mt-1 text-center" style={{ color: getStanceColor(model.stance) }}>
                        {getStanceLabel(model.stance)}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-gray-300">Rhetoric Style</label>
                      <select
                        value={model.rhetoricStyle}
                        onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'rhetoricStyle', e.target.value)}
                        className="w-full bg-gray-600 rounded px-3 py-2 text-white"
                      >
                        {rhetoricStyles.map((style) => (
                          <option key={style.value} value={style.value}>
                            {style.label}
                          </option>
                        ))}
                      </select>
                      <div className="text-sm text-gray-400 mt-1">
                        {rhetoricStyles.find(style => style.value === model.rhetoricStyle)?.description}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <button
                          onClick={() => toggleGuidance()}
                          className="text-gray-300 hover:text-white flex items-center gap-2 text-sm"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                          Advanced Settings
                        </button>
                      </div>
                      {showAdvancedSettings && (
                        <>
                          <label className="block text-sm text-gray-300 mb-1">Debate Instructions</label>
                          <textarea
                            value={model.systemPrompt}
                            onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'systemPrompt', e.target.value)}
                            className="w-full bg-gray-600 rounded px-3 py-2 h-24 text-white"
                            placeholder="Add details to adjust model behaviour such as 'Debate like the Pope, talk from the perspective of a cat'"
                          />
                        </>
                      )}
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