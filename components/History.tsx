
import React, { useState, useEffect } from 'react';
import { Quote, CompanySettings } from '../types';
import { dataManager } from '../services/dataManager';

interface HistoryProps {
    settings: CompanySettings;
    onEdit: (id: string) => void;
    onPrint: (quote: Quote) => void;
}

const History: React.FC<HistoryProps> = ({ settings, onPrint }) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const mode = dataManager.getMode();
    const sourceLabel = mode === 'google' ? 'Drive' : 'Local';

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await dataManager.fetchQuotes();
                setQuotes(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleStatusChange = async (quote: Quote, status: Quote['status']) => {
        if (!quote.rowId) return;
        try {
            await dataManager.updateQuoteStatus(quote.rowId, status);
            setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status } : q));
        } catch (e) {
            console.error(e);
            alert("Error actualizando estado");
        }
    };

    const filteredQuotes = quotes.filter(q => {
        const term = searchTerm.toLowerCase();
        return (
            (q.number || '').toLowerCase().includes(term) ||
            (q.client?.name || '').toLowerCase().includes(term)
        );
    }).reverse();

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Historial ({sourceLabel})</h2>
                <div className="relative w-full sm:w-64">
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? <p className="text-center py-8">Cargando...</p> : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredQuotes.map(q => (
                                <tr key={q.id}>
                                    <td className="px-4 py-3 font-mono text-xs font-semibold">{q.number}</td>
                                    <td className="px-4 py-3">{q.client.name}</td>
                                    <td className="px-4 py-3">{q.issueDate}</td>
                                    <td className="px-4 py-3 text-right font-semibold">${q.total.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <select 
                                            value={q.status} 
                                            onChange={(e) => handleStatusChange(q, e.target.value as any)}
                                            className="p-1 rounded text-xs border border-gray-300"
                                        >
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Aceptada">Aceptada</option>
                                            <option value="Rechazada">Rechazada</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {q.googleDocId && (
                                            <a href={`https://docs.google.com/document/d/${q.googleDocId}/edit`} target="_blank" className="text-blue-600 hover:text-blue-900 mr-3"><i className="fas fa-link"></i></a>
                                        )}
                                        <button onClick={() => onPrint(q)} className="text-indigo-600 hover:text-indigo-900" title="Imprimir"><i className="fas fa-print"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default History;
