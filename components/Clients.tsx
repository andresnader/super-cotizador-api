import React, { useState, useEffect } from 'react';
import { Client, Quote } from '../types';
import { getClients, saveClients, downloadFile, parseCSV, getQuotes, saveQuotes } from '../services/storage';
import Modal from './Modal';

interface ClientsProps {
    isModal?: boolean;
    onPrint?: (quote: Quote) => void;
}

const Clients: React.FC<ClientsProps> = ({ isModal, onPrint }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [form, setForm] = useState<Partial<Client>>({});
    const [isEditing, setIsEditing] = useState(false);
    
    // UI State
    const [showFormModal, setShowFormModal] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Import State
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importStatus, setImportStatus] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

    // Quote Management State
    const [selectedClientForQuotes, setSelectedClientForQuotes] = useState<Client | null>(null);
    const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
    const [showQuotesModal, setShowQuotesModal] = useState(false);

    useEffect(() => {
        setClients(getClients());
    }, []);

    // Filtered Clients based on Search
    const filteredClients = clients.filter(c => {
        const term = searchTerm.toLowerCase();
        return (
            c.name.toLowerCase().includes(term) ||
            c.ruc.includes(term) ||
            c.code.toLowerCase().includes(term)
        );
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let newClients = [...clients];
        if (isEditing && form.id) {
            newClients = newClients.map(c => c.id === form.id ? form as Client : c);
        } else {
            const newClient = { ...form, id: `client_${Date.now()}` } as Client;
            if (!newClient.code) newClient.code = newClient.name.substring(0, 3).toUpperCase();
            newClients.push(newClient);
        }
        setClients(newClients);
        saveClients(newClients);
        setForm({});
        setIsEditing(false);
        setShowFormModal(false);
    };

    const handleEdit = (c: Client) => {
        setForm(c);
        setIsEditing(true);
        setShowFormModal(true);
    };

    const openCreateModal = () => {
        setForm({});
        setIsEditing(false);
        setShowFormModal(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("¿Eliminar cliente?")) {
            const newClients = clients.filter(c => c.id !== id);
            setClients(newClients);
            saveClients(newClients);
        }
    };

    // Client Quotes Logic
    const handleViewQuotes = (client: Client) => {
        const allQuotes = getQuotes();
        const filtered = allQuotes.filter(q => q.client.id === client.id);
        setClientQuotes(filtered.reverse()); // Show newest first
        setSelectedClientForQuotes(client);
        setShowQuotesModal(true);
    };

    const handleDeleteQuote = (quoteId: string) => {
        if (confirm("¿Eliminar esta cotización del historial?")) {
            const allQuotes = getQuotes();
            const updatedAll = allQuotes.filter(q => q.id !== quoteId);
            saveQuotes(updatedAll);
            
            // Update local view
            setClientQuotes(clientQuotes.filter(q => q.id !== quoteId));
        }
    };

    const handleQuoteStatusChange = (quoteId: string, newStatus: Quote['status']) => {
        const allQuotes = getQuotes();
        const updatedAll = allQuotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q);
        saveQuotes(updatedAll);
        
        // Update local view
        setClientQuotes(clientQuotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
    };

    // CSV Import Logic
    const downloadTemplate = () => {
        const headers = "Identificación No.,Razón Social,Nombre Comercial,Dirección,Teléfono,Email";
        downloadFile("Plantilla_Clientes.csv", headers + "\n");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFile(file);
            setImportStatus({ msg: `Archivo seleccionado: ${file.name}`, type: 'info' });
        }
    };

    const handleImport = () => {
        if (!importFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const { data } = parseCSV(text);
                
                if (data.length === 0) {
                    setImportStatus({ msg: "No se encontraron datos válidos.", type: 'error' });
                    return;
                }

                const mappings = {
                    'identificacionno': 'ruc',
                    'razonsocial': 'name',
                    'nombrecomercial': 'code',
                    'direccion': 'address',
                    'telefono': 'phone',
                    'email': 'contact',
                };

                let addedCount = 0;
                let updatedCount = 0;
                const newClients = [...clients];

                data.forEach((row: any) => {
                    const clientData: any = {};
                    Object.entries(mappings).forEach(([csvKey, appKey]) => {
                        clientData[appKey] = row[csvKey] || '';
                    });

                    if (!clientData.name) return;
                    if (!clientData.code) clientData.code = clientData.name.substring(0, 10).toUpperCase();

                    const existingIdx = newClients.findIndex(c => c.ruc === clientData.ruc);
                    if (existingIdx >= 0 && clientData.ruc) {
                        newClients[existingIdx] = { ...newClients[existingIdx], ...clientData };
                        updatedCount++;
                    } else {
                        clientData.id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        newClients.push(clientData as Client);
                        addedCount++;
                    }
                });

                setClients(newClients);
                saveClients(newClients);
                setImportStatus({ msg: `Importación exitosa: ${addedCount} nuevos, ${updatedCount} actualizados.`, type: 'success' });
                setImportFile(null);
            } catch (err) {
                setImportStatus({ msg: "Error al procesar el archivo CSV.", type: 'error' });
            }
        };
        reader.readAsText(importFile);
    };

    const ClientForm = () => (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <input name="name" value={form.name || ''} onChange={handleChange} placeholder="Razón Social *" required className="p-3 border rounded-lg w-full" />
            <div className="grid grid-cols-2 gap-4">
                <input name="ruc" value={form.ruc || ''} onChange={handleChange} placeholder="RUC *" required className="p-3 border rounded-lg w-full" />
                <input name="code" value={form.code || ''} onChange={handleChange} placeholder="Código (Opcional)" className="p-3 border rounded-lg w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input name="contact" value={form.contact || ''} onChange={handleChange} placeholder="Email" type="email" className="p-3 border rounded-lg w-full" />
                <input name="phone" value={form.phone || ''} onChange={handleChange} placeholder="Teléfono" className="p-3 border rounded-lg w-full" />
            </div>
            <input name="address" value={form.address || ''} onChange={handleChange} placeholder="Dirección" className="p-3 border rounded-lg w-full" />
            
            <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => { setShowFormModal(false); if(isModal) window.location.reload(); /* fallback for quick close */ }} className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition font-semibold">
                    {isEditing ? 'Actualizar Cliente' : 'Guardar Cliente'}
                </button>
            </div>
        </form>
    );

    // If used as a quick add modal in QuoteBuilder
    if (isModal) {
        return (
            <div className="bg-white p-4">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Nuevo Cliente</h2>
                <ClientForm />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
                <button 
                    onClick={openCreateModal}
                    className="w-full md:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md flex items-center justify-center"
                >
                    <i className="fas fa-plus mr-2"></i> Agregar Nuevo Cliente
                </button>
            </div>

            {/* Form Modal */}
            <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-6 text-gray-800">{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                    <ClientForm />
                </div>
            </Modal>
            
            {/* Search Bar */}
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                    type="text"
                    placeholder="Buscar cliente por Nombre, RUC o Código..."
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto mb-8 border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 tracking-wider">Nombre / Contacto</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-500 tracking-wider">RUC / Dirección</th>
                            <th className="px-6 py-3 text-right text-xs font-bold uppercase text-gray-500 tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClients.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No se encontraron clientes.</td></tr>
                        ) : (
                            filteredClients.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{c.name}</div>
                                        <div className="text-sm text-gray-500">{c.contact}</div>
                                        {c.phone && <div className="text-xs text-gray-400 mt-1"><i className="fas fa-phone mr-1"></i>{c.phone}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-sm bg-gray-100 inline-block px-2 py-0.5 rounded text-gray-700 mb-1">{c.ruc}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs" title={c.address}>{c.address}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button 
                                            onClick={() => handleViewQuotes(c)} 
                                            className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-xs font-medium mr-2 hover:bg-indigo-100 transition"
                                            title="Ver Cotizaciones"
                                        >
                                            <i className="fas fa-history mr-1"></i> Historial
                                        </button>
                                        <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800 mr-3 transition" title="Editar"><i className="fas fa-edit"></i></button>
                                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 transition" title="Eliminar"><i className="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold mb-4 text-gray-700">Importar Clientes (CSV)</h3>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                         <button onClick={downloadTemplate} className="w-full md:w-auto bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition">
                            <i className="fas fa-download mr-2 text-blue-500"></i> Descargar Plantilla
                        </button>
                        
                        <div className="flex-1 w-full flex gap-2 items-center">
                            <input 
                                type="file" 
                                accept=".csv" 
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                            />
                        </div>
                         <button 
                            onClick={handleImport} 
                            disabled={!importFile}
                            className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md transition"
                        >
                            Cargar
                        </button>
                    </div>
                    {importStatus && (
                        <div className={`mt-4 p-3 rounded-lg text-sm border ${importStatus.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : importStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                            <i className={`fas ${importStatus.type === 'error' ? 'fa-times-circle' : 'fa-check-circle'} mr-2`}></i>
                            {importStatus.msg}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Historial de Cotizaciones */}
            <Modal isOpen={showQuotesModal} onClose={() => setShowQuotesModal(false)} maxWidth="max-w-4xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6 pb-2 border-b">
                        <div>
                             <h3 className="text-xl font-bold text-gray-800">Historial de Cotizaciones</h3>
                             <p className="text-sm text-gray-500">Cliente: {selectedClientForQuotes?.name}</p>
                        </div>
                        <button onClick={() => setShowQuotesModal(false)} className="text-gray-400 hover:text-gray-600">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    {clientQuotes.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <i className="fas fa-file-invoice text-gray-300 text-4xl mb-3"></i>
                            <p className="text-gray-500">Este cliente no tiene cotizaciones registradas.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-[60vh] border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Número</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Estado</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {clientQuotes.map(q => (
                                        <tr key={q.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-mono font-semibold text-indigo-600">
                                                {q.number}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {q.issueDate}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">
                                                ${q.total.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <select 
                                                    value={q.status} 
                                                    onChange={(e) => handleQuoteStatusChange(q.id, e.target.value as any)}
                                                    className={`p-1.5 rounded-md text-xs font-medium border-0 ring-1 ring-inset cursor-pointer focus:ring-2
                                                        ${q.status === 'Aceptada' ? 'bg-green-50 text-green-700 ring-green-600/20' : ''}
                                                        ${q.status === 'Rechazada' ? 'bg-red-50 text-red-700 ring-red-600/20' : ''}
                                                        ${q.status === 'Pendiente' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : ''}
                                                    `}
                                                >
                                                    <option value="Pendiente">Pendiente</option>
                                                    <option value="Aceptada">Aceptada</option>
                                                    <option value="Rechazada">Rechazada</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm">
                                                {onPrint && (
                                                    <button onClick={() => onPrint(q)} className="text-gray-600 hover:text-indigo-600 mr-3 transition" title="Imprimir PDF">
                                                        <i className="fas fa-print fa-lg"></i>
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteQuote(q.id)} className="text-gray-400 hover:text-red-600 transition" title="Eliminar">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Clients;