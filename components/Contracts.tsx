import React, { useState, useEffect } from 'react';
import { CompanySettings, Quote } from '../types';
import { getQuotes } from '../services/storage';

interface ContractsProps {
    settings: CompanySettings;
}

const Contracts: React.FC<ContractsProps> = ({ settings }) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [selectedQuoteId, setSelectedQuoteId] = useState('');

    useEffect(() => {
        setQuotes(getQuotes().filter(q => q.status === 'Aceptada'));
    }, []);

    const handlePrint = () => {
        const q = quotes.find(quote => quote.id === selectedQuoteId);
        if (!q) return;

        // Simple contract print logic (In a real app, this would be a full template)
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head><title>Contrato - ${q.number}</title></head>
                <body style="font-family: sans-serif; padding: 40px; line-height: 1.6;">
                    <h1 style="text-align: center;">CONTRATO DE SERVICIOS</h1>
                    <p>Entre <strong>${settings.name}</strong> y <strong>${q.client.name}</strong>...</p>
                    <h3>Detalles:</h3>
                    <ul>${q.items.map(i => `<li>${i.name} - $${i.price}</li>`).join('')}</ul>
                    <h3>Total: $${q.total.toFixed(2)}</h3>
                    <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                        <div>_________________<br>${settings.repName}</div>
                        <div>_________________<br>${q.client.name}</div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Contratos</h2>
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
                    disabled={!selectedQuoteId}
                    onClick={handlePrint}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <i className="fas fa-file-signature mr-2"></i> Generar Contrato PDF
                </button>
            </div>
        </div>
    );
};

export default Contracts;