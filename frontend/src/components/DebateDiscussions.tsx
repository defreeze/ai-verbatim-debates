import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { doc, collection, addDoc, getDocs, query, orderBy, where, limit, startAfter } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createPortal } from 'react-dom';
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

interface DebateDiscussionsProps {
  debate: PublicDebate;
}

const DebateDiscussions: React.FC<DebateDiscussionsProps> = ({ debate }) => {
  const { user } = useAuth();
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [responses, setResponses] = useState<ThreadedResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load initial responses
  useEffect(() => {
    loadResponses();
  }, [debate.id]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current || loading || !hasMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMoreResponses();
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [loading, hasMore, lastDoc]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      console.log('Loading responses for debate:', debate.id);
      const responsesRef = collection(db, 'threaded_responses');
      
      const q = query(
        responsesRef,
        where('debateId', '==', debate.id),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const responsesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ThreadedResponse[];
      
      console.log('Loaded responses:', responsesData);
      setResponses(responsesData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreResponses = async () => {
    if (!lastDoc || loading) return;
    
    setLoading(true);
    try {
      const responsesRef = collection(db, 'threaded_responses');
      
      const q = query(
        responsesRef,
        where('debateId', '==', debate.id),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const newResponses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ThreadedResponse[];
      
      setResponses(prev => [...prev, ...newResponses]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      console.error('Error loading more responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!user || !responseContent.trim() || !selectedText.trim()) return;
    
    setSubmitting(true);
    try {
      const responseData = {
        debateId: debate.id,
        originalText: selectedText,
        originalTextStart: selectionRange?.start || 0,
        originalTextEnd: selectionRange?.end || selectedText.length,
        roundIndex: 0, // For now, we'll use 0 for general debate responses
        speakerIndex: 0,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        content: responseContent.trim(),
        timestamp: new Date().toISOString(),
        responseCount: 0,
        depth: 0
      };

      console.log('Submitting response:', responseData);
      const docRef = await addDoc(collection(db, 'threaded_responses'), responseData);
      console.log('Response submitted with ID:', docRef.id);

      // Reset form
      setResponseContent('');
      setSelectedText('');
      setSelectionRange(null);
      setShowResponseModal(false);
      
      // Reload responses
      loadResponses();
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoundTitle = (roundIndex: number) => {
    const roundNumber = Math.floor(roundIndex / 2) + 1;
    switch (roundNumber) {
      case 1:
        return 'Opening Statements';
      case 2:
        return 'Rebuttals';
      case 3:
        return 'Closing Arguments';
      default:
        return `Round ${roundNumber}`;
    }
  };

  const getSpeakerName = (speakerIndex: number) => {
    return speakerIndex === 0 ? debate.model1.name : debate.model2.name;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Community Discussions</h3>
        <p className="text-sm text-gray-400">
          Select text from the debate to respond to specific points
        </p>
      </div>

      {/* Responses Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-4"
      >
        {responses.length === 0 && !loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No discussions yet. Be the first to respond!</p>
          </div>
        ) : (
          responses.map((response) => (
            <motion.div
              key={response.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/30"
            >
              {/* Response Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {response.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white">{response.authorName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(response.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {getRoundTitle(response.roundIndex)} • {getSpeakerName(response.speakerIndex)}
                </div>
              </div>

              {/* Original Text Context */}
              <div className="mb-3 p-2 bg-gray-800/50 rounded text-xs text-gray-300 italic">
                "{response.originalText.length > 100 
                  ? `${response.originalText.substring(0, 100)}...` 
                  : response.originalText}"
              </div>

              {/* Response Content */}
              <div className="text-gray-200 text-sm leading-relaxed">
                {response.content}
              </div>

              {/* Response Actions */}
              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-600/30">
                <button className="text-xs text-gray-400 hover:text-white transition-colors">
                  Reply
                </button>
                <button className="text-xs text-gray-400 hover:text-white transition-colors">
                  Like
                </button>
                <span className="text-xs text-gray-500">
                  {response.responseCount} replies
                </span>
              </div>
            </motion.div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* End of results */}
        {!hasMore && responses.length > 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No more discussions to load
          </div>
        )}
      </div>

      {/* Quick Response Button */}
      <div className="flex-shrink-0 mt-4">
        <button
          onClick={() => {
            setSelectedText('General debate discussion');
            setSelectionRange({ start: 0, end: 0 });
            setShowResponseModal(true);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
        >
          Start Discussion
        </button>
      </div>

      {/* Response Modal */}
      {showResponseModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowResponseModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Add Discussion
            </h3>
            
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#374151', borderRadius: '8px' }}>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>Context:</p>
              <p style={{ color: '#e5e7eb', fontStyle: 'italic' }}>"{selectedText}"</p>
            </div>
            
            <textarea
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              placeholder="Share your thoughts on this debate..."
              style={{
                width: '100%',
                height: '120px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                padding: '12px',
                color: 'white',
                resize: 'none',
                marginBottom: '16px'
              }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowResponseModal(false)}
                style={{
                  padding: '8px 16px',
                  color: '#9ca3af',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={!responseContent.trim() || submitting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: submitting ? '#6b7280' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: (!responseContent.trim() || submitting) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {submitting && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {submitting ? 'Posting...' : 'Post Discussion'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DebateDiscussions;
