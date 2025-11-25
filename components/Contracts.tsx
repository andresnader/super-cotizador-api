
import React, { useState, useEffect } from 'react';
import { CompanySettings, Quote } from '../types';
import { dataManager } from '../services/dataManager';

interface ContractsProps {
    settings: CompanySettings;
}

const Contracts: React.FC<ContractsProps> = ({ settings }) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [selectedQuoteId, setSelectedQuoteId] = useState('');
    const [loading, setLoading] = useState(false);

    const mode = dataManager.getMode();

    useEffect(() => {
        const load = async () => {
            const all = await dataManager.fetchQuotes();
            setQuotes(all.filter(q => q.status === 'Aceptada'));
        };
        load();
    }, []);

    const handleCreateContract = async () => {
        const q = quotes.find(quote => quote.id === selectedQuoteId);
        if (!q) return;
        
        setLoading(true);
        try {
            const docId = await dataManager.createQuoteDoc(q);
            if (docId) {
                alert(`Contrato creado en Drive.\nID: ${docId}`);
                window.open(`https://docs.google.com/document/d/${docId}/edit`, '_blank');
            }
        } catch (e: any) {
            alert("Error creando contrato: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Contratos {mode === 'google' ? '(Drive)' : '(Local)'}</h2>
            
            {mode === 'local' ? (
                <div className="p-6 bg-orange-50 text-orange-800 rounded-lg border border-orange-200 text-center">
                    <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p className="font-bold">Función no disponible en Modo Local</p>
                    <p className="text-sm mt-2">La generación automática de contratos requiere conexión con Google Docs (Modo Nube).</p>
                </div>
            ) : (
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Cotización Aceptada</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                        value={selectedQuoteId}
                        onChange={(e) => setSelectedQuoteId(e.target.value)}
                    >
                        <option value="">-- Seleccionar --</option>
                        {quotes.map(q => <option key={q.id} value={q.id}>{q.number} - {q.client.name}</option>)}
                    </select>
                    
                    <button 
                        disabled={!selectedQuoteId || loading}
                        onClick={handleCreateContract}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? 'Creando...' : <><i className="fas fa-file-contract mr-2"></i> Generar Contrato (Google Doc)</>}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Contracts;
