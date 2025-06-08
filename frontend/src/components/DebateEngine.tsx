import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

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
  moderatorEnabled: boolean;
  debateStyle: string;
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
    label: 'Formal',
    description: 'Uses scholarly language, cites research, and maintains professional tone'
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Adopts a friendly, approachable tone with everyday language'
  },
  {
    value: 'emotional',
    label: 'Emotional',
    description: 'Emphasizes personal impact and appeals to emotions'
  },
  {
    value: 'factual',
    label: 'Factual',
    description: 'Focuses purely on data and objective information'
  },
  {
    value: 'adversarial',
    label: 'Adversarial',
    description: 'Seeks to discredit the opponent and undermine their arguments'
  }
];

const debateStyles = [
  {
    value: 'structured',
    label: 'Structured Debate',
    description: 'Formal format with opening statements, rebuttals, and closing arguments'
  },
  {
    value: 'oxford',
    label: 'Oxford Style',
    description: 'Traditional format with proposition and opposition teams'
  },
  {
    value: 'crossfire',
    label: 'Crossfire',
    description: 'Direct back-and-forth exchanges between debaters'
  },
  {
    value: 'parliamentary',
    label: 'Parliamentary',
    description: 'Based on legislative debate procedures with points of order'
  },
  {
    value: 'comment_section',
    label: 'Internet Comment Section',
    description: 'Unhinged, passionate back-and-forth like in an online comment thread, facts optional'
  }
];

// Popular debate topics
const debateTopics = [
  "AI should be given legal rights.",
  "Universal basic income is necessary in an AI-driven economy.",
  "Social media companies should be held responsible for misinformation.",
  "Space colonization is essential for humanity's survival.",
  "Genetic engineering of human embryos should be allowed.",
  "A cashless society is beneficial.",
  "Voting should be mandatory in democratic countries.",
  "Nuclear energy is the solution to climate change.",
  "Autonomous vehicles should prioritize passenger safety over pedestrian safety.",
  "Internet access is a fundamental human right.",
  "Governments should ban deepfake content entirely.",
  "It is ethical to use AI for hiring decisions.",
  "Cryptocurrency is a viable replacement for traditional currency.",
  "It is ethical to create conscious AI.",
  "Autonomous drones should be allowed in warfare.",
  "Human workers should compete with AI for creative jobs.",
  "Countries should implement a four-day workweek.",
  "Privacy is more important than national security.",
  "Fossil fuel companies should be held legally liable for climate change.",
  "Healthcare should be completely free in all countries.",
  "The voting age should be lowered to 16.",
  "Borders should be open in a globalized world.",
  "Homeschooling is better than traditional schooling.",
  "Meat consumption should be taxed to fight climate change.",
  "Cancel culture is a threat to free speech.",
  "Recreational drug use should be legalized worldwide.",
  "Social media platforms should be age-restricted to 16+.",
  "Beauty standards are harmful to society.",
  "Museums should return artifacts to their countries of origin.",
  "It is ethical to have children in a world facing climate crisis.",
  "Nationalism is a threat to global peace.",
  "Space tourism is worth the environmental cost.",
  "Humanity should become a multi-planet species.",
  "Pineapple belongs on pizza.",
  "Being an early bird is better than being a night owl.",
  "E-books are better than physical books.",
  "Reality TV shows should be banned.",
  "Coffee is superior to tea.",
  "Emojis should be used in professional emails.",
  "It is acceptable to wear socks with sandals.",
  "Vacations in the mountains are better than at the beach.",
  "Video games should be considered a sport.",
  "Binge-watching a series is better than watching it week by week.",
  "Facial recognition technology should be banned in public spaces.",
  "Time travel should be pursued as a scientific goal.",
  "AI-generated art should be eligible for copyright protection.",
  "The government should provide free public transportation.",
  "Online anonymity should be restricted to prevent abuse.",
  "Cloning extinct animals should be allowed.",
  "Robot soldiers should be banned under international law.",
  "Personal carbon footprint tracking should be mandatory.",
  "Brain-computer interfaces should be regulated strictly.",
  "Influencer marketing should be more heavily regulated.",
  "AI-generated news articles should be clearly labeled.",
  "The concept of marriage is outdated.",
  "The world should adopt a universal language.",
  "High-stakes standardized testing should be abolished.",
  "The rich should pay significantly higher taxes.",
  "Parents should have the right to genetically select traits for their children.",
  "AI should be used to replace politicians.",
  "Human life should be extended indefinitely through technology.",
  "All museums should be free to the public.",
  "Zero-waste lifestyles should be incentivized by governments.",
  "Military service should be mandatory for all citizens.",
  "Universal basic services are better than universal basic income.",
  "Extreme sports should be banned for safety reasons.",
  "Deep-sea mining should be prohibited.",
  "Remote work should be the default for knowledge workers.",
  "School uniforms should be mandatory.",
  "The use of animals in entertainment should be banned.",
  "Public surveillance cameras do more harm than good.",
  "Space should be declared a global commons.",
  "Human rights should extend to certain intelligent animals.",
  "Free will is an illusion.",
  "Consciousness can be fully explained by physical processes.",
  "Morality is objective and universal.",
  "The universe had a purpose in its creation.",
  "Artificial consciousness is possible.",
  "Personal identity persists after physical death.",
  "Reality is fundamentally mathematical.",
  "Time is an emergent illusion, not a fundamental property.",
  "There are moral obligations to future generations.",
  "Simulated beings should be granted rights.",
  "The universe is infinite.",
  "Truth is a social construct.",
  "Beauty is an objective property.",
  "The mind can exist independently of the body.",
  "The concept of self is a useful fiction."
];


