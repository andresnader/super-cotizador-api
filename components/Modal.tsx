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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 p-4 transition-opacity print:absolute print:inset-0 print:bg-white print:p-0">
            {/* Added relative and max-h-full to ensure it respects viewport height */}
            <div className={`relative bg-white rounded-xl shadow-xl w-full ${maxWidth} max-h-[90vh] md:max-h-[85vh] overflow-y-auto transform transition-all modal-content-print-fix my-auto`}>
                {!hideCloseButton && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 no-print"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                )}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;