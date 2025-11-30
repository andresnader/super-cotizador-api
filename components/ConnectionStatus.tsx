import React, { useState, useEffect } from 'react';
import { AuthMode } from '../types';

interface ConnectionStatusProps {
    authMode: AuthMode;
    userProfile: any;
    onProfileClick?: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ authMode, userProfile, onProfileClick }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const isGoogle = authMode === 'google';

    return (
        <div
            className={`flex items-center gap-3 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 ${isGoogle && onProfileClick ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
            onClick={() => isGoogle && onProfileClick && onProfileClick()}
            title={isGoogle ? "Click para ver perfil" : undefined}
        >
            {/* Avatar / Icon */}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${isGoogle ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>
                {isGoogle && userProfile?.picture ? (
                    <img src={userProfile.picture} alt="Profile" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                    <i className={`fas ${isGoogle ? 'fa-user' : 'fa-laptop'}`}></i>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800">
                        {isGoogle ? (userProfile?.email || 'Usuario Google') : 'Modo Local'}
                    </span>
                    {/* Connection Dot */}
                    <div
                        className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
                        title={isOnline ? "Conectado a Internet" : "Sin conexión"}
                    ></div>
                </div>
                <span className="text-[10px] text-gray-500 leading-tight">
                    {isGoogle ? 'Sincronizado' : 'Solo en este dispositivo'}
                </span>
            </div>
        </div>
    );
};

export default ConnectionStatus;
