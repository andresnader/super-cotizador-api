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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isOperacionesOpen, setIsOperacionesOpen] = useState(false);

    const isOperacionesActive = ['clientes', 'servicios', 'historial', 'operaciones'].includes(activeTab);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top Bar / Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 no-print">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center py-2 md:py-0 h-auto md:h-16">
                        {/* Left: Logo & Main Nav */}
                        <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
                            {/* Mobile Hamburger */}
                            <button
                                className="md:hidden text-gray-600 hover:text-indigo-600 focus:outline-none mr-4"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
                            </button>

                            {/* Logo */}
                            <div className="flex items-center mr-8">
                                {settings.logo && (
                                    <img
                                        src={settings.logo}
                                        alt="Logo"
                                        className="max-h-8 w-auto mr-2 object-contain"
                                    />
                                )}
                                <h1 className="text-lg font-bold text-gray-900 leading-tight hidden lg:block">{settings.name}</h1>
                            </div>

                            {/* Main Nav (Desktop) */}
                            <nav className="hidden md:flex space-x-1">
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
                                        <div className="absolute top-full left-0 w-56 bg-white rounded-b-md shadow-lg border border-gray-100 py-2 z-50">
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
                        <div className="hidden md:flex items-center space-x-2">
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

                    {/* Mobile Menu */}
                    <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden pb-4 border-t border-gray-100`}>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button onClick={() => { onTabChange('dashboard'); setIsMobileMenuOpen(false); }} className={`p-3 text-sm font-medium rounded-lg text-left flex items-center ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <i className="fas fa-desktop w-6 text-center mr-2"></i> Escritorio
                            </button>
                            <button onClick={() => { onTabChange('cotizador'); setIsMobileMenuOpen(false); }} className={`p-3 text-sm font-medium rounded-lg text-left flex items-center ${activeTab === 'cotizador' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <i className="fas fa-file-invoice-dollar w-6 text-center mr-2"></i> Cotizador
                            </button>
                            <button onClick={() => { onTabChange('estadisticas'); setIsMobileMenuOpen(false); }} className={`p-3 text-sm font-medium rounded-lg text-left flex items-center ${activeTab === 'estadisticas' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <i className="fas fa-chart-pie w-6 text-center mr-2"></i> Estadísticas
                            </button>

                            <div className="col-span-2 bg-gray-50 rounded-lg p-2 mt-2">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">Operaciones</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => { onTabChange('clientes'); setIsMobileMenuOpen(false); }} className={`p-2 text-sm font-medium rounded text-left flex items-center ${activeTab === 'clientes' ? 'text-indigo-600 bg-white shadow-sm' : 'text-gray-600'}`}>
                                        <i className="fas fa-users w-6 text-center mr-2"></i> Clientes
                                    </button>
                                    <button onClick={() => { onTabChange('servicios'); setIsMobileMenuOpen(false); }} className={`p-2 text-sm font-medium rounded text-left flex items-center ${activeTab === 'servicios' ? 'text-indigo-600 bg-white shadow-sm' : 'text-gray-600'}`}>
                                        <i className="fas fa-concierge-bell w-6 text-center mr-2"></i> Servicios
                                    </button>
                                    <button onClick={() => { onTabChange('historial'); setIsMobileMenuOpen(false); }} className={`p-2 text-sm font-medium rounded text-left flex items-center ${activeTab === 'historial' ? 'text-indigo-600 bg-white shadow-sm' : 'text-gray-600'}`}>
                                        <i className="fas fa-history w-6 text-center mr-2"></i> Historial
                                    </button>
                                    <button onClick={() => { onTabChange('operaciones'); setIsMobileMenuOpen(false); }} className={`p-2 text-sm font-medium rounded text-left flex items-center ${activeTab === 'operaciones' ? 'text-indigo-600 bg-white shadow-sm' : 'text-gray-600'}`}>
                                        <i className="fas fa-file-contract w-6 text-center mr-2"></i> Contratos
                                    </button>
                                </div>
                            </div>

                            <button onClick={() => { onTabChange('perfil'); setIsMobileMenuOpen(false); }} className={`p-3 text-sm font-medium rounded-lg text-left flex items-center ${activeTab === 'perfil' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <i className="fas fa-user w-6 text-center mr-2"></i> Perfil
                            </button>
                            <button onClick={() => { onTabChange('configuracion'); setIsMobileMenuOpen(false); }} className={`p-3 text-sm font-medium rounded-lg text-left flex items-center ${activeTab === 'configuracion' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <i className="fas fa-cog w-6 text-center mr-2"></i> Configuración
                            </button>

                            {onLogout && (
                                <button
                                    onClick={onLogout}
                                    className="p-3 text-sm font-medium rounded-lg text-left flex items-center text-red-600 hover:bg-red-50 col-span-2"
                                >
                                    <i className="fas fa-sign-out-alt w-6 text-center mr-2"></i>
                                    Salir
                                </button>
                            )}
                        </div>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-grow container mx-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
