
import React, { useState, useEffect } from 'react';
import { Quote } from '../types';
import { dataManager } from '../services/dataManager';

interface HistoryProps {
    onEdit: (id: string) => void;
    onPrint: (quote: Quote) => void;
}

const History: React.FC<HistoryProps> = ({ onPrint, onEdit }) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');



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

    useEffect(() => {
        load();
    }, []);

    const handleStatusChange = async (quote: Quote, status: Quote['status']) => {
        try {
            await dataManager.updateQuoteStatus(quote.id, status);
            setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status } : q));
        } catch (e) {
            console.error(e);
            alert("Error actualizando estado");
        }
    };

    const handleDelete = async (quote: Quote) => {
        if (confirm(`¿Estás seguro de eliminar la cotización ${quote.number}?`)) {
            try {
                await dataManager.deleteQuote(quote.id);
                await load();
            } catch (e) {
                console.error(e);
                alert("Error eliminando cotización");
            }
        }
    };

    const filteredQuotes = quotes.filter(q => {
        const term = searchTerm.toLowerCase();
        return (
            (q.number || '').toLowerCase().includes(term) ||
            (q.client?.name || '').toLowerCase().includes(term)
        );
    }).reverse();

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Aceptada': return 'bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-700/50';
            case 'Rechazada': return 'bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200/50 dark:border-rose-700/50';
            default: return 'bg-amber-100/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200/50 dark:border-amber-700/50';
        }
    };

    return (
        <div className="animate-fade-in pb-24">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-2">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white drop-shadow-sm">
                    Historial
                </h2>
                <div className="relative w-full sm:w-64">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        <i className="fas fa-search"></i>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar cotizaciones..."
                        className="w-full h-12 pl-12 pr-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {
                loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                ) : filteredQuotes.length === 0 ? (
                    <div className="text-center py-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-gray-700/50 shadow-sm">
                        <p className="text-gray-500 dark:text-gray-400">No se encontraron cotizaciones.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filteredQuotes.map(q => (
                            <div key={q.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 flex flex-col rounded-3xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                        #{q.number} &bull; {q.issueDate}
                                    </span>
                                    <div className="relative">
                                        <select
                                            value={q.status}
                                            onChange={(e) => handleStatusChange(q, e.target.value as any)}
                                            className={`appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-md border ${getStatusStyle(q.status)} focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors`}
                                        >
                                            <option className="text-gray-800 bg-white dark:bg-gray-800 dark:text-white" value="Pendiente">Pendiente</option>
                                            <option className="text-gray-800 bg-white dark:bg-gray-800 dark:text-white" value="Aceptada">Aceptada</option>
                                            <option className="text-gray-800 bg-white dark:bg-gray-800 dark:text-white" value="Rechazada">Rechazada</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                                            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1 line-clamp-1">{q.client.name}</h3>
                                    <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                        ${q.total.toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between gap-3 border-t border-white/30 dark:border-gray-700/50 pt-4 mt-auto">
                                    <div className="flex gap-2">
                                        <button onClick={() => onPrint(q)} className="bg-white/40 dark:bg-gray-700/40 hover:bg-white/80 dark:hover:bg-gray-600/80 backdrop-blur-md border border-white/50 dark:border-gray-600/50 flex h-10 w-10 items-center justify-center rounded-xl text-indigo-600 dark:text-indigo-400 transition-all shadow-sm" title="Imprimir">
                                            <i className="fas fa-print"></i>
                                        </button>
                                        <button onClick={() => onEdit(q.id)} className="bg-white/40 dark:bg-gray-700/40 hover:bg-white/80 dark:hover:bg-gray-600/80 backdrop-blur-md border border-white/50 dark:border-gray-600/50 flex h-10 w-10 items-center justify-center rounded-xl text-emerald-600 dark:text-emerald-400 transition-all shadow-sm" title="Editar">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                    </div>
                                    <button onClick={() => handleDelete(q)} className="bg-white/40 dark:bg-gray-700/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 backdrop-blur-md border border-white/50 dark:border-gray-600/50 flex h-10 w-10 items-center justify-center rounded-xl text-rose-600 dark:text-rose-400 transition-all shadow-sm" title="Eliminar">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
};

export default History;
