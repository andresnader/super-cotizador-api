import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
    hideCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, maxWidth = 'max-w-lg', hideCloseButton = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4 transition-opacity print:absolute print:inset-0 print:bg-white print:p-0">
            <div className={`relative bg-white rounded-xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto transform transition-all modal-content-print-fix`}>
                {!hideCloseButton && (
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 no-print"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                )}
                <div className="p-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;