import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { generateArgument } from '../config/openai';
import Modal from './Modal';
import { Link } from 'react-router-dom';
import { incrementDebateCount, getDebateUsage } from '../services/debateUsage';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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

// Add categories constant at the top level
const categories = [
  'Politics',
  'Technology',
  'Philosophy',
  'Science',
  'Society',
  'Economics',
  'Environment',
  'Ethics',
  'Culture',
  'Funny'
];

const DebateEngine: React.FC = () => {
  const { user } = useAuth();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [showFloatingTopic, setShowFloatingTopic] = useState(false);
  const [freeDebatesRemaining, setFreeDebatesRemaining] = useState<number | null>(null);
  const [showNoDebatesMessage, setShowNoDebatesMessage] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    round: number;
    speaker: 'First' | 'Second' | null;
    type: string;
  }>({
    isLoading: false,
    round: 0,
    speaker: null,
    type: ''
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debateId, setDebateId] = useState<string | null>(null);
  
  // Create a ref for the topic element
  const topicRef = React.useRef<HTMLHeadingElement>(null);

  // Add scroll event listener
  React.useEffect(() => {
    const handleScroll = () => {
      if (topicRef.current) {
        const rect = topicRef.current.getBoundingClientRect();
        setShowFloatingTopic(rect.top < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Randomly determine initial stances
  const initialStances = useMemo(() => {
    return Math.random() < 0.5 ? { model1: -0.6, model2: 0.6 } : { model1: 0.6, model2: -0.6 };
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

  const [debate, setDebate] = useState<Array<{ speaker: string; text: string; summary: string }>>([]);
  const [isDebating, setIsDebating] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [expandedArguments, setExpandedArguments] = useState<Set<string>>(new Set());

  // Fetch free debates count when user changes
  useEffect(() => {
    const fetchDebateUsage = async () => {
      if (user) {
        const usage = await getDebateUsage(user.uid, user.email);
        setFreeDebatesRemaining(usage?.freeDebatesRemaining ?? 0);
      }
    };
    fetchDebateUsage();
  }, [user]);

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

  const getRoundTitle = (roundNumber: number): { title: string; description: string } => {
    switch (roundNumber) {
      case 1:
        return {
          title: "Round 1: Constructive Arguments",
          description: "Each speaker presents their initial position with strongest possible arguments."
        };
      case 2:
        return {
          title: "Round 2: Rebuttal",
          description: "Speakers address opposing arguments and strengthen their positions."
        };
      case 3:
        return {
          title: "Round 3: Summary",
          description: "Final statements incorporating and addressing previous points."
        };
      default:
        return {
          title: `Round ${roundNumber}`,
          description: ""
        };
    }
  };

  const generateSystemPromptForRound = (roundNumber: number, stance: number, basePrompt: string): string => {
    const stanceText = stance > 0 ? "supporting" : "opposing";
    const stanceIntensity = Math.abs(stance) >= 0.8 ? "strongly" : Math.abs(stance) >= 0.3 ? "moderately" : "";
    const stanceDescription = `${stanceIntensity} ${stanceText}`.trim();
    const baseSystemPrompt = basePrompt || "You are a skilled debater focusing on logical arguments and clear communication.";
    
    // Common stance reinforcement for all rounds
    const stanceReinforcement = `Remember, you are ${stanceDescription} this position. Your conviction should be unwavering, and your arguments should consistently reflect your ${stanceDescription} stance. Do not moderate or soften your position.`;
    
    switch (roundNumber) {
      case 1:
        return `${baseSystemPrompt} In this constructive round, you are tasked with presenting your strongest initial arguments while ${stanceDescription} the topic. Focus on establishing your key points without directly addressing the opponent. Your arguments should be clear, impactful, and reflect your strong conviction. ${stanceReinforcement} Build a foundation that clearly shows your ${stanceDescription} position.`;
      case 2:
        return `${baseSystemPrompt} This is the rebuttal round. While ${stanceDescription} the topic, address the opponent's previous arguments and strengthen your position. Point out fundamental flaws in their reasoning and defend your stance vigorously. ${stanceReinforcement} Use this opportunity to not only counter their points but to reinforce why your position is superior.`;
      case 3:
        return `${baseSystemPrompt} For this final summary round, provide a powerful and comprehensive overview of your position. You are still ${stanceDescription} the topic - this is not the time to compromise. Show how you've effectively addressed opposing arguments while maintaining your strong stance. ${stanceReinforcement} End with conviction, leaving no doubt about your position and why it's correct.`;
      default:
        return `${baseSystemPrompt} ${stanceReinforcement}`;
    }
  };

  const startDebate = async () => {
    if (!settings.topic) return;
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Check if user has free debates available
    if (freeDebatesRemaining === 0) {
      setShowNoDebatesMessage(true);
      return;
    }
    
    // Set loading state first
    setIsDebating(true);
    setShowNoDebatesMessage(false); // Hide message when starting new debate
    
    // Increment debate count immediately when clicking Start Debate
    try {
      console.log('Starting debate - incrementing count for user:', user.uid);
      await incrementDebateCount(user.uid);
      setFreeDebatesRemaining(prev => (prev !== null ? prev - 1 : 0));
      console.log('Successfully incremented debate count');
    } catch (error) {
      console.error('Error incrementing debate count:', error);
      // Continue with debate even if tracking fails
    }
    
    // Clear existing debate state
    setDebate([]);
    setCurrentRound(0);
    setSettings(prev => ({ ...prev, rounds: 3 }));
    
    try {
      let currentDebate: Array<{ speaker: string; text: string; summary: string }> = [];
      
      for (let round = 1; round <= 3; round++) {
        setCurrentRound(round);
        
        // First speaker's turn
        setLoadingState({
          isLoading: true,
          round,
          speaker: 'First',
          type: getRoundTitle(round).title.split(':')[1].trim()
        });
        
        const firstSpeakerArg = await generateArgument(
          settings.topic,
          settings.model1.stance,
          settings.model1.rhetoricStyle,
          generateSystemPromptForRound(round, settings.model1.stance, settings.model1.systemPrompt),
          currentDebate
        );
        
        currentDebate = [
          ...currentDebate,
          { speaker: "First Speaker", text: firstSpeakerArg.text, summary: firstSpeakerArg.summary }
        ];
        setDebate(currentDebate);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Second speaker's turn
        setLoadingState({
          isLoading: true,
          round,
          speaker: 'Second',
          type: getRoundTitle(round).title.split(':')[1].trim()
        });
        
        const secondSpeakerArg = await generateArgument(
          settings.topic,
          settings.model2.stance,
          settings.model2.rhetoricStyle,
          generateSystemPromptForRound(round, settings.model2.stance, settings.model2.systemPrompt),
          currentDebate
        );
        
        currentDebate = [
          ...currentDebate,
          { speaker: "Second Speaker", text: secondSpeakerArg.text, summary: secondSpeakerArg.summary }
        ];
        setDebate(currentDebate);

        if (round < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // After debate is complete, show category selection modal
      setShowCategoryModal(true);
    } catch (error) {
      console.error('Error during debate:', error);
      alert('An error occurred during the debate. Please try again.');
    } finally {
      setIsDebating(false);
      setLoadingState({
        isLoading: false,
        round: 0,
        speaker: null,
        type: ''
      });
    }
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
    // Use an even more blue shade for negative stance
    const colors = {
      blue: [30,144,255],    // blue-300 (very bright blue)
      gray: [75, 75, 75],     // neutral gray
      purple: [192, 132, 252],    // purple-400 (bright purple)
    };

    let r, g, b;
    if (value <= 0) {
      // Interpolate between blue and gray
      const t = (value + 1); // -1 to 0 -> 0 to 1
      r = colors.blue[0] + (colors.gray[0] - colors.blue[0]) * t;
      g = colors.blue[1] + (colors.gray[1] - colors.blue[1]) * t;
      b = colors.blue[2] + (colors.gray[2] - colors.blue[2]) * t;
    } else {
      // Interpolate between gray and purple
      const t = value; // 0 to 1
      r = colors.gray[0] + (colors.purple[0] - colors.gray[0]) * t;
      g = colors.gray[1] + (colors.purple[1] - colors.gray[1]) * t;
      b = colors.gray[2] + (colors.purple[2] - colors.gray[2]) * t;
    }

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  const getStanceColor = (value: number): string => {
    return interpolateColor(value);
  };

  const getStanceBackgroundColor = (value: number): string => {
    const color = interpolateColor(value);
    return color.replace('rgb', 'rgba').replace(')', ', 0.2)');
  };

  const getInputBackgroundColor = (value: number): string => {
    const color = interpolateColor(value);
    return color.replace('rgb', 'rgba').replace(')', ', 0.3)');
  };

  const getThumbColor = (value: number): string => {
    // Get the base color (rgb)
    const base = interpolateColor(value);
    // Parse the rgb string
    const match = base.match(/rgb\\((\\d+), (\\d+), (\\d+)\\)/);
    if (!match) return base;
    let [r, g, b] = match.slice(1).map(Number);
    // Add extra blue, but clamp to 255
    b = Math.min(b + 40, 255);
    // Optionally, reduce red/green a bit for more blue effect
    r = Math.max(r - 10, 0);
    g = Math.max(g - 10, 0);
    return `rgba(${r}, ${g}, ${b}, 0.95)`; // nearly opaque for thumb
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

  const toggleArgumentExpansion = (roundIndex: number, speakerIndex: number) => {
    const key = `${roundIndex}-${speakerIndex}`;
    setExpandedArguments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Function to save debate to Firebase
  const saveDebateToFirebase = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Create debate summary object
      const now = new Date().toISOString();
      
      // Create a new document reference to get the ID
      const userDebateRef = doc(collection(db, `users/${user.uid}/debates`));
      const newDebateId = userDebateRef.id;
      
      const debateSummary = {
        id: newDebateId, // Store the ID in the document
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous User',
        topic: settings.topic,
        categories: selectedCategories,
        timestamp: now,
        isPro: user.isPro || false,
        model1: {
          name: settings.model1.name,
          stance: settings.model1.stance,
          rhetoricStyle: settings.model1.rhetoricStyle
        },
        model2: {
          name: settings.model2.name,
          stance: settings.model2.stance,
          rhetoricStyle: settings.model2.rhetoricStyle
        },
        rounds: debate.map((round) => ({
          speaker: round.speaker,
          text: round.text,
          summary: round.summary
        }))
      };

      // Save to user's debate history
      await setDoc(userDebateRef, debateSummary);
      
      // Store the ID in state
      setDebateId(newDebateId);

      // Show success message and mark as saved
      setError('Debate saved to your history!');
      setIsSaved(true);
      setTimeout(() => setError(null), 3000);

    } catch (error) {
      console.error('Error saving debate:', error);
      setError('Failed to save debate. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <div className="text-center text-white">
          <h3 className="text-xl font-semibold mb-3">
            Login Required
          </h3>
          <p className="mb-6">
            sign in for 2 free debate generations instantly!
          </p>
          <Link 
            to="/login"
            className="inline-block bg-white text-blue-500 font-semibold px-6 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </Modal>

      {/* Floating Topic Header */}
      {showFloatingTopic && debate.length > 0 && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 shadow-lg"
        >
          <div className="container mx-auto px-4 py-3">
            <h2 className="text-xl text-center font-light tracking-wide bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent">
              {settings.topic}
        </h2>
          </div>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-12 relative overflow-hidden"
        >
                     {/* Background scrolling topics */}
           <div className="absolute inset-0 opacity-[0.15] overflow-hidden pointer-events-none">
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
            className="text-4xl md:text-5xl font-bold mb-8 leading-relaxed pb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 relative z-10"
            initial={{ backgroundPosition: "0% 50%" }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            Verbatim Engine v1.5
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

        <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/20 rounded-lg p-6 mb-6 shadow-xl">
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
                    className="w-full bg-gray-950/50 rounded-lg px-6 py-4 text-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-900/70 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter any debate topic for generation..."
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  Global Settings
                </button>
          </div>

              {showGeneralSettings && (
                <div className="mt-4 space-y-6  rounded-lg p-4">
                  <div>
                    <label className="block mb-2 text-gray-300">Debate Format</label>
                    <select
                      value={settings.debateStyle}
                      onChange={(e) => setSettings({ ...settings, debateStyle: e.target.value })}
                      className="w-1/2 bg-gray-900 rounded px-3 py-2 text-white"
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
                    <h3 className="text-xl mb-4" style={{ color: getStanceColor(model.stance) }}>{modelNum === 1 ? "First Speaker" : "Second Speaker"}</h3>
                    <div className="space-y-4">
                  <div>
                        <div className="text-base font-semibold mb-2 text-center" style={{ color: getStanceColor(model.stance), fontSize: '1.15rem' }}>
                          {getStanceLabel(model.stance)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.1"
                            value={model.stance}
                            onChange={(e) => handleModelSettingChange(modelNum as 1 | 2, 'stance', parseFloat(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer custom-slider"
                            style={
                              ({
                                background: `linear-gradient(to right, rgba(30, 64, 175, 0.79), rgba(225, 206, 144, 0), rgba(152, 51, 253, 0.66))`,
                                '--thumb-color': getThumbColor(model.stance),
                              } as any)
                            }
                          />
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
                          Settings
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
              disabled={!!(isDebating || !settings.topic)}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-8 py-3 rounded-lg font-semibold transition-colors text-white"
            >
              {isDebating ? 'Debate in Progress...' : 'Start Debate'}
            </button>
          </div>

          {user && showNoDebatesMessage && freeDebatesRemaining === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-blue-400 text-sm max-w-md mx-auto"
          >
            No free debates left. Next free debate within 7 days or consider supporting us by purchasing a PRO account 👑
          </motion.div>
        )}

          {debate.length > 0 && (
          <div className="mt-8 space-y-6">
            <h2 
              ref={topicRef}
              className="text-2xl text-center mb-12 font-light tracking-wide bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent"
            >
              {settings.topic}
            </h2>
            
            {Array.from({ length: Math.ceil(debate.length / 2) }, (_, roundIndex) => {
              const roundNumber = roundIndex + 1;
              const firstSpeakerIndex = roundIndex * 2;
              const secondSpeakerIndex = firstSpeakerIndex + 1;
              const roundInfo = getRoundTitle(roundNumber);
              
              return (
                <div key={roundNumber} className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-300 mb-2 border-b border-gray-700/50 pb-2">
                      {roundInfo.title}
                    </h3>
                    <p className="text-sm text-gray-400 italic">
                      {roundInfo.description}
                    </p>
                  </div>
                  
                  {debate[firstSpeakerIndex] && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="flex justify-start"
                    >
                      <div 
                        className="w-3/4 p-6 rounded-lg shadow-xl backdrop-blur-sm"
                        style={{ 
                          background: `linear-gradient(135deg, ${getStanceBackgroundColor(settings.model1.stance).replace('0.1', '0.2')}, ${getStanceBackgroundColor(settings.model1.stance).replace('0.1', '0.1')})`,
                          border: `1px solid ${getStanceBackgroundColor(settings.model1.stance).replace('0.1', '0.3')}`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-semibold" style={{ color: getStanceColor(settings.model1.stance) }}>
                            First Speaker
                          </div>
                          <button
                            onClick={() => toggleArgumentExpansion(roundIndex, firstSpeakerIndex)}
                            className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
                          >
                            {expandedArguments.has(`${roundIndex}-${firstSpeakerIndex}`) ? (
                              <>
                                <span className="text-sm">Show Less</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </>
                            ) : (
                              <>
                                <span className="text-sm">Show More</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                          {expandedArguments.has(`${roundIndex}-${firstSpeakerIndex}`) ? (
                            debate[firstSpeakerIndex].text
                          ) : (
                            <div>
                              <p className="text-gray-300">{debate[firstSpeakerIndex].summary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {debate[secondSpeakerIndex] && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="flex justify-end"
                    >
                      <div 
                        className="w-3/4 p-6 rounded-lg shadow-xl backdrop-blur-sm"
                        style={{ 
                          background: `linear-gradient(135deg, ${getStanceBackgroundColor(settings.model2.stance).replace('0.1', '0.2')}, ${getStanceBackgroundColor(settings.model2.stance).replace('0.1', '0.1')})`,
                          border: `1px solid ${getStanceBackgroundColor(settings.model2.stance).replace('0.1', '0.3')}`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => toggleArgumentExpansion(roundIndex, secondSpeakerIndex)}
                            className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
                          >
                            {expandedArguments.has(`${roundIndex}-${secondSpeakerIndex}`) ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                <span className="text-sm">Show Less</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                <span className="text-sm">Show More</span>
                              </>
                            )}
                          </button>
                          <div className="text-lg font-semibold" style={{ color: getStanceColor(settings.model2.stance) }}>
                            Second Speaker
                          </div>
                        </div>
                        <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                          {expandedArguments.has(`${roundIndex}-${secondSpeakerIndex}`) ? (
                            debate[secondSpeakerIndex].text
                          ) : (
                            <div>
                              <p className="text-gray-300">{debate[secondSpeakerIndex].summary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator - Moved to end of debate content */}
            {loadingState.isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 p-4 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700/50"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <div className="text-gray-300">
                    <span className="font-semibold">{loadingState.speaker} Speaker</span>
                    <span className="mx-2">|</span>
                    <span>Round {loadingState.round}</span>
                    <span className="mx-2">|</span>
                    <span className="text-blue-400">{loadingState.type}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-400 text-center">
                  Generating response, this may take a moment...
                </div>
              </motion.div>
            )}

            {/* Show success/error messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl z-50 ${
                  error.includes('success') || error.includes('saved')
                    ? 'bg-green-600/90'
                    : 'bg-red-600/90'
                } text-white backdrop-blur-sm`}
              >
                {error}
              </motion.div>
            )}

            {/* Replace with category selection and save section */}
            {!loadingState.isLoading && !isSaving && debate.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-xl"
              >
                <h3 className="text-xl font-semibold mb-4 text-center text-white">
                  Save Your Debate
                </h3>
                <p className="mb-6 text-gray-300 text-center">
                  Select categories that best describe your debate topic (up to 3)
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        if (selectedCategories.includes(category)) {
                          setSelectedCategories(prev => prev.filter(c => c !== category));
                        } else if (selectedCategories.length < 3) {
                          setSelectedCategories(prev => [...prev, category]);
                        }
                      }}
                      className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                        selectedCategories.includes(category)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      } ${selectedCategories.length >= 3 && !selectedCategories.includes(category) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={saveDebateToFirebase}
                    disabled={selectedCategories.length === 0 || isSaving || isSaved}
                    className={`px-6 py-3 ${
                      isSaved 
                        ? 'bg-green-600 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600'
                    } rounded-lg text-white transition-colors flex items-center gap-2 text-lg`}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving Debate...
                      </>
                    ) : isSaved ? (
                      'Debate Saved'
                    ) : (
                      'Save Debate'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Show loading indicator even when no debate content exists yet */}
        {loadingState.isLoading && debate.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 p-4 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700/50"
          >
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <div className="text-gray-300">
                <span className="font-semibold">{loadingState.speaker} Speaker</span>
                <span className="mx-2">|</span>
                <span>Round {loadingState.round}</span>
                <span className="mx-2">|</span>
                <span className="text-blue-400">{loadingState.type}</span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400 text-center">
              Generating response, this may take a moment...
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DebateEngine;