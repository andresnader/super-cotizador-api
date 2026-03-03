import React, { useState } from 'react';
import { CompanySettings, AuthMode } from '../types';
import ConnectionStatus from './ConnectionStatus';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    settings: CompanySettings;
    authMode?: AuthMode;
    onLogout?: () => void;
    userProfile?: any;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, settings, authMode, onLogout, userProfile }) => {
    const [isOperacionesOpen, setIsOperacionesOpen] = useState(false);
    const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

    const isOperacionesActive = ['clientes', 'servicios', 'historial', 'operaciones'].includes(activeTab);

    // Primary mobile tabs shown in the floating bottom bar
    const mobileNavItems = [
        { key: 'dashboard', icon: 'fa-desktop', label: 'Panel' },
        { key: 'cotizador', icon: 'fa-file-invoice-dollar', label: 'Cotizar' },
        { key: 'historial', icon: 'fa-history', label: 'Historial' },
        { key: 'clientes', icon: 'fa-users', label: 'Clientes' },
    ];

    // Secondary mobile tabs shown when "Más" is tapped
    const mobileMoreItems = [
        { key: 'estadisticas', icon: 'fa-chart-pie', label: 'Estadísticas' },
        { key: 'servicios', icon: 'fa-concierge-bell', label: 'Servicios' },
        { key: 'operaciones', icon: 'fa-file-contract', label: 'Contratos' },
        { key: 'configuracion', icon: 'fa-cog', label: 'Configuración' },
        { key: 'perfil', icon: 'fa-user', label: 'Perfil' },
    ];

    const handleMobileNav = (key: string) => {
        onTabChange(key);
        setIsMobileMoreOpen(false);
    };

    // Check if the active tab is one of the "more" items
    const isMoreActive = mobileMoreItems.some(item => item.key === activeTab);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30">

            {/* ============ MOBILE TOP HEADER ============ */}
            <div className="md:hidden sticky top-0 z-30 no-print">
                <div className="flex items-center justify-between px-4 py-3"
                    style={{
                        background: 'rgba(255,255,255,0.6)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        borderBottom: '1px solid rgba(255,255,255,0.5)',
                    }}
                >
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        {settings.logo && (
                            <img src={settings.logo} alt="Logo" className="h-8 w-auto object-contain" />
                        )}
                        <h1 className="text-base font-extrabold text-gray-900 tracking-tight truncate max-w-[180px]">
                            {settings.name || 'Super Cotizador'}
                        </h1>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        <ConnectionStatus authMode={authMode || 'local'} userProfile={userProfile} onProfileClick={() => onTabChange('perfil')} />
                    </div>
                </div>
            </div>

            {/* ============ DESKTOP TOP BAR ============ */}
            <div className="hidden md:block bg-white/70 backdrop-blur-xl shadow-sm border-b border-white/40 sticky top-0 z-30 no-print">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        {/* Left: Logo & Main Nav */}
                        <div className="flex items-center">
                            {/* Logo */}
                            <div className="flex items-center mr-8">
                                {settings.logo && (
                                    <img src={settings.logo} alt="Logo" className="max-h-8 w-auto mr-2 object-contain" />
                                )}
                                <h1 className="text-lg font-bold text-gray-900 leading-tight hidden lg:block">{settings.name}</h1>
                            </div>

                            {/* Main Nav (Desktop) */}
                            <nav className="flex space-x-1">
                                <button
                                    onClick={() => onTabChange('dashboard')}
                                    className={`px-3 py-5 text-sm font-medium transition-all duration-200 border-b-2 flex items-center ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50'}`}
                                >
                                    <i className="fas fa-desktop mr-2"></i>
                                    Escritorio
                                </button>
                                <button
                                    onClick={() => onTabChange('cotizador')}
                                    className={`px-3 py-5 text-sm font-medium transition-all duration-200 border-b-2 flex items-center ${activeTab === 'cotizador' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50'}`}
                                >
                                    <i className="fas fa-file-invoice-dollar mr-2"></i>
                                    Cotizador
                                </button>
                                <button
                                    onClick={() => onTabChange('estadisticas')}
                                    className={`px-3 py-5 text-sm font-medium transition-all duration-200 border-b-2 flex items-center ${activeTab === 'estadisticas' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50'}`}
                                >
                                    <i className="fas fa-chart-pie mr-2"></i>
                                    Estadísticas
                                </button>

                                {/* Operaciones Dropdown */}
                                <div
                                    className="relative group h-full flex items-center"
                                    onMouseEnter={() => setIsOperacionesOpen(true)}
                                    onMouseLeave={() => setIsOperacionesOpen(false)}
                                >
                                    <button
                                        className={`px-3 py-5 text-sm font-medium transition-all duration-200 border-b-2 flex items-center ${isOperacionesActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50'}`}
                                        onClick={() => setIsOperacionesOpen(!isOperacionesOpen)}
                                    >
                                        <i className="fas fa-briefcase mr-2"></i>
                                        Operaciones
                                        <i className={`fas fa-chevron-down ml-2 text-xs transition-transform ${isOperacionesOpen ? 'transform rotate-180' : ''}`}></i>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isOperacionesOpen && (
                                        <div className="absolute top-full left-0 w-56 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 py-2 z-50 mt-1 overflow-hidden">
                                            <button
                                                onClick={() => { onTabChange('clientes'); setIsOperacionesOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-600 ${activeTab === 'clientes' ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'}`}
                                            >
                                                <i className="fas fa-users mr-2 w-5 text-center"></i> Gestión de Clientes
                                            </button>
                                            <button
                                                onClick={() => { onTabChange('servicios'); setIsOperacionesOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-600 ${activeTab === 'servicios' ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'}`}
                                            >
                                                <i className="fas fa-concierge-bell mr-2 w-5 text-center"></i> Gestión de Servicios
                                            </button>
                                            <button
                                                onClick={() => { onTabChange('historial'); setIsOperacionesOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-600 ${activeTab === 'historial' ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'}`}
                                            >
                                                <i className="fas fa-history mr-2 w-5 text-center"></i> Historial de Cotizaciones
                                            </button>
                                            <button
                                                onClick={() => { onTabChange('operaciones'); setIsOperacionesOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-600 ${activeTab === 'operaciones' ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'}`}
                                            >
                                                <i className="fas fa-file-contract mr-2 w-5 text-center"></i> Gestión de Contratos
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </nav>
                        </div>

                        {/* Right: Secondary Nav (Desktop) */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onTabChange('configuracion')}
                                className={`px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-gray-100 ${activeTab === 'configuracion' ? 'text-indigo-600 bg-indigo-50' : ''}`}
                            >
                                <i className="fas fa-cog text-lg mb-1"></i>
                                <span>Configuración</span>
                            </button>

                            {/* Connection Status with Profile Info */}
                            <ConnectionStatus authMode={authMode || 'local'} userProfile={userProfile} onProfileClick={() => onTabChange('perfil')} />
                            {onLogout && (
                                <button
                                    onClick={onLogout}
                                    className="ml-2 px-3 py-2 text-xs font-medium rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 flex flex-col items-center justify-center transition-all duration-200"
                                    title="Salir"
                                >
                                    <i className="fas fa-sign-out-alt text-lg mb-1"></i>
                                    <span>Salir</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content — extra bottom padding on mobile for the floating nav */}
            <main className="flex-grow container mx-auto p-4 md:p-8 pb-36 md:pb-8">
                {children}
            </main>

            {/* ============ MOBILE FLOATING BOTTOM NAV ============ */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 no-print pointer-events-none">
                {/* "More" Popup (appears above the nav bar) */}
                {isMobileMoreOpen && (
                    <>
                        {/* Overlay to close */}
                        <div
                            className="fixed inset-0 z-40 pointer-events-auto"
                            onClick={() => setIsMobileMoreOpen(false)}
                        />
                        <div
                            className="relative z-50 mx-4 mb-2 pointer-events-auto rounded-[1.5rem] p-3 shadow-2xl"
                            style={{
                                background: 'rgba(255,255,255,0.75)',
                                backdropFilter: 'blur(30px)',
                                WebkitBackdropFilter: 'blur(30px)',
                                border: '1px solid rgba(255,255,255,0.7)',
                            }}
                        >
                            <div className="grid grid-cols-3 gap-1">
                                {mobileMoreItems.map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => handleMobileNav(item.key)}
                                        className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl transition-all duration-200 active:scale-90 ${activeTab === item.key
                                            ? 'bg-indigo-500/10 text-indigo-600'
                                            : 'text-gray-500 hover:bg-white/50'
                                            }`}
                                    >
                                        <i className={`fas ${item.icon} text-lg`}></i>
                                        <span className="text-[10px] font-bold uppercase tracking-tight leading-none">{item.label}</span>
                                    </button>
                                ))}
                                {/* Logout button inside more panel */}
                                {onLogout && (
                                    <button
                                        onClick={onLogout}
                                        className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl text-red-500 hover:bg-red-50/50 transition-all duration-200 active:scale-90"
                                    >
                                        <i className="fas fa-sign-out-alt text-lg"></i>
                                        <span className="text-[10px] font-bold uppercase tracking-tight leading-none">Salir</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Floating pill navigation bar */}
                <div className="px-4 pb-5 pt-1 pointer-events-auto">
                    <div
                        className="flex items-center justify-around rounded-full px-2 py-2 shadow-2xl"
                        style={{
                            background: 'rgba(255,255,255,0.65)',
                            backdropFilter: 'blur(28px)',
                            WebkitBackdropFilter: 'blur(28px)',
                            border: '1px solid rgba(255,255,255,0.7)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                        }}
                    >
                        {mobileNavItems.map(item => {
                            const isActive = activeTab === item.key;
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => { onTabChange(item.key); setIsMobileMoreOpen(false); }}
                                    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${isActive
                                        ? 'bg-indigo-500/15 text-indigo-600 scale-105'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <i className={`fas ${item.icon} text-[18px] ${isActive ? 'drop-shadow-sm' : ''}`}></i>
                                    <span className={`text-[9px] font-bold uppercase tracking-tighter leading-none mt-0.5 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}

                        {/* More / Más button */}
                        <button
                            onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
                            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${isMobileMoreOpen || isMoreActive
                                ? 'bg-indigo-500/15 text-indigo-600 scale-105'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <i className={`fas ${isMobileMoreOpen ? 'fa-times' : 'fa-ellipsis-h'} text-[18px]`}></i>
                            <span className={`text-[9px] font-bold uppercase tracking-tighter leading-none mt-0.5 ${isMobileMoreOpen || isMoreActive ? 'opacity-100' : 'opacity-70'}`}>
                                Más
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
