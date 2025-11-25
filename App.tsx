import React, { useState, useEffect } from 'react';
import { CompanySettings, Quote } from './types';
import { getCompanySettings } from './services/storage';
import Login from './components/Login';
import Layout from './components/Layout';
import QuoteBuilder from './components/QuoteBuilder';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Clients from './components/Clients';
import Services from './components/Services';
import Settings from './components/Settings';
import Modal from './components/Modal';

const App: React.FC = () => {
    console.log('App component rendering');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState('cotizador');
    const [companySettings, setCompanySettings] = useState<CompanySettings>(getCompanySettings());
    const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);

    useEffect(() => {
        document.body.style.fontFamily = companySettings.typography;
    }, [companySettings]);

    useEffect(() => {
        const logged = sessionStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(logged);
        console.log('Logged in status:', logged);
    }, []);

    const handleLogin = () => {
        console.log('Login successful');
        sessionStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
    };

    const handlePrintRequest = (quote: Quote) => {
        setPreviewQuote(quote);
    };

    const executePrint = () => {
        window.print();
    };

    console.log('Is logged in:', isLoggedIn);

    if (!isLoggedIn) {
        console.log('Rendering Login component');
        return <Login onLogin={handleLogin} />;
    }

    console.log('Rendering main app');

    return (
        <div className="min-h-screen flex flex-col">
            <Modal
                isOpen={!!previewQuote}
                onClose={() => setPreviewQuote(null)}
                maxWidth="max-w-5xl"
                hideCloseButton={true}
            >
                <div className="flex flex-col h-full bg-gray-50">
                    <div className="flex justify-between items-center px-4 md:px-6 py-4 bg-white border-b border-gray-200 no-print sticky top-0 z-10 print:hidden">
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-gray-800">Vista Previa</h3>
                            <p className="text-xs md:text-sm text-gray-500">Revise la cotización antes de imprimir.</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setPreviewQuote(null)}
                                className="px-3 md:px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition shadow-sm text-sm font-medium"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={executePrint}
                                className="px-4 md:px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow-md flex items-center text-sm"
                            >
                                <i className="fas fa-print mr-2"></i> Imprimir PDF
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 md:p-8 print:p-0 print:overflow-visible">
                        <div id="print-section" className="bg-white p-4 md:p-12 border border-gray-200 shadow-sm mx-auto w-full max-w-4xl print:border-none print:shadow-none print:w-full print:max-w-none print:p-0">
                            {previewQuote && <PrintTemplate quote={previewQuote} settings={companySettings} />}
                        </div>
                    </div>
                </div>
            </Modal>

            <div className="no-print flex-grow">
                <Layout
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    settings={companySettings}
                >
                    {activeTab === 'cotizador' && <QuoteBuilder settings={companySettings} onPrint={handlePrintRequest} />}
                    {activeTab === 'dashboard' && <Dashboard settings={companySettings} />}
                    {activeTab === 'historial' && <History settings={companySettings} onEdit={(id) => setActiveTab('cotizador')} onPrint={handlePrintRequest} />}
                    {activeTab === 'clientes' && <Clients onPrint={handlePrintRequest} />}
                    {activeTab === 'servicios' && <Services />}
                    {activeTab === 'configuracion' && <Settings settings={companySettings} onUpdate={setCompanySettings} />}
                </Layout>
            </div>
        </div>
    );
};

const PrintTemplate: React.FC<{ quote: Quote, settings: CompanySettings }> = ({ quote, settings }) => {
    const logoSrc = settings.logo || "https://placehold.co/200x100/eef2ff/4f46e5?text=Tu+Logo";

    return (
        <div className="font-sans text-gray-800 print-content text-sm md:text-base">
            <header className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-10 pb-4 border-b border-gray-300 gap-4">
                <div className="w-full md:w-1/2 flex justify-center md:justify-start">
                    <img src={logoSrc} alt="Logo" className="max-h-20 md:max-h-24 w-auto object-contain" />
                </div>
                <div className="w-full md:w-1/2 text-center md:text-right">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: settings.primaryColor }}>COTIZACIÓN</h1>
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
                <div>
                    <span className="text-gray-500 text-xs uppercase font-bold mr-2">Fecha de Emisión:</span>
                    <span className="font-medium text-gray-800">{quote.issueDate}</span>
                </div>
                <div>
                    <span className="text-gray-500 text-xs uppercase font-bold mr-2">Válida Hasta:</span>
                    <span className="font-medium text-gray-800">{quote.validityDate}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full mb-10 border-collapse min-w-[500px]">
                    <thead>
                        <tr style={{ backgroundColor: settings.primaryColor, color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
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

            <footer className="mt-12 md:mt-20 text-center text-gray-500 text-sm border-t border-gray-200 pt-8">
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

export default App;
