import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import DebateResponsesSidebar from '../components/DebateResponsesSidebar';
import type { PublicDebate } from '../types/debate';



const DebateDetail: React.FC = () => {
  const { debateId } = useParams<{ debateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [debate, setDebate] = useState<PublicDebate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedArguments, setExpandedArguments] = useState<Set<string>>(new Set());
  const contentRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement | null> }>({});
  const debateContentRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseContent, setResponseContent] = useState<string>('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const [showLoadingIcon, setShowLoadingIcon] = useState(false);

  const loadDebate = useCallback(async () => {
    if (!debateId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const debateRef = doc(db, 'public_debates', debateId);
      const debateSnap = await getDoc(debateRef);
      
      if (debateSnap.exists()) {
        const debateData = debateSnap.data() as PublicDebate;
        setDebate({ ...debateData, id: debateSnap.id });
      } else {
        setError('Debate not found');
      }
    } catch (err) {
      console.error('Error loading debate:', err);
      setError('Failed to load debate');
    } finally {
      setLoading(false);
    }
  }, [debateId]);

  useEffect(() => {
    if (debateId) {
      loadDebate();
    }
  }, [debateId, loadDebate]);

  // Show loading icon only after 1 second
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowLoadingIcon(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingIcon(false);
    }
  }, [loading]);

  // Handle wheel events for hover-based scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Find the hovered element
      const target = e.target as HTMLElement;
      const responsesArea = target.closest('.responses-area');
      const responsesScrollContainer = target.closest('.responses-scroll-container');
      const debateArea = target.closest('.debate-area');
      
      if (responsesArea && responsesScrollContainer) {
        // Horizontal scrolling for responses area
        e.preventDefault();
        (responsesScrollContainer as HTMLElement).scrollLeft += e.deltaY;
      } else if (debateArea) {
        // Vertical scrolling for debate area (default behavior)
        // Let the default behavior handle this
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  // Add text selection handler
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
        setSelectedText(selectedText);
        setShowResponseModal(true);
      }
    };

    // Add event listeners to all content areas
    const contentElements = Object.values(contentRefs.current).map(ref => ref.current).filter(Boolean);
    
    contentElements.forEach(element => {
      if (element) {
        element.addEventListener('mouseup', handleTextSelection);
        element.addEventListener('touchend', handleTextSelection);
      }
    });

    return () => {
      contentElements.forEach(element => {
        if (element) {
          element.removeEventListener('mouseup', handleTextSelection);
          element.removeEventListener('touchend', handleTextSelection);
        }
      });
    };
  }, [debate]);

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

  const handleSubmitResponse = async () => {
    if (!user || !debate || !responseContent.trim()) return;

    setSubmittingResponse(true);
    try {
      const responsesRef = collection(db, 'threaded_responses');
      
      // For now, we'll use roundIndex 0 and speakerIndex 0 as defaults
      // In a more sophisticated implementation, we'd determine these from the selected text
      const responseData = {
        debateId: debate.id,
        originalText: selectedText,
        originalTextStart: 0,
        originalTextEnd: selectedText.length,
        roundIndex: 0,
        speakerIndex: 0,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        content: responseContent.trim(),
        timestamp: new Date().toISOString(),
        responseCount: 0,
        depth: 0
      };

      await addDoc(responsesRef, responseData);
      
      // Reset form and close modal
      setResponseContent('');
      setSelectedText('');
      setShowResponseModal(false);
      
      // Force refresh of responses
      window.location.reload();
      
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const getContentRef = (roundIndex: number, speakerIndex: number) => {
    const key = `${roundIndex}-${speakerIndex}`;
    if (!contentRefs.current[key]) {
      contentRefs.current[key] = React.createRef<HTMLDivElement | null>();
    }
    return contentRefs.current[key];
  };

  const getStanceColor = (stance: number) => {
    if (stance > 0) {
      return '#394b72'; // green-500 for pro
    } else if (stance < 0) {
      return '#585083'; // red-500 for con
    } else {
      return '#6b7280'; // gray-500 for neutral
    }
  };

  const getStanceBackgroundColor = (stance: number) => {
    if (stance > 0) {
      return '#221d3f';
    } else if (stance < 0) {
      return '#162340';
    } else {
      return 'rgba(107, 114, 128, 0.1)';
    }
  };

  const getRoundTitle = (roundNumber: number) => {
    switch (roundNumber) {
      case 1:
        return { title: 'Opening Statements', description: 'Initial arguments from both sides' };
      case 2:
        return { title: 'Rebuttals', description: 'Counter-arguments and responses' };
      case 3:
        return { title: 'Closing Arguments', description: 'Final statements and conclusions' };
      default:
        return { title: `Round ${roundNumber}`, description: `Round ${roundNumber} of the debate` };
    }
  };

  if (loading && showLoadingIcon) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/android-chrome-512x512.png" 
            alt="Discourse Graph" 
            className="w-16 h-16 animate-spin"
          />
          <div className="text-white text-xl">Loading debate...</div>
        </div>
      </div>
    );
  }

  if (error || !debate) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">{error || 'Debate not found'}</div>
          <button
            onClick={() => navigate('/community/ranking')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Navigation Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/community/ranking')}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back 
              </button>
              <div className="h-6 w-px bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-white">{debate.topic}</h1>
            </div>
                
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Debate Content (2/3) */}
        <div ref={debateContentRef} className="w-2/3 overflow-y-auto debate-area">
          <div className="px-4 py-8 max-w-full">
        {/* Debate Topic */}
        <div className="bg-blue-900/15 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-xl">
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.818a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span>{debate.upvotes}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.818a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
              </svg>
              <span>{debate.downvotes}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
                             <span>{debate.upvotes - debate.downvotes}</span>
            </div>
          </div>
        </div>

                 {/* Debate Rounds */}
         <div className="space-y-8">
           {Array.from({ length: Math.ceil(debate.rounds.length / 2) }, (_, roundIndex) => {
             const roundNumber = roundIndex + 1;
             const firstSpeakerIndex = roundIndex * 2;
             const secondSpeakerIndex = firstSpeakerIndex + 1;
             const roundInfo = getRoundTitle(roundNumber);
             
             return (
               <motion.div
                 key={roundIndex}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: roundIndex * 0.1 }}
                 className="space-y-4"
               >
                 <div className="mb-6">
                   <h3 className="text-xl font-semibold text-gray-300 mb-2 border-b border-gray-700/50 pb-2">
                     {roundInfo.title}
                   </h3>
                   <p className="text-sm text-gray-400 italic">
                     {roundInfo.description}
                   </p>
                 </div>
                 
                 {debate.rounds[firstSpeakerIndex] && (
                   <motion.div
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.5 }}
                     className="flex justify-start"
                   >
                     <div 
                       className="w-3/4 p-6 rounded-lg shadow-xl backdrop-blur-sm"
                       style={{ 
                         background: `linear-gradient(135deg, ${getStanceBackgroundColor(debate.model1.stance).replace('0.1', '0.2')}, ${getStanceBackgroundColor(debate.model1.stance).replace('0.1', '0.1')})`,
                         border: `1px solid ${getStanceBackgroundColor(debate.model1.stance).replace('0.1', '0.3')}`,
                       }}
                     >
                       <div className="flex items-center justify-between mb-3">
                         <div className="text-lg font-semibold" style={{ color: getStanceColor(debate.model1.stance) }}>
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
                       
                       {/* Content Display */}
                       <div 
                         ref={getContentRef(roundIndex, firstSpeakerIndex)}
                         className="text-gray-200 leading-relaxed whitespace-pre-wrap mb-4 select-text cursor-text"
                       >
                         {expandedArguments.has(`${roundIndex}-${firstSpeakerIndex}`) ? (
                           debate.rounds[firstSpeakerIndex].text
                         ) : (
                           <div>
                             <p className="text-gray-300">{debate.rounds[firstSpeakerIndex].summary}</p>
                           </div>
                         )}
                       </div>
                       

                     </div>
                   </motion.div>
                 )}
                 
                 {debate.rounds[secondSpeakerIndex] && (
                   <motion.div
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.5 }}
                     className="flex justify-end"
                   >
                     <div 
                       className="w-3/4 p-6 rounded-lg shadow-xl backdrop-blur-sm"
                       style={{ 
                         background: `linear-gradient(135deg, ${getStanceBackgroundColor(debate.model2.stance).replace('0.1', '0.2')}, ${getStanceBackgroundColor(debate.model2.stance).replace('0.1', '0.1')})`,
                         border: `1px solid ${getStanceBackgroundColor(debate.model2.stance).replace('0.1', '0.3')}`,
                       }}
                     >
                       <div className="flex items-center justify-between mb-3">
                         <div className="text-lg font-semibold" style={{ color: getStanceColor(debate.model2.stance) }}>
                           Second Speaker
                         </div>
                         <button
                           onClick={() => toggleArgumentExpansion(roundIndex, secondSpeakerIndex)}
                           className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
                         >
                           {expandedArguments.has(`${roundIndex}-${secondSpeakerIndex}`) ? (
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
                       
                       {/* Content Display */}
                       <div 
                         ref={getContentRef(roundIndex, secondSpeakerIndex)}
                         className="text-gray-200 leading-relaxed whitespace-pre-wrap mb-4 select-text cursor-text"
                       >
                         {expandedArguments.has(`${roundIndex}-${secondSpeakerIndex}`) ? (
                           debate.rounds[secondSpeakerIndex].text
                         ) : (
                           <div>
                             <p className="text-gray-300">{debate.rounds[secondSpeakerIndex].summary}</p>
                           </div>
                         )}
                       </div>
                       

                     </div>
                   </motion.div>
                 )}
               </motion.div>
             );
           })}
          </div>
        </div>
        </div>

        {/* Right Side - Responses (1/3) */}
        <div className="w-1/3 bg-gray-700/50 border-l border-gray-600/50 responses-area h-full flex flex-col">
          {/* Debug height indicator */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-0 right-0 bg-red-500/20 text-red-300 p-1 text-xs z-50">
              Sidebar: {debateContentRef.current?.parentElement?.clientHeight}px
            </div>
          )}
          {debate && (
            <DebateResponsesSidebar 
              debate={debate} 
              contentRefs={contentRefs}
              debateContentRef={debateContentRef.current}
              onResponseAdded={() => {
                // Force refresh of responses
                window.location.reload();
              }}
            />
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Create Response</h3>
            <div className="mb-4 p-3 bg-gray-700 rounded text-sm text-gray-300">
              Selected: "{selectedText}"
            </div>
            <textarea
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              className="w-full h-24 bg-gray-700 border border-gray-600 rounded p-3 text-white resize-none"
              placeholder="Write your response..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setResponseContent('');
                  setSelectedText('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded transition-colors"
                disabled={submittingResponse}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
                disabled={submittingResponse || !responseContent.trim()}
              >
                {submittingResponse ? 'Posting...' : 'Post Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );

};

export default DebateDetail;