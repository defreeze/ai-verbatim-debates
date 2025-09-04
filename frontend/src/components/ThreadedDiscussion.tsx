import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { doc, collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createPortal } from 'react-dom';

interface ThreadedResponse {
  id: string;
  debateId: string;
  parentId?: string; // For nested responses
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

interface ThreadedDiscussionProps {
  debateId: string;
  roundIndex: number;
  speakerIndex: number;
  content: string;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  onResponseAdded?: () => void;
}

const ThreadedDiscussion: React.FC<ThreadedDiscussionProps> = ({
  debateId,
  roundIndex,
  speakerIndex,
  content,
  contentRef: externalContentRef,
  onResponseAdded
}) => {
  const { user } = useAuth();
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [responses, setResponses] = useState<ThreadedResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const internalContentRef = useRef<HTMLDivElement | null>(null);
  const contentRef = externalContentRef || internalContentRef;

  // Load existing responses
  useEffect(() => {
    loadResponses();
  }, [debateId, roundIndex, speakerIndex]);

  // Add selection listener specific to our content area
  useEffect(() => {
    const handleContentSelection = (e: Event) => {
      const selection = window.getSelection();
      
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
        
        // Only proceed if the selection is within our specific content area
        if (contentRef.current && 
            contentRef.current.contains(selection.anchorNode) && 
            contentRef.current.contains(selection.focusNode)) {
          
          setSelectedText(selectedText);
          setSelectionRange({ start: 0, end: selectedText.length });
          setShowResponseModal(true);
        }
      }
    };

    // Add listeners to our specific content element
    if (contentRef.current) {
      contentRef.current.addEventListener('mouseup', handleContentSelection);
      contentRef.current.addEventListener('touchend', handleContentSelection);
    }

    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('mouseup', handleContentSelection);
        contentRef.current.removeEventListener('touchend', handleContentSelection);
      }
    };
  }, [contentRef.current]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      console.log('Loading responses for:', { debateId, roundIndex, speakerIndex });
      const responsesRef = collection(db, 'threaded_responses');
      
      // First try without orderBy to see if that's causing issues
      const q = query(
        responsesRef,
        where('debateId', '==', debateId),
        where('roundIndex', '==', roundIndex),
        where('speakerIndex', '==', speakerIndex)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot:', querySnapshot.docs.length, 'responses found');
      
      const responsesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Response data:', data);
        return {
          id: doc.id,
          ...data
        };
      }) as ThreadedResponse[];
      
      setResponses(responsesData);
      console.log('Responses loaded:', responsesData.length);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSelection = (e: React.MouseEvent | React.TouchEvent) => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      console.log('Selection:', selection?.toString()); // Debug log
      
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
        console.log('Selected text:', selectedText); // Debug log
        
        // Only proceed if the selection is within our content area
        if (contentRef.current && contentRef.current.contains(selection.anchorNode)) {
          const range = selection.getRangeAt(0);
          
          // Calculate character positions within the content
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(contentRef.current);
          preCaretRange.setEnd(range.startContainer, range.startOffset);
          const start = preCaretRange.toString().length;
          const end = start + selectedText.length;
          
          console.log('Setting modal to show'); // Debug log
          setSelectedText(selectedText);
          setSelectionRange({ start, end });
          setShowResponseModal(true);
        }
      }
    }, 10);
  };

  const handleSubmitResponse = async (parentId?: string) => {
    if (!user) {
      alert('You must be logged in to post responses.');
      return;
    }
    
    if (!responseContent.trim()) {
      alert('Please enter a response.');
      return;
    }
    
    if (!selectionRange) {
      alert('No text selected.');
      return;
    }

    console.log('Submitting response:', { 
      user: user.uid, 
      debateId, 
      roundIndex, 
      speakerIndex, 
      content: responseContent.trim() 
    });
    setSubmitting(true);
    
    try {
      const responseData = {
        debateId: String(debateId),
        parentId: parentId || null,
        originalText: String(selectedText),
        originalTextStart: Number(selectionRange.start),
        originalTextEnd: Number(selectionRange.end),
        roundIndex: Number(roundIndex),
        speakerIndex: Number(speakerIndex),
        authorId: String(user.uid),
        authorName: String(user.displayName || 'Anonymous'),
        content: String(responseContent.trim()),
        timestamp: new Date().toISOString(),
        responseCount: 0,
        depth: parentId ? (responses.find(r => r.id === parentId)?.depth || 0) + 1 : 0
      };

      console.log('Response data to save:', responseData);
      
      // Test Firebase connection first
      console.log('Testing Firebase connection...');
      console.log('Database object:', db);
      console.log('Collection reference:', collection(db, 'threaded_responses'));
      
      const docRef = await addDoc(collection(db, 'threaded_responses'), responseData);
      console.log('Response saved with ID:', docRef.id);
      
      // Reset form
      setResponseContent('');
      setShowResponseModal(false);
      setSelectedText('');
      setSelectionRange(null);
      
      // Reload responses
      console.log('Reloading responses...');
      await loadResponses();
      
      if (onResponseAdded) {
        onResponseAdded();
      }
      
      console.log('Response submission completed successfully');
    } catch (error) {
      console.error('Error submitting response:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error stringified:', JSON.stringify(error));
      console.error('Error details:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        errorMessage = errorObj.message || errorObj.code || JSON.stringify(error);
      }
      
      console.error('Final error message:', errorMessage);
      alert(`Failed to submit response: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderResponse = (response: ThreadedResponse, level: number = 0) => {
    const childResponses = responses.filter(r => r.parentId === response.id);
    const shouldShowChildren = childResponses.length > 0 && !response.isCollapsed;
    
    return (
      <motion.div
        key={response.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`ml-${level * 4} mb-4`}
        style={{ marginLeft: `${level * 60}px` }}
      >
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-400">{response.authorName}</span>
              <span className="text-xs text-gray-400">
                {new Date(response.timestamp).toLocaleDateString()}
              </span>
            </div>
            {childResponses.length > 0 && (
              <button
                onClick={() => {
                  setResponses(prev => prev.map(r => 
                    r.id === response.id ? { ...r, isCollapsed: !r.isCollapsed } : r
                  ));
                }}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                {response.isCollapsed ? `+${childResponses.length} replies` : 'Hide replies'}
              </button>
            )}
          </div>
          
          <div className="text-gray-200 text-sm leading-relaxed mb-3">
            {response.content}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedText(response.content);
                setSelectionRange({ start: 0, end: response.content.length });
                setShowResponseModal(true);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Reply
            </button>
            <span className="text-xs text-gray-500">
              {response.responseCount} {response.responseCount === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        </div>
        
        {shouldShowChildren && (
          <div className="mt-2">
            {childResponses.map(child => renderResponse(child, level + 1))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative">
      {/* Add CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      


      {/* Responses */}
      {responses.length > 0 && (
        <div className="mt-6 border-t border-gray-700/50 pt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-4">
            {responses.length} {responses.length === 1 ? 'Response' : 'Responses'}
          </h4>
          <div className="space-y-2">
            {responses
              .filter(r => !r.parentId) // Only show top-level responses
              .map(response => renderResponse(response))}
          </div>
        </div>
      )}

            {/* Response Modal - Portal version */}
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
              Respond to Selected Text
            </h3>
            
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#374151', borderRadius: '8px' }}>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>Selected text:</p>
              <p style={{ color: '#e5e7eb', fontStyle: 'italic' }}>"{selectedText}"</p>
            </div>
            
            <textarea
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              placeholder="Write your response..."
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
                onClick={() => handleSubmitResponse()}
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
                {submitting ? 'Posting...' : 'Post Response'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ThreadedDiscussion;
