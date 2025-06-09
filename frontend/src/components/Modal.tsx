import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div 
        className="relative transform overflow-hidden rounded-lg shadow-xl transition-all sm:max-w-lg w-full mx-4 sm:mx-0"
        onClick={e => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        <div className="bg-blue-900 px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 