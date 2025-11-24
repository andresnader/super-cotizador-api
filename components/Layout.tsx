import React, { useState } from 'react';
import { CompanySettings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  settings: CompanySettings;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, settings }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'cotizador', label: 'Cotizador', icon: 'fa-file-invoice-dollar' },
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'historial', label: 'Historial', icon: 'fa-history' },
    { id: 'clientes', label: 'Clientes', icon: 'fa-users' },
    { id: 'servicios', label: 'Servicios', icon: 'fa-concierge-bell' },
    { id: 'configuracion', label: 'Configuración', icon: 'fa-cog' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar / Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 no-print">
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:items-center py-4">
                {/* Logo & Title Section */}
                <div className="flex items-center justify-center md:justify-center w-full relative mb-4 md:mb-2">
                    {/* Mobile Hamburger Button (Absolute Left) */}
                    <button 
                        className="md:hidden absolute left-0 text-gray-600 hover:text-indigo-600 focus:outline-none"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
                    </button>

                    <div className="flex items-center">
                        {settings.logo && (
                            <img 
                            src={settings.logo} 
                            alt="Logo" 
                            className="max-h-10 w-auto mr-3 object-contain" 
                            />
                        )}
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{settings.name}</h1>
                            <p className="text-xs text-gray-500 hidden md:block">Herramienta de Cotización y Gestión</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-auto mt-2 md:mt-0`}>
                    <ul className="flex flex-col md:flex-row md:items-center md:justify-center md:space-x-1">
                        {tabs.map((tab) => (
                            <li key={tab.id} className="w-full md:w-auto">
                                <button
                                    onClick={() => {
                                        onTabChange(tab.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`
                                        w-full md:w-auto text-left md:text-center
                                        px-4 py-3 md:py-2 text-sm font-medium transition-all duration-200 border-b-2
                                        flex items-center md:justify-center
                                        ${activeTab === tab.id 
                                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50 md:bg-transparent' 
                                            : 'border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50 md:hover:bg-transparent'
                                        }
                                    `}
                                >
                                    <i className={`fas ${tab.icon} w-6 md:w-auto md:mr-2 text-center`}></i>
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
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