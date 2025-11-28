import React, { useState, useEffect } from 'react';
import { Client, Quote, RecurringContract } from '../types';
import { dataManager } from '../services/dataManager';
import Modal from './Modal';

interface ClientsProps {
    isModal?: boolean;
    onPrint?: (quote: Quote) => void;
}

// Extracted ClientForm to prevent re-renders during typing
interface ClientFormProps {
    form: Partial<Client>;
    isEditing: boolean;
    mode: 'google' | 'local' | null;
    onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ form, isEditing, mode, onFormChange, onSubmit, onCancel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
        {/* Row 1: Name */}
        <div>
            <input
                name="name"
                value={form.name || ''}
                onChange={onFormChange}
                placeholder="Razon Social *"
                required
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
            />
        </div>

        {/* Row 2: RUC & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
                name="ruc"
                value={form.ruc || ''}
                onChange={onFormChange}
                placeholder="RUC *"
                required
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
                name="contact"
                value={form.contact || ''}
                onChange={onFormChange}
                placeholder="Email / Contacto"
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
            />
        </div>

        {/* Row 3: Phone */}
        <div>
            <input
                name="phone"
                value={form.phone || ''}
                onChange={onFormChange}
                placeholder="Telefono"
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
            />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition font-medium"
            >
                Cancelar
            </button>
            <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md"
            >
                {isEditing ? `Actualizar (${mode === 'local' ? 'Local' : 'Drive'})` : `Guardar (${mode === 'local' ? 'Local' : 'Drive'})`}
            </button>
        </div>
    </form>
);

