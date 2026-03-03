import React, { useState, useEffect } from 'react';
import { CompanySettings, Quote, AuthMode } from './types';
import { getCompanySettings } from './services/storage';
import { onAuthChange, signOutFirebase } from './services/firebaseAuth';
import { dataManager } from './services/dataManager';

import Login from './components/Login';
import Layout from './components/Layout';
import QuoteBuilder from './components/QuoteBuilder';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Clients from './components/Clients';
import Services from './components/Services';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import Contracts from './components/Contracts';
import Modal from './components/Modal';
import Profile from './components/Profile';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [companySettings, setCompanySettings] = useState<CompanySettings>(getCompanySettings());

  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);


  // Firebase Auth state listener — auto-restores session
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setUserProfile({
          name: user.displayName || 'Usuario',
          email: user.email || '',
          picture: user.photoURL || ''
        });
        setAuthMode('firebase');
        dataManager.setMode('firebase');
        setIsLoggedIn(true);

        // Fetch settings from Firebase
        dataManager.fetchCompanySettings().then(settings => {
          if (settings) {
            setCompanySettings(settings);
          }
        });
      } else {
        setAuthMode('local');
        dataManager.setMode('local');
        // On logout, fallback to local settings
        setCompanySettings(getCompanySettings());
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const PrintTemplate: React.FC<{ quote: Quote, settings: CompanySettings }> = ({ quote, settings }) => {
    const logoSrc = settings.logo || "/cotizador/ameizin-img.png";
    const primaryColor = settings.primaryColor || '#4f46e5';
    const accentColor = settings.accentColor || '#4338ca';
    const fontFamily = settings.typography || 'Inter';

    return (
      <div
        id="print-section"
        className="print-content bg-white p-8 md:p-12"
        style={{ fontFamily: `${fontFamily}, sans-serif` }}
      >
        {/* Dynamic Font Loader for Print */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;500;600;700&display=swap');
          #print-section { font-family: '${fontFamily}', sans-serif !important; }
          #print-section h1, #print-section h2, #print-section h3, #print-section .font-bold { font-weight: 700; }
        `}} />

        <header className="flex flex-col md:flex-row justify-between items-start mb-12 pb-6 border-b-2 gap-4" style={{ borderColor: primaryColor }}>
          <div className="w-full md:w-1/2 flex justify-center md:justify-start">
            <img src={logoSrc} alt="Logo" className="max-h-24 md:max-h-32 w-auto object-contain" />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-right">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase" style={{ color: primaryColor }}>
              COTIZACIÓN
            </h1>
            <div className="mt-4 inline-block bg-gray-100 px-4 py-2 rounded-lg">
              <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Referencia</p>
              <p className="font-mono text-xl font-bold text-gray-900">{quote.number}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></div>
              <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Preparado para:</h3>
            </div>
            <div className="bg-white p-6 rounded-xl border-l-4 border-gray-100 shadow-sm">
              <p className="font-bold text-2xl text-gray-900 mb-2">{quote.client.name}</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-semibold text-gray-400 mr-2">Identificación:</span>{quote.client.ruc}</p>
                {quote.client.address && <p><span className="font-semibold text-gray-400 mr-2">Dirección:</span>{quote.client.address}</p>}
                {quote.client.phone && <p><span className="font-semibold text-gray-400 mr-2">Teléfono:</span>{quote.client.phone}</p>}
                {quote.client.contact && <p><span className="font-semibold text-gray-400 mr-2">Correo:</span>{quote.client.contact}</p>}
              </div>
            </div>
          </div>
          <div className="space-y-4 md:text-right">
            <div className="flex items-center justify-end space-x-2">
              <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Emitido por:</h3>
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></div>
            </div>
            <div className="bg-white p-6 rounded-xl border-r-4 border-gray-100 shadow-sm">
              <p className="font-bold text-2xl text-gray-900 mb-2">{settings.name}</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>{settings.ruc}</p>
                <p>{settings.address}</p>
                <p>{settings.contact}</p>
                {settings.repName && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="font-bold text-gray-800">{settings.repName}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-tighter">{settings.repTitle}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-10 py-4 px-6 rounded-xl bg-gray-50 border border-gray-100 gap-4">
          <div className="flex items-center space-x-8">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Fecha de Emisión</p>
              <p className="font-bold text-gray-800">{quote.issueDate}</p>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Válida Hasta</p>
              <p className="font-bold text-gray-800">{quote.validityDate}</p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
              Documento Oficial de Cotización
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 mb-10 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: primaryColor, color: 'white' }}>
                <th className="py-4 px-6 text-left font-bold text-xs uppercase tracking-widest">Descripción del Servicio</th>
                <th className="py-4 px-6 text-center font-bold text-xs uppercase tracking-widest w-24">Cant.</th>
                <th className="py-4 px-6 text-right font-bold text-xs uppercase tracking-widest w-32">Precio</th>
                <th className="py-4 px-6 text-right font-bold text-xs uppercase tracking-widest w-32">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quote.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 px-6">
                    <p className="font-bold text-gray-900 leading-tight">{item.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono uppercase italic">{item.code}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap leading-relaxed max-w-lg">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="py-5 px-6 text-center align-top font-medium text-gray-600">{item.quantity}</td>
                  <td className="py-5 px-6 text-right align-top text-gray-600">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-5 px-6 text-right align-top font-bold text-gray-900">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-16">
          <div className="w-full md:w-1/3 space-y-3">
            <div className="flex justify-between items-center text-sm px-2">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="font-bold text-gray-900">${quote.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm px-2">
              <span className="text-gray-500 font-medium">Impuestos (IVA 15%)</span>
              <span className="font-bold text-gray-900">${quote.iva.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-4 mt-2 border-t-4" style={{ borderColor: primaryColor }}>
              <div className="flex justify-between items-center">
                <span className="font-black text-xl uppercase tracking-tighter" style={{ color: primaryColor }}>Total Final</span>
                <span className="font-black text-3xl" style={{ color: accentColor }}>
                  ${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mb-12">
            <div className="flex items-center space-x-2 mb-4">
              <i className="fas fa-file-contract text-xs" style={{ color: primaryColor }}></i>
              <h4 className="font-bold text-xs text-gray-800 uppercase tracking-widest">Notas y Condiciones</h4>
            </div>
            <div className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap bg-gray-50 p-6 rounded-xl border border-gray-100">
              {quote.notes}
            </div>
          </div>
        )}

        <footer className="mt-20 pt-10 border-t border-gray-100 text-center">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-6">
            {settings.website && (
              <div className="flex items-center text-xs font-bold" style={{ color: primaryColor }}>
                <i className="fas fa-globe mr-2"></i>{settings.website}
              </div>
            )}
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-xs font-bold hover:opacity-80 transition"
                style={{ color: primaryColor }}
              >
                <i className="fab fa-whatsapp mr-2"></i>{settings.whatsapp}
              </a>
            )}
            {settings.contact && (
              <div className="flex items-center text-xs text-gray-400">
                <i className="fas fa-envelope mr-2"></i>{settings.contact}
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-300 uppercase tracking-[0.2em] font-bold">
            Generado automáticamente por Super-Cotizador — Gracias por trabajar con nosotros
          </p>
        </footer>
      </div>
    );
  };

  const handleLogin = async (user: any, mode: AuthMode) => {
    setUserProfile(user);
    setAuthMode(mode);
    dataManager.setMode(mode);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    if (authMode === 'firebase') {
      try {
        await signOutFirebase();
      } catch (e) {
        console.error("Logout error:", e);
      }
    }
    setIsLoggedIn(false);
    setUserProfile(null);
    setAuthMode(null);
    setActiveTab('cotizador');
    setEditingQuoteId(null);
  };

  // Show loading while Firebase checks auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <span className="inline-block w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></span>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        settings={companySettings}
        authMode={authMode}
        userProfile={userProfile}
        onLogout={handleLogout}
      >
        {activeTab === 'dashboard' && <Dashboard settings={companySettings} />}
        {activeTab === 'cotizador' && (
          <QuoteBuilder
            settings={companySettings}
            onPrint={setPreviewQuote}
            editQuoteId={editingQuoteId}
            onQuoteSaved={() => {
              setEditingQuoteId(null);
            }}
          />
        )}
        {activeTab === 'estadisticas' && <Statistics settings={companySettings} />}
        {activeTab === 'clientes' && <Clients />}
        {activeTab === 'servicios' && <Services />}
        {activeTab === 'historial' && (
          <History
            onEdit={(id) => {
              setEditingQuoteId(id);
              setActiveTab('cotizador');
            }}
            onPrint={setPreviewQuote}
          />
        )}
        {activeTab === 'operaciones' && <Contracts />}
        {activeTab === 'perfil' && (
          <Profile
            onLogout={handleLogout}
            userProfile={userProfile}
            authMode={authMode}
          />
        )}
        {activeTab === 'configuracion' && (
          <Settings
            settings={companySettings}
            onUpdate={setCompanySettings}
          />
        )}
      </Layout>

      {previewQuote && (
        <Modal isOpen={!!previewQuote} onClose={() => setPreviewQuote(null)} maxWidth="max-w-5xl" hideCloseButton={true}>
          <div className="print:hidden mb-6 pb-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Vista Previa</h2>
              <p className="text-sm text-gray-500 mt-1">Revise la cotización antes de imprimir.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewQuote(null)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center font-medium shadow-md"
              >
                <i className="fas fa-print mr-2"></i> Imprimir / Guardar PDF
              </button>
            </div>
          </div>
          <PrintTemplate quote={previewQuote} settings={companySettings} />
        </Modal>
      )}
    </>
  );
};

export default App;
