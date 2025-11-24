import React from 'react';
import { CompanySettings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  settings: CompanySettings;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, settings }) => {
  const tabs = [
    { id: 'cotizador', label: 'Cotizador', icon: 'fa-file-invoice-dollar' },
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'historial', label: 'Historial', icon: 'fa-history' },
    { id: 'clientes', label: 'Clientes', icon: 'fa-users' },
    { id: 'servicios', label: 'Servicios', icon: 'fa-concierge-bell' },
    { id: 'configuracion', label: 'Configuración', icon: 'fa-cog' },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="text-center mb-8 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-center">
          {settings.logo && (
            <img 
              src={settings.logo} 
              alt="Logo" 
              className="max-h-12 w-auto mr-4 object-contain" 
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900">{settings.name}</h1>
        </div>
        <p className="text-lg text-gray-600 mt-2">Herramienta de Cotización y Gestión</p>
      </header>

      {/* Nav Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex flex-wrap -mb-px space-x-1 md:space-x-2" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm md:text-base transition-colors duration-200
                ${activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50 rounded-t-lg' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <i className={`fas ${tab.icon} mr-2`}></i>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="min-h-[500px]">
        {children}
      </main>
    </div>
  );
};

export default Layout;