const Clients: React.FC<ClientsProps> = ({ isModal, onPrint }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<Partial<Client>>({});
    const [isEditing, setIsEditing] = useState(false);

    const [showFormModal, setShowFormModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedClientForQuotes, setSelectedClientForQuotes] = useState<Client | null>(null);
    const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
    const [clientContracts, setClientContracts] = useState<RecurringContract[]>([]);
    const [showQuotesModal, setShowQuotesModal] = useState(false);
    const [quotesLoading, setQuotesLoading] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState<'quotes' | 'contracts'>('quotes');

    const mode = dataManager.getMode();
    const sourceLabel = mode === 'google' ? 'Google Sheets' : 'Local';

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await dataManager.fetchClients();
            setClients(data);
        } catch (e) {
            console.error(e);
            alert("Error cargando clientes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredClients = clients.filter(c => {
        const term = searchTerm.toLowerCase();
        return (
            (c.name || '').toLowerCase().includes(term) ||
            (c.ruc || '').includes(term)
        );
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newClient = { ...form } as Client;
            await dataManager.saveClient(newClient);
            await loadData(); // Reload list
            setForm({});
            setIsEditing(false);
            setShowFormModal(false);
        } catch (e) {
            console.error(e);
            alert("Error guardando cliente");
        }
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

    const handleDelete = async (rowId?: any) => {
        if (!rowId) return;
        if (confirm(`¿Eliminar cliente? Esta acción es permanente en ${sourceLabel}.`)) {
            try {
                await dataManager.deleteClient(rowId);
                await loadData();
            } catch (e) {
                console.error(e);
                alert("Error eliminando cliente");
            }
        }
    };

    const handleViewDetails = async (client: Client) => {
        setSelectedClientForQuotes(client);
        setShowQuotesModal(true);
        setQuotesLoading(true);
        setActiveDetailTab('quotes'); // Default tab
        try {
            const [allQuotes, allContracts] = await Promise.all([
                dataManager.fetchQuotes(),
                dataManager.fetchContracts()
            ]);

            const clientQuotesFiltered = allQuotes.filter(q => q.client.ruc === client.ruc);
            setClientQuotes(clientQuotesFiltered.reverse());

            const clientContractsFiltered = allContracts.filter(c => c.clientId === client.id || c.clientName === client.name); // Try ID then Name
            setClientContracts(clientContractsFiltered);

        } catch (e) {
            console.error(e);
        } finally {
            setQuotesLoading(false);
        }
    };

    const handleQuoteStatusChange = async (quote: Quote, newStatus: Quote['status']) => {
        if (!quote.rowId) return;
        try {
            await dataManager.updateQuoteStatus(quote.rowId, newStatus);
            // Update local state
            setClientQuotes(clientQuotes.map(q => q.id === quote.id ? { ...q, status: newStatus } : q));
        } catch (e) {
            console.error(e);
            alert("Error actualizando estado");
        }
    };

    if (isModal) {
        return (
            <div className="bg-white p-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Nuevo Cliente</h2>
                </div>
                <ClientForm
                    form={form}
                    isEditing={isEditing}
                    mode={mode}
                    onFormChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowFormModal(false)}
                />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes ({sourceLabel})</h2>
                <button
                    onClick={openCreateModal}
                    className="w-full md:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-md flex items-center justify-center font-medium"
                >
                    <i className="fas fa-plus mr-2"></i> Agregar Nuevo Cliente
                </button>
            </div>

            <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-6 text-gray-800">{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                    <ClientForm
                        form={form}
                        isEditing={isEditing}
                        mode={mode}
                        onFormChange={handleChange}
                        onSubmit={handleSubmit}
                        onCancel={() => setShowFormModal(false)}
                    />
                </div>
            </Modal>

            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                    type="text"
                    placeholder="Buscar cliente por Nombre, RUC o Codigo..."
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Cargando datos...</div>
            ) : (
                <div className="space-y-4">
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            No se encontraron clientes.
                        </div>
                    ) : (
                        filteredClients.map(c => (
                            <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{c.name}</h3>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {c.contact && <span>{c.contact}</span>}
                                    </div>
                                </div>
                                <div className="flex-1 md:text-right md:pr-8">
                                    <div className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm font-mono font-medium mb-1">
                                        {c.ruc}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                    <button onClick={() => handleViewDetails(c)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition flex items-center">
                                        <i className="fas fa-folder-open mr-2"></i> Detalles
                                    </button>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(c)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"><i className="fas fa-pencil-alt"></i></button>
                                        <button onClick={() => handleDelete(c.rowId)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><i className="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <Modal isOpen={showQuotesModal} onClose={() => setShowQuotesModal(false)} maxWidth="max-w-4xl" hideCloseButton={true}>
                <div className="p-6 bg-white h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Detalles del Cliente</h3>
                            <p className="text-sm text-gray-500 mt-1">Cliente: <span className="font-medium text-gray-700">{selectedClientForQuotes?.name}</span></p>
                        </div>
                        <button
                            onClick={() => setShowQuotesModal(false)}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 mb-4">
                        <button
                            className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeDetailTab === 'quotes' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveDetailTab('quotes')}
                        >
                            <i className="fas fa-history mr-2"></i> Historial de Cotizaciones
                        </button>
                        <button
                            className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeDetailTab === 'contracts' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveDetailTab('contracts')}
                        >
                            <i className="fas fa-file-contract mr-2"></i> Contratos Recurrentes
                        </button>
                    </div>

                    {quotesLoading ? <p className="text-center py-8 text-gray-500">Cargando datos...</p> : (
                        <>
                            {activeDetailTab === 'quotes' && (
                                clientQuotes.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <p className="text-gray-500">Este cliente no tiene cotizaciones registradas.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Número</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total</th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Estado</th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Doc</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {clientQuotes.map(q => (
                                                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-mono font-semibold text-indigo-600 whitespace-nowrap">{q.number}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{q.issueDate}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-800 whitespace-nowrap">${q.total.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="relative inline-block">
                                                                <select
                                                                    value={q.status}
                                                                    onChange={(e) => handleQuoteStatusChange(q, e.target.value as any)}
                                                                    className={`appearance-none pl-2 pr-6 py-1 rounded-md text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500
                                                                        ${q.status === 'Aceptada' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                            q.status === 'Rechazada' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                                'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                                                                >
                                                                    <option value="Pendiente">Pendiente</option>
                                                                    <option value="Aceptada">Aceptada</option>
                                                                    <option value="Rechazada">Rechazada</option>
                                                                </select>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm">
                                                            <div className="flex justify-center items-center space-x-3">
                                                                {q.googleDocId && (
                                                                    <a href={`https://docs.google.com/document/d/${q.googleDocId}/edit`} target="_blank" className="text-blue-600 hover:text-blue-800" title="Ver en Drive">
                                                                        <i className="fas fa-file-alt"></i>
                                                                    </a>
                                                                )}
                                                                {onPrint && (
                                                                    <button onClick={() => onPrint(q)} className="text-gray-500 hover:text-gray-800" title="Imprimir">
                                                                        <i className="fas fa-print"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}

                            {activeDetailTab === 'contracts' && (
                                clientContracts.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <p className="text-gray-500">Este cliente no tiene contratos activos.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Servicio</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Proveedor</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Periodo</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Próx. Renovación</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Monto</th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {clientContracts.map(c => (
                                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                            {c.serviceName}
                                                            <div className="text-xs text-gray-500">{c.serviceType}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{c.provider || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{c.period}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {c.nextRenewalDate}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">${c.amount.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                                                ${c.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                    c.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'}`}>
                                                                {c.status === 'active' ? 'Activo' : c.status === 'paused' ? 'Pausado' : 'Cancelado'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Clients;
