import React, { useState, useEffect } from 'react';
import { Quote, CompanySettings } from '../types';
import { getQuotes, saveQuotes } from '../services/storage';

interface HistoryProps {
    settings: CompanySettings;
    onEdit: (id: string) => void;
    onPrint: (quote: Quote) => void;
}

const History: React.FC<HistoryProps> = ({ settings, onPrint }) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [filter, setFilter] = useState<'all' | '30' | '90'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setQuotes(getQuotes());
    }, []);

    const handleDelete = (id: string) => {
        if (confirm("¿Eliminar cotización permanentemente?")) {
            const updated = quotes.filter(q => q.id !== id);
            setQuotes(updated);
            saveQuotes(updated);
        }
    };

    const handleStatusChange = (id: string, status: Quote['status']) => {
        const updated = quotes.map(q => q.id === id ? { ...q, status } : q);
        setQuotes(updated);
        saveQuotes(updated);
    };

    // Combined Filter Logic
    const filteredQuotes = quotes.filter(q => {
        // Date Filter
        let passesDate = true;
        if (filter !== 'all') {
            const [day, month, year] = q.issueDate.split('/');
            const date = new Date(`${year}-${month}-${day}`);
            const now = new Date();
            const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
            passesDate = diffDays <= parseInt(filter);
        }

        // Search Filter
        const term = searchTerm.toLowerCase();
        const passesSearch = (
            q.number.toLowerCase().includes(term) ||
            q.client.name.toLowerCase().includes(term)
        );

        return passesDate && passesSearch;
    }).reverse();

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
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
                </div>
            </div>

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
                        {filteredQuotes.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No se encontraron cotizaciones.</td></tr>
                        ) : (
                            filteredQuotes.map(q => (
                                <tr key={q.id}>
                                    <td className="px-4 py-3 font-mono text-xs font-semibold">{q.number}</td>
                                    <td className="px-4 py-3">{q.client.name}</td>
                                    <td className="px-4 py-3">{q.issueDate}</td>
                                    <td className="px-4 py-3 text-right font-semibold">${q.total.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <select 
                                            value={q.status} 
                                            onChange={(e) => handleStatusChange(q.id, e.target.value as any)}
                                            className={`p-1 rounded text-xs border border-gray-300
                                                ${q.status === 'Aceptada' ? 'bg-green-100 text-green-800' : ''}
                                                ${q.status === 'Rechazada' ? 'bg-red-100 text-red-800' : ''}
                                                ${q.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : ''}
                                            `}
                                        >
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Aceptada">Aceptada</option>
                                            <option value="Rechazada">Rechazada</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => onPrint(q)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Imprimir">
                                            <i className="fas fa-print"></i>
                                        </button>
                                        <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-900" title="Eliminar">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default History;