import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, getDocs, query, where, limit, startAfter, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PublicDebate } from '../types/debate';

interface ThreadedResponse {
  id: string;
  debateId: string;
  parentId?: string;
  originalText: string;
  originalTextStart: number;
  originalTextEnd: number;
  roundIndex: number;
  speakerIndex: number;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
  responseCount: number;
  depth: number;
  isCollapsed?: boolean;
}

interface DebateResponsesSidebarProps {
  debate: PublicDebate;
  onResponseAdded?: () => void;
  contentRefs?: React.MutableRefObject<{ [key: string]: React.RefObject<HTMLDivElement | null> }>;
  debateContentRef?: HTMLElement | null;
}

const DebateResponsesSidebar: React.FC<DebateResponsesSidebarProps> = ({ 
  debate, 
  onResponseAdded,
  contentRefs,
  debateContentRef
}) => {
  const { user } = useAuth();
  const [responses, setResponses] = useState<ThreadedResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showLoadingIcon, setShowLoadingIcon] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<ThreadedResponse | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [aiTextPositions, setAiTextPositions] = useState<{ [key: string]: number }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadResponses = useCallback(async () => {
    setLoading(true);
    try {
      const responsesRef = collection(db, 'threaded_responses');
      
      const q = query(
        responsesRef,
        where('debateId', '==', debate.id),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const responsesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ThreadedResponse[];
      
      // Sort by timestamp (descending) on client side
      responsesData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setResponses(responsesData);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 20);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  }, [debate.id]);

  const loadMoreResponses = useCallback(async () => {
    if (!lastDoc || loading) return;
    
    setLoading(true);
    try {
      const responsesRef = collection(db, 'threaded_responses');
      
      const q = query(
        responsesRef,
        where('debateId', '==', debate.id),
        startAfter(lastDoc),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const newResponses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ThreadedResponse[];
      
      // Sort by timestamp (descending) on client side
      newResponses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setResponses(prev => [...prev, ...newResponses]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 20);
    } catch (error) {
      console.error('Error loading more responses:', error);
    } finally {
      setLoading(false);
    }
  }, [debate.id, lastDoc, loading]);

  // Calculate actual DOM position for AI text alignment
  const calculateAITextPositions = useCallback(() => {
    if (!debateContentRef || !contentRefs?.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Missing refs:', { debateContentRef: !!debateContentRef, contentRefs: !!contentRefs?.current });
      }
      return;
    }
    
    const positions: { [key: string]: number } = {};
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Calculating positions for keys:', Object.keys(contentRefs.current));
    }
    
    Object.entries(contentRefs.current).forEach(([key, ref]) => {
      if (ref?.current) {
        const rect = ref.current.getBoundingClientRect();
        const debateRect = debateContentRef.getBoundingClientRect();
        // Calculate position relative to the debate content area
        const relativePosition = rect.top - debateRect.top;
        positions[key] = relativePosition;
        if (process.env.NODE_ENV === 'development') {
          console.log(`Position for ${key}:`, { 
            rect: rect.top, 
            debateRect: debateRect.top, 
            relative: relativePosition,
            debateScrollTop: debateContentRef.scrollTop
          });
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`No ref.current for key: ${key}`);
      }
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Final positions:', positions);
    }
    setAiTextPositions(positions);
  }, [debateContentRef, contentRefs]);

  // Load initial responses
  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

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

  // Calculate AI text positions when component mounts or content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateAITextPositions();
    }, 100); // Small delay to ensure DOM is ready
    
    return () => clearTimeout(timer);
  }, [calculateAITextPositions, debate]);

  // Recalculate positions on scroll and resize
  useEffect(() => {
    const handleUpdate = () => {
      calculateAITextPositions();
    };

    // Listen to debate content scroll
    if (debateContentRef) {
      debateContentRef.addEventListener('scroll', handleUpdate);
    }
    
    window.addEventListener('resize', handleUpdate);
    
    return () => {
      if (debateContentRef) {
        debateContentRef.removeEventListener('scroll', handleUpdate);
      }
      window.removeEventListener('resize', handleUpdate);
    };
  }, [calculateAITextPositions, debateContentRef]);

  // Sync sidebar scroll with debate content scroll
  useEffect(() => {
    const handleDebateScroll = () => {
      if (!debateContentRef || !scrollContainerRef.current) return;
      
      const debateScrollTop = debateContentRef.scrollTop;
      const sidebarContainer = scrollContainerRef.current.querySelector('.flex-shrink-0.w-96');
      
      if (sidebarContainer) {
        sidebarContainer.scrollTop = debateScrollTop;
      }
    };

    if (debateContentRef) {
      debateContentRef.addEventListener('scroll', handleDebateScroll);
    }
    
    return () => {
      if (debateContentRef) {
        debateContentRef.removeEventListener('scroll', handleDebateScroll);
      }
    };
  }, [debateContentRef]);

  // Infinite scroll (horizontal)
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current || loading || !hasMore) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 100) {
        loadMoreResponses();
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [loading, hasMore, lastDoc, loadMoreResponses]);

  const toggleResponseExpansion = (responseId: string) => {
    setExpandedResponses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(responseId)) {
        newSet.delete(responseId);
      } else {
        newSet.add(responseId);
      }
      return newSet;
    });
  };

  const handleReplyClick = (response: ThreadedResponse) => {
    if (!user) {
      alert('Please log in to reply');
      return;
    }
    setReplyingTo(response);
    setShowReplyModal(true);
  };

  const handleSubmitReply = async () => {
    if (!user || !replyingTo || !replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const replyData = {
        debateId: debate.id,
        parentId: replyingTo.id,
        originalText: replyingTo.originalText,
        originalTextStart: replyingTo.originalTextStart,
        originalTextEnd: replyingTo.originalTextEnd,
        roundIndex: replyingTo.roundIndex,
        speakerIndex: replyingTo.speakerIndex,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        content: replyContent.trim(),
        timestamp: new Date().toISOString(),
        responseCount: 0,
        depth: (replyingTo.depth || 0) + 1
      };

      await addDoc(collection(db, 'threaded_responses'), replyData);
      
      // Reset form and reload responses
      setReplyContent('');
      setShowReplyModal(false);
      setReplyingTo(null);
      loadResponses();
      
      if (onResponseAdded) {
        onResponseAdded();
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };



  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Group responses by position and separate original vs replies
  const groupedResponses = responses.reduce((acc, response) => {
    const key = `${response.roundIndex}-${response.speakerIndex}`;
    if (!acc[key]) {
      acc[key] = { original: [], replies: [] };
    }
    
    if (!response.parentId) {
      // Original response to AI text
      acc[key].original.push(response);
    } else {
      // Reply to another human response
      acc[key].replies.push(response);
    }
    
    return acc;
  }, {} as { [key: string]: { original: ThreadedResponse[], replies: ThreadedResponse[] } });

  // Debug logging - only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Responses:', responses);
    console.log('Grouped responses:', groupedResponses);
    console.log('AI text positions:', aiTextPositions);
  }

  // Get actual vertical position for AI text alignment
  const getAITextPosition = (roundIndex: number, speakerIndex: number) => {
    const key = `${roundIndex}-${speakerIndex}`;
    return aiTextPositions[key] || (roundIndex * 200 + speakerIndex * 100); // Fallback to approximate
  };



  // Render individual response node
  const renderResponseNode = (response: ThreadedResponse, allResponses: ThreadedResponse[], renderReplies: boolean = true) => {
    const isExpanded = expandedResponses.has(response.id);
    const replies = allResponses.filter(r => r.parentId === response.id);
    
    return (
      <div className="flex items-start gap-2">
        {/* Response content */}
        <div 
          className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/20 hover:border-gray-500/30 transition-colors cursor-pointer min-w-0 w-64"
          onClick={() => toggleResponseExpansion(response.id)}
        >
          {isExpanded ? (
            <div>
              {/* Expanded view */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {response.authorName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-white">{response.authorName}</span>
                <span className="text-xs text-gray-400">{formatTimeAgo(response.timestamp)}</span>
              </div>
              <div className="text-gray-200 text-sm leading-relaxed break-words">
                {response.content}
              </div>
            </div>
          ) : (
            <div className="text-gray-200 text-sm leading-relaxed break-words">
              {response.content.length > 100 
                ? `${response.content.substring(0, 100)}...`
                : response.content
              }
            </div>
          )}
        </div>
        
        {/* Plus button for replies */}
        <button
          onClick={() => handleReplyClick(response)}
          className="w-6 h-6 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors flex-shrink-0"
          title="Add reply"
        >
          +
        </button>
        
        {/* Render replies to the right (only if renderReplies is true) */}
        {renderReplies && replies.length > 0 && (
          <div className="flex items-start gap-2">
            {replies.map((reply) => (
              <div key={reply.id} className="relative">
                {/* Connecting line */}
                <div className="absolute -left-2 top-6 w-2 h-px bg-gray-500/50"></div>
                {renderResponseNode(reply, allResponses, true)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };



  // Render original responses aligned with AI text (stacked vertically)
  const renderOriginalResponses = () => {
    return (
      <div className="relative w-full" style={{ minHeight: '2000px' }}>
        {/* Debug info - only show in development */}
        {process.env.NODE_ENV === 'development' && Object.keys(groupedResponses).length > 0 && Object.keys(aiTextPositions).length > 0 && (
          <div className="absolute top-4 left-4 bg-blue-500/20 text-blue-300 p-2 rounded text-xs border border-blue-500/30 z-10">
            📍 {Object.keys(groupedResponses).length} response groups, {responses.length} total responses
            <br />
            📏 Container height: {scrollContainerRef.current?.clientHeight}px
          </div>
        )}
        
        {/* Responses positioned absolutely to align with AI text */}
        {Object.entries(groupedResponses).map(([key, { original }]) => {
          const [roundIndex, speakerIndex] = key.split('-').map(Number);
          const position = getAITextPosition(roundIndex, speakerIndex);
          
          return (
            <div 
              key={key}
              className="absolute w-full bg-gray-700/30 border border-gray-600/20 rounded-lg p-3 hover:border-gray-500/30 transition-colors"
              style={{ top: `${position}px` }}
            >
              {/* Debug position indicator - only in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 mb-2 bg-gray-600/20 p-1 rounded">
                  {key}: {position}px {aiTextPositions[key] ? '(real)' : '(approx)'} - {original.length} responses
                </div>
              )}
              
              <div className="space-y-2">
                {original.map((response) => (
                  <div key={response.id} className="flex-shrink-0">
                    {renderResponseNode(response, responses, false)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render reply threads in horizontal columns (only top-level replies to avoid duplication)
  const renderReplyThreads = () => {
    // Get only top-level replies (replies that have a parentId but their parent is an original response)
    const topLevelReplies = responses.filter(response => {
      if (!response.parentId) return false; // Not a reply
      
      // Check if the parent is an original response (no parentId)
      const parent = responses.find(r => r.id === response.parentId);
      return parent && !parent.parentId;
    });

    if (topLevelReplies.length === 0) return null;

    return (
      <div className="flex-shrink-0 flex">
        {topLevelReplies.map((reply) => (
          <div key={reply.id} className="flex-shrink-0 w-80 h-full flex flex-col border-l-2 border-gray-600/30">
            <div className="flex-1 flex flex-col space-y-2 p-2">
              {renderResponseNode(reply, responses, true)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-2">Community Responses</h3>
      </div>

      {/* Responses Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden hover:overflow-x-scroll relative responses-scroll-container"
        style={{ 
          minWidth: '100%',
          height: '100%',
          minHeight: 'calc(100vh - 120px)' // Ensure minimum height
        }}
      >
        {responses.length === 0 && !loading ? (
          <div className="p-4 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No responses yet</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to respond by selecting text from the debate</p>
          </div>
        ) : (
          <div className="flex h-full" style={{ minWidth: 'max-content', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
            {/* Original responses aligned with AI text */}
            <div className="flex-shrink-0 w-96 h-full overflow-y-auto overflow-x-hidden">
              {renderOriginalResponses()}
            </div>
            
            {/* Reply threads in horizontal columns */}
            {renderReplyThreads()}
          </div>
        )}

        {/* Loading indicator */}
        {loading && showLoadingIcon && (
          <div className="flex justify-center py-4">
            <img 
              src="/android-chrome-512x512.png" 
              alt="Discourse Graph" 
              className="w-5 h-5 animate-spin"
            />
          </div>
        )}

        {/* End of results */}
        {!hasMore && responses.length > 0 && (
          <div className="text-center py-4 text-gray-400 text-xs">
            No more responses to load
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && replyingTo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Reply to {replyingTo.authorName}</h3>
            
            {/* Original Response Context */}
            <div className="mb-4 p-3 bg-gray-700 rounded text-sm text-gray-300 italic border-l-2 border-blue-500/30">
              <div className="text-xs text-gray-400 mb-1">Replying to:</div>
              "{replyingTo.content.length > 100 
                ? `${replyingTo.content.substring(0, 100)}...` 
                : replyingTo.content}"
            </div>
            
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full h-24 bg-gray-700 border border-gray-600 rounded p-3 text-white resize-none"
              placeholder="Write your reply..."
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyContent('');
                  setReplyingTo(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded transition-colors"
                disabled={submittingReply}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReply}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
                disabled={submittingReply || !replyContent.trim()}
              >
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateResponsesSidebar;