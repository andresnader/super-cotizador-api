
import React, { useState, useEffect } from 'react';
import { Quote, CompanySettings } from '../types';
import { fetchQuotes, updateQuoteStatus } from '../services/google';

interface HistoryProps {
    settings: CompanySettings;
    onEdit: (id: string) => void;
    onPrint: (quote: Quote) => void;
}

const History: React.FC<HistoryProps> = ({ settings, onPrint }) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | '30' | '90'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
<<<<<<< HEAD
        const loadQuotes = async () => {
            try {
                setLoading(true);
                const data = await getQuotes();
                setQuotes(data);
            } catch (error) {
                console.error('Error loading quotes:', error);
=======
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchQuotes();
                setQuotes(data);
            } catch (e) {
                console.error(e);
>>>>>>> 7b1acce5b3bf139c54b3f0694a52a3715f24cecd
            } finally {
                setLoading(false);
            }
        };
<<<<<<< HEAD
        loadQuotes();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm("¿Eliminar cotización permanentemente?")) {
            try {
                const updated = quotes.filter(q => q.id !== id);
                setQuotes(updated);
                await saveQuotes(updated);
            } catch (error) {
                console.error('Error deleting quote:', error);
            }
        }
    };

    const handleStatusChange = async (id: string, status: Quote['status']) => {
        try {
            const updated = quotes.map(q => q.id === id ? { ...q, status } : q);
            setQuotes(updated);
            await saveQuotes(updated);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Combined Filter Logic
=======
        load();
    }, []);

    const handleStatusChange = async (quote: Quote, status: Quote['status']) => {
        if (!quote.rowId) return;
        try {
            await updateQuoteStatus(quote.rowId, status);
            setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status } : q));
        } catch (e) {
            console.error(e);
            alert("Error actualizando estado");
        }
    };

>>>>>>> 7b1acce5b3bf139c54b3f0694a52a3715f24cecd
    const filteredQuotes = quotes.filter(q => {
        // Basic search
        const term = searchTerm.toLowerCase();
        return (
            (q.number || '').toLowerCase().includes(term) ||
            (q.client?.name || '').toLowerCase().includes(term)
        );
    }).reverse();

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Cargando historial...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
<<<<<<< HEAD
                <h2 className="text-2xl font-bold text-gray-800">Historial</h2>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fas fa-search text-gray-400"></i>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar cotización..."
                            className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Date Filters */}
                    <div className="flex space-x-2">
                        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded text-sm transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Todo</button>
                        <button onClick={() => setFilter('30')} className={`px-3 py-1.5 rounded text-sm transition-colors ${filter === '30' ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>30 días</button>
                        <button onClick={() => setFilter('90')} className={`px-3 py-1.5 rounded text-sm transition-colors ${filter === '90' ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>90 días</button>
                    </div>
=======
                <h2 className="text-2xl font-bold text-gray-800">Historial (Drive)</h2>
                <div className="relative w-full sm:w-64">
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
>>>>>>> 7b1acce5b3bf139c54b3f0694a52a3715f24cecd
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
<<<<<<< HEAD
                                        <select
                                            value={q.status}
                                            onChange={(e) => handleStatusChange(q.id, e.target.value as any)}
                                            className={`p-1 rounded text-xs border border-gray-300
                                                ${q.status === 'Aceptada' ? 'bg-green-100 text-green-800' : ''}
                                                ${q.status === 'Rechazada' ? 'bg-red-100 text-red-800' : ''}
                                                ${q.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : ''}
                                            `}
=======
                                        <select 
                                            value={q.status} 
                                            onChange={(e) => handleStatusChange(q, e.target.value as any)}
                                            className="p-1 rounded text-xs border border-gray-300"
>>>>>>> 7b1acce5b3bf139c54b3f0694a52a3715f24cecd
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
