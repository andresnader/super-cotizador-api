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

    const isFirebase = authMode === 'firebase';

    if (isFirebase) {
        return (
            <div
                className={`relative cursor-pointer transition-transform hover:scale-105 active:scale-95 flex items-center justify-center`}
                onClick={() => onProfileClick && onProfileClick()}
                title={isOnline ? "Conectado - Ver perfil" : "Sin conexión - Ver perfil"}
            >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl font-bold bg-indigo-100 text-indigo-600 border-2 ${isOnline ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] outline outline-2 outline-offset-2 outline-green-500/30' : 'border-red-500 outline outline-2 outline-offset-2 outline-red-500/30'} overflow-hidden`}>
                    {userProfile?.picture ? (
                        <img src={userProfile.picture} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        <i className="fas fa-user"></i>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-3 px-3 py-1.5 bg-gray-50/80 backdrop-blur-md rounded-xl border border-gray-200 shadow-sm`}
        >
            {/* Avatar / Icon */}
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold bg-gray-200 text-gray-600`}>
                <i className={`fas fa-laptop text-lg`}></i>
            </div>

            {/* Info */}
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-800 tracking-tight">
                        Modo Local
                    </span>
                    {/* Connection Dot */}
                    <div
                        className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}
                        title={isOnline ? "Conectado a Internet" : "Sin conexión"}
                    ></div>
                </div>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">
                    Dispositivo local
                </span>
            </div>
        </div>
    );
};

export default ConnectionStatus;