const DebateEngine: React.FC = () => {
  const { user } = useAuth();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  
  // Randomly determine initial stances
  const initialStances = useMemo(() => {
    return Math.random() < 0.5 ? { model1: -1, model2: 1 } : { model1: 1, model2: -1 };
  }, []);

  const [settings, setSettings] = useState<DebateSettings>({
    topic: '',
    rounds: 3,
    moderatorEnabled: false,
    debateStyle: 'structured',
    model1: {
      name: 'gpt-4',
      stance: initialStances.model1,
      rhetoricStyle: 'standard',
      maxTokens: 1000,
      systemPrompt: '',
      showGuidance: false
    },
    model2: {
      name: 'gpt-4',
      stance: initialStances.model2,
      rhetoricStyle: 'standard',
      maxTokens: 1000,
      systemPrompt: '',
      showGuidance: false
    }
  });

  const [debate] = useState<Array<{ speaker: string; text: string }>>([]);
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

  const interpolateColor = (value: number): string => {
    // Define color stops with more vibrant colors
    const colors = {
      red: [220, 38, 38],    // red-600 - more vibrant red
      gray: [75, 75, 75],    // neutral gray
      green: [22, 163, 74]   // green-600 - more vibrant green
    };

    let r, g, b;
    if (value <= 0) {
      // Interpolate between red and gray
      const t = (value + 1); // -1 to 0 -> 0 to 1
      r = colors.red[0] + (colors.gray[0] - colors.red[0]) * t;
      g = colors.red[1] + (colors.gray[1] - colors.red[1]) * t;
      b = colors.red[2] + (colors.gray[2] - colors.red[2]) * t;
    } else {
      // Interpolate between gray and green
      const t = value; // 0 to 1
      r = colors.gray[0] + (colors.green[0] - colors.gray[0]) * t;
      g = colors.gray[1] + (colors.green[1] - colors.gray[1]) * t;
      b = colors.gray[2] + (colors.green[2] - colors.gray[2]) * t;
    }

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  const getStanceColor = (value: number): string => {
    return interpolateColor(value);
  };

  const getStanceBackgroundColor = (value: number): string => {
    const color = interpolateColor(value);
    return color.replace('rgb', 'rgba').replace(')', ', 0.1)');
  };

  const getInputBackgroundColor = (value: number): string => {
    const color = interpolateColor(value);
    return color.replace('rgb', 'rgba').replace(')', ', 0.3)');
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

  const toggleGeneralSettings = () => {
    setShowGeneralSettings(!showGeneralSettings);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-12 relative overflow-hidden"
        >
          {/* Background scrolling topics */}
          <div className="absolute inset-0 opacity-[0.05] overflow-hidden pointer-events-none">
            <div className="grid grid-cols-3 gap-8 h-full">
              {/* Left column - slower */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: "-50%" }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                  repeatType: "loop"
                }}
                className="whitespace-pre-line text-right text-lg font-light"
              >
                {debateTopics.slice(0, 10).map(topic => 
                  topic.length > 30 ? topic.substring(0, 30) + "..." : topic
                ).join("\n\n")}
              </motion.div>

              {/* Middle column - faster */}
              <motion.div
                initial={{ y: "-25%" }}
                animate={{ y: "-75%" }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                  repeatType: "loop"
                }}
                className="whitespace-pre-line text-center text-lg font-light"
              >
                {debateTopics.slice(10, 20).map(topic => 
                  topic.length > 40 ? topic.substring(0, 40) + "..." : topic
                ).join("\n\n")}
              </motion.div>

              {/* Right column - slowest */}
              <motion.div
                initial={{ y: "-15%" }}
                animate={{ y: "-65%" }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: "linear",
                  repeatType: "loop"
                }}
                className="whitespace-pre-line text-left text-lg font-light"
              >
                {debateTopics.slice(20, 30).map(topic => 
                  topic.length > 30 ? topic.substring(0, 30) + "..." : topic
                ).join("\n\n")}
              </motion.div>
            </div>
          </div>

          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 relative z-10"
            initial={{ backgroundPosition: "0% 50%" }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            AI Verbatim
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-400 font-light tracking-wide relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            The Frontier Destination of AI Debates
          </motion.p>
        </motion.div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr,auto] gap-4 py-4">
                <div className="relative">
                  <label className="block text-lg font-medium mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                  Debate topic
                  </label>
                  <motion.input
                    type="text"
                    value={settings.topic}
                    onChange={handleTopicChange}
                    className="w-full bg-gray-900/50 rounded-lg px-6 py-4 text-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-900/70 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter a topic to debate..."
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                </div>
                <motion.button
                  onClick={handleRandomTopic}
                  className="bg-blue-600 hover:bg-blue-700 w-[60px] h-[60px] rounded-lg text-white flex items-center justify-center transition-colors self-end"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </motion.button>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => toggleGeneralSettings()}
                  className="text-gray-300 hover:text-white flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${showGeneralSettings ? 'rotate-180' : ''}`}
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

              {showGeneralSettings && (
                <div className="mt-4 space-y-6 bg-gray-900/30 p-4 rounded-lg">
                  <div>
                    <label className="block mb-2 text-gray-300">Debate Format</label>
                    <select
                      value={settings.debateStyle}
                      onChange={(e) => setSettings({ ...settings, debateStyle: e.target.value })}
                      className="w-full bg-gray-900 rounded px-3 py-2 text-white"
                    >
                      {debateStyles.map((style) => (
                        <option key={style.value} value={style.value} className="text-white bg-gray-800">
                          {style.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-400 mt-1">
                      {debateStyles.find(style => style.value === settings.debateStyle)?.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 group relative">
                    <span className="text-white">Moderator</span>
                    <button
                      onClick={() => setSettings({ ...settings, moderatorEnabled: !settings.moderatorEnabled })}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                        settings.moderatorEnabled ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                          settings.moderatorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div className="absolute bottom-full left-0 hidden group-hover:block w-64 bg-gray-900 text-sm text-gray-300 p-2 rounded shadow-lg z-50 mb-2">
                      When enabled, an AI moderator will guide the debate, ensure fair play, and provide structured transitions between arguments
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-700/50 my-6"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((modelNum) => {
                const model = getModelSettings(modelNum);
                return (
                  <div 
                    key={modelNum} 
                    className="rounded-lg p-4 transition-colors duration-300"
                    style={{ backgroundColor: getStanceBackgroundColor(model.stance) }}
                  >
                    <h3 className="text-xl mb-4 text-white">{modelNum === 1 ? "First Speaker" : "Second Speaker"}</h3>
                    <div className="space-y-4">
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
                              background: `linear-gradient(to right, rgb(220, 38, 38), rgb(75, 75, 75), rgb(22, 163, 74))`,
                            }}
                          />
                          <span className="text-green-500 text-sm">For</span>
                        </div>
                        <div className="text-sm mt-1 text-center" style={{ color: getStanceColor(model.stance) }}>
                          {getStanceLabel(model.stance)}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
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
                        <div className="space-y-4 mt-4 pt-4 border-t border-gray-700/50">
                          <div>
                            <label className="block mb-1 text-gray-300">Model</label>
                            <select
                              value={model.name}
                              onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'name', e.target.value)}
                              className="w-full rounded px-3 py-2 text-white transition-colors duration-300"
                              style={{ backgroundColor: getInputBackgroundColor(model.stance) }}
                            >
                              <option value="gpt-4" className="text-white bg-gray-800">GPT-4</option>
                              <option value="gpt-3.5-turbo" className="text-white bg-gray-800">GPT-3.5 Turbo</option>
                            </select>
                          </div>

                          <div>
                            <label className="block mb-1 text-gray-300">Rhetoric Style</label>
                            <select
                              value={model.rhetoricStyle}
                              onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'rhetoricStyle', e.target.value)}
                              className="w-full rounded px-3 py-2 text-white transition-colors duration-300"
                              style={{ backgroundColor: getInputBackgroundColor(model.stance) }}
                            >
                              {rhetoricStyles.map((style) => (
                                <option key={style.value} value={style.value} className="text-white bg-gray-800">
                                  {style.label}
                                </option>
                              ))}
                            </select>
                            <div className="text-sm text-gray-400 mt-1">
                              {rhetoricStyles.find(style => style.value === model.rhetoricStyle)?.description}
                            </div>
                          </div>

                          <div>
                            <label className="block mb-1 text-gray-300">Personality & Behavior Hints</label>
                            <textarea
                              value={model.systemPrompt}
                              onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'systemPrompt', e.target.value)}
                              className="w-full rounded px-3 py-2 h-24 text-white transition-colors duration-300"
                              style={{ 
                                backgroundColor: getInputBackgroundColor(model.stance).replace('0.3', '0.15')
                              }}
                              placeholder="Add details to adjust model behaviour such as 'Debate like the Pope' or 'talk from the perspective of a cat'..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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