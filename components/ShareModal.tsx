import React from 'react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentUrl: string;
    documentTitle: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, documentUrl, documentTitle }) => {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.open(documentUrl + '/export?format=pdf', '_blank');
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(
            `📄 ${documentTitle}\n\nVer documento: ${documentUrl}`
        );
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(documentUrl);
            alert('¡Link copiado al portapapeles!');
        } catch (err) {
            console.error('Error copying link:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = documentUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('¡Link copiado al portapapeles!');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <i className="fas fa-check text-green-600 text-2xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        ¡Documento Guardado!
                    </h2>
                    <p className="text-gray-600">
                        Tu cotización ha sido guardada en Google Drive
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                    {/* Open in Drive */}
                    <a
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        <i className="fas fa-external-link-alt mr-2"></i>
                        Abrir en Google Drive
                    </a>

                    {/* Print */}
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        <i className="fas fa-print mr-2"></i>
                        Imprimir / Descargar PDF
                    </button>

                    {/* WhatsApp */}
                    <button
                        onClick={handleWhatsApp}
                        className="flex items-center justify-center w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                        <i className="fab fa-whatsapp mr-2"></i>
                        Compartir por WhatsApp
                    </button>

                    {/* Copy Link */}
                    <button
                        onClick={handleCopyLink}
                        className="flex items-center justify-center w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        <i className="fas fa-link mr-2"></i>
                        Copiar Enlace
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default ShareModal;
