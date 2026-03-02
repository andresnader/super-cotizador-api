import React, { useState, useEffect } from 'react';
import { CompanySettings, Quote, AuthMode } from './types';
import { getCompanySettings } from './services/storage';
import { onAuthChange, signOutFirebase } from './services/firebaseAuth';
import { dataManager } from './services/dataManager';
import { downloadQuotePDF } from './services/pdfService';
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

  const [activeTab, setActiveTab] = useState('cotizador');
  const [companySettings, setCompanySettings] = useState<CompanySettings>(getCompanySettings());

  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.fontFamily = companySettings.typography;
  }, [companySettings]);

  const PrintTemplate: React.FC<{ quote: Quote, settings: CompanySettings }> = ({ quote, settings }) => {
    const logoSrc = settings.logo || "/cotizador/ameizin-img.png";

    return (
      <div id="print-section" className="font-sans text-gray-800 print-content text-sm md:text-base">
        <header className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-10 pb-4 border-b border-gray-300 gap-4">
          <div className="w-full md:w-1/2 flex justify-center md:justify-start">
            <img src={logoSrc} alt="Logo" className="max-h-20 md:max-h-24 w-auto object-contain" />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-right">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-indigo-700" style={{ color: settings.primaryColor }}>COTIZACIÓN</h1>
            <p className="text-gray-600 mt-2 text-base md:text-lg">Nº: <span className="font-mono font-medium text-gray-800">{quote.number}</span></p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-8 md:mb-12">
          <div>
            <h3 className="font-bold text-gray-500 mb-2 md:mb-3 uppercase text-xs tracking-wider">Facturar a (Cliente):</h3>
            <div className="bg-gray-50 p-4 md:p-5 rounded-lg border border-gray-100 print:bg-white print:border-gray-200">
              <p className="font-bold text-lg text-gray-900 mb-1">{quote.client.name}</p>
              <p className="text-gray-700 mb-1"><span className="font-medium text-xs text-gray-500 uppercase mr-2">RUC/CI:</span>{quote.client.ruc}</p>
              {quote.client.address && <p className="text-gray-700 mb-1"><span className="font-medium text-xs text-gray-500 uppercase mr-2">Dir:</span>{quote.client.address}</p>}
              {quote.client.phone && <p className="text-gray-700 mb-1"><span className="font-medium text-xs text-gray-500 uppercase mr-2">Tel:</span>{quote.client.phone}</p>}
              {quote.client.contact && <p className="text-gray-700"><span className="font-medium text-xs text-gray-500 uppercase mr-2">Email:</span>{quote.client.contact}</p>}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-500 mb-2 md:mb-3 uppercase text-xs tracking-wider">De (Emisor):</h3>
            <div className="bg-gray-50 p-4 md:p-5 rounded-lg border border-gray-100 md:text-right print:bg-white print:border-gray-200">
              <p className="font-bold text-lg text-gray-900 mb-1">{settings.name}</p>
              <p className="text-gray-700 mb-1">{settings.ruc}</p>
              <p className="text-gray-700 mb-1">{settings.address}</p>
              <p className="text-gray-700">{settings.contact}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100 print:bg-white print:border-gray-200 gap-2">
          <div className="w-full md:w-auto flex justify-between md:block">
            <span className="text-gray-500 text-xs uppercase font-bold mr-2">Fecha de Emisión:</span>
            <span className="font-medium text-gray-800">{quote.issueDate}</span>
          </div>
          <div className="w-full md:w-auto flex justify-between md:block">
            <span className="text-gray-500 text-xs uppercase font-bold mr-2">Válida Hasta:</span>
            <span className="font-medium text-gray-800">{quote.validityDate}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full mb-10 border-collapse min-w-full md:min-w-[600px]">
            <thead>
              <tr style={{ backgroundColor: settings.primaryColor, color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
                <th className="py-3 px-4 text-left font-semibold rounded-tl-lg text-xs md:text-sm uppercase tracking-wide">Descripción</th>
                <th className="py-3 px-4 text-center font-semibold text-xs md:text-sm uppercase tracking-wide w-16 md:w-24">Cant.</th>
                <th className="py-3 px-4 text-right font-semibold text-xs md:text-sm uppercase tracking-wide w-24 md:w-32">Precio Unit.</th>
                <th className="py-3 px-4 text-right font-semibold rounded-tr-lg text-xs md:text-sm uppercase tracking-wide w-24 md:w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors print:hover:bg-transparent">
                  <td className="py-4 px-4 align-top">
                    <p className="font-bold text-gray-800">{item.name} <span className="text-xs text-gray-400 font-normal ml-1">({item.code})</span></p>
                    {item.description && <p className="text-xs md:text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{item.description}</p>}
                  </td>
                  <td className="py-4 px-4 text-center align-top text-gray-700">{item.quantity}</td>
                  <td className="py-4 px-4 text-right align-top text-gray-700">${item.price.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right align-top font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full md:w-1/2 lg:w-5/12">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-medium text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">${quote.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-medium text-gray-600">IVA (15%)</span>
              <span className="font-semibold text-gray-900">${quote.iva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-4 mt-2 border-t-2" style={{ borderColor: settings.primaryColor }}>
              <span className="font-bold text-xl" style={{ color: settings.accentColor }}>TOTAL</span>
              <span className="font-bold text-2xl" style={{ color: settings.accentColor }}>${quote.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-8 md:mt-12 pt-6 border-t border-gray-200">
            <h4 className="font-bold text-sm mb-3 text-gray-800 uppercase tracking-wide">Términos y Condiciones / Notas:</h4>
            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100 print:bg-white print:border-gray-200">
              {quote.notes}
            </div>
          </div>
        )}

        <footer className="mt-12 md:mt-20 text-center text-gray-500 text-sm border-t border-gray-200 pt-8 print:mt-12">
          <div className="mb-4 flex flex-col md:flex-row justify-center space-y-2 md:space-y-0 md:space-x-6">
            {settings.website && (
              <span style={{ color: settings.primaryColor }} className="font-medium">{settings.website}</span>
            )}
            {settings.contact && (
              <span>{settings.contact}</span>
            )}
            {settings.whatsapp && (
              <span style={{ color: settings.primaryColor }} className="font-medium"><i className="fab fa-whatsapp mr-1"></i>{settings.whatsapp}</span>
            )}
          </div>
          <p className="italic">Gracias por su preferencia.</p>
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

  const handleDownloadPDF = async () => {
    if (!previewQuote) return;
    setIsDownloading(true);
    try {
      await downloadQuotePDF(previewQuote.number);
    } catch (e) {
      console.error("Error generating PDF:", e);
      alert("Error al generar el PDF. Intente imprimir directamente.");
    } finally {
      setIsDownloading(false);
    }
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
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium shadow-md disabled:opacity-50"
              >
                <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : 'fa-download'} mr-2`}></i>
                {isDownloading ? 'Generando...' : 'Descargar PDF'}
              </button>
              <button
                onClick={() => window.print()}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center font-medium shadow-md"
              >
                <i className="fas fa-print mr-2"></i> Imprimir
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
