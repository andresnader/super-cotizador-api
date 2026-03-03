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

    onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ form, isEditing, onFormChange, onSubmit, onCancel }) => (
    <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-4">
            {/* Row 1: Name */}
            <div>
                <input
                    name="name"
                    value={form.name || ''}
                    onChange={onFormChange}
                    placeholder="Razón Social *"
                    required
                    className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
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
                    className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                />
                <input
                    name="contact"
                    value={form.contact || ''}
                    onChange={onFormChange}
                    placeholder="Email / Contacto"
                    className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                />
            </div>

            {/* Row 3: Phone */}
            <div>
                <input
                    name="phone"
                    value={form.phone || ''}
                    onChange={onFormChange}
                    placeholder="Teléfono"
                    className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                />
            </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-white/40 dark:bg-gray-700/40 hover:bg-white/60 dark:hover:bg-gray-600/60 text-gray-800 dark:text-gray-200 p-4 rounded-2xl transition font-medium backdrop-blur-md border border-white/50 dark:border-gray-600/50 shadow-sm"
            >
                Cancelar
            </button>
            <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white p-4 rounded-2xl transition font-bold shadow-lg shadow-emerald-500/30"
            >
                {isEditing ? 'Actualizar' : 'Guardar'}
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

    const handleDelete = async (id: string) => {
        if (!id) return;
        if (confirm(`¿Eliminar cliente? Esta acción es permanente.`)) {
            try {
                await dataManager.deleteClient(id);
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
        try {
            await dataManager.updateQuoteStatus(quote.id, newStatus);
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
                    onFormChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowFormModal(false)}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-24 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 px-2">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Directorio</span>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white drop-shadow-sm">
                        Gestión de Clientes
                    </h2>
                </div>
                <button
                    onClick={openCreateModal}
                    className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center font-bold active:scale-[0.98]"
                >
                    <i className="fas fa-plus mr-2 text-lg"></i> Agregar Nuevo Cliente
                </button>
            </div>

            <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white drop-shadow-sm">{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                    <ClientForm
                        form={form}
                        isEditing={isEditing}
                        onFormChange={handleChange}
                        onSubmit={handleSubmit}
                        onCancel={() => setShowFormModal(false)}
                    />
                </div>
            </Modal>

            <div className="mb-8 px-2">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-search text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por Nombre, RUC o Codigo..."
                        className="w-full h-14 pl-12 pr-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List Header */}
            <div className="px-3 mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                    Directorio <span className="text-xs ml-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">{filteredClients.length}</span>
                </h2>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-3xl shadow-sm">
                            <p className="text-gray-500 dark:text-gray-400">No se encontraron clientes.</p>
                        </div>
                    ) : (
                        filteredClients.map(c => (
                            <div key={c.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-3xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <span className="bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-3 py-1 rounded-full border border-white/40 dark:border-gray-600/50 uppercase tracking-tighter shadow-sm">
                                        RUC: {c.ruc}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(c)} className="h-8 w-8 rounded-full flex items-center justify-center bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-600/80 text-gray-600 dark:text-gray-300 transition-all shadow-sm border border-white/40 dark:border-gray-600/50">
                                            <i className="fas fa-edit text-xs"></i>
                                        </button>
                                        <button onClick={() => handleDelete(c.id)} className="h-8 w-8 rounded-full flex items-center justify-center bg-white/50 dark:bg-gray-700/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-500 transition-all shadow-sm border border-white/40 dark:border-gray-600/50">
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{c.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                                        {c.contact || 'Sin correo de contacto'}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/30 dark:border-gray-700/50">
                                    <button onClick={() => handleViewDetails(c)} className="bg-white/60 dark:bg-gray-700/60 hover:bg-white/90 dark:hover:bg-gray-600/90 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 transition-all shadow-sm border border-white/50 dark:border-gray-600/50">
                                        <i className="fas fa-eye text-emerald-600 dark:text-emerald-400"></i> Detalles
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <Modal isOpen={showQuotesModal} onClose={() => setShowQuotesModal(false)} maxWidth="max-w-4xl" hideCloseButton={true}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200 dark:border-gray-700/50">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm">Detalles del Cliente</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cliente: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedClientForQuotes?.name}</span></p>
                        </div>
                        <button
                            onClick={() => setShowQuotesModal(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 h-10 w-10 flex items-center justify-center rounded-full bg-white/40 dark:bg-gray-700/40 hover:bg-white/80 dark:hover:bg-gray-600/80 backdrop-blur-md transition-all border border-white/50 dark:border-gray-600/50 shadow-sm"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700/50 mb-6 pb-2 gap-4 overflow-x-auto no-scrollbar">
                        <button
                            className={`py-2 px-6 rounded-full font-bold text-sm transition-all focus:outline-none whitespace-nowrap ${activeDetailTab === 'quotes' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-white/40 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600/60'}`}
                            onClick={() => setActiveDetailTab('quotes')}
                        >
                            <i className="fas fa-history mr-2"></i> Cotizaciones
                        </button>
                        <button
                            className={`py-2 px-6 rounded-full font-bold text-sm transition-all focus:outline-none whitespace-nowrap ${activeDetailTab === 'contracts' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-white/40 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600/60'}`}
                            onClick={() => setActiveDetailTab('contracts')}
                        >
                            <i className="fas fa-file-contract mr-2"></i> Contratos
                        </button>
                    </div>

                    {quotesLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <>
                            {activeDetailTab === 'quotes' && (
                                clientQuotes.length === 0 ? (
                                    <div className="text-center py-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-gray-700/50 shadow-sm">
                                        <p className="text-gray-500 dark:text-gray-400">Este cliente no tiene cotizaciones registradas.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                                                <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Número</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doc</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                    {clientQuotes.map(q => (
                                                        <tr key={q.id} className="hover:bg-white/60 dark:hover:bg-gray-700/40 transition-colors">
                                                            <td className="px-4 py-4 text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{q.number}</td>
                                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{q.issueDate}</td>
                                                            <td className="px-4 py-4 text-right text-sm font-black text-gray-800 dark:text-gray-100 whitespace-nowrap">${q.total.toFixed(2)}</td>
                                                            <td className="px-4 py-4 text-center">
                                                                <div className="relative inline-block w-32">
                                                                    <select
                                                                        value={q.status}
                                                                        onChange={(e) => handleQuoteStatusChange(q, e.target.value as any)}
                                                                        className={`appearance-none w-full pl-3 pr-8 py-1.5 rounded-full text-[10px] font-bold uppercase border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-shadow
                                                                            ${q.status === 'Aceptada' ? 'bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/50' :
                                                                                q.status === 'Rechazada' ? 'bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200/50' :
                                                                                    'bg-amber-100/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200/50'}`}
                                                                    >
                                                                        <option className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800" value="Pendiente">Pendiente</option>
                                                                        <option className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800" value="Aceptada">Aceptada</option>
                                                                        <option className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800" value="Rechazada">Rechazada</option>
                                                                    </select>
                                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-60">
                                                                        <i className="fas fa-chevron-down text-[10px]"></i>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <div className="flex justify-center items-center gap-2">
                                                                    {q.pdfUrl && (
                                                                        <a href={q.pdfUrl} target="_blank" className="bg-white/50 dark:bg-gray-700/50 h-8 w-8 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-white/80 dark:hover:bg-gray-600/80 transition-all border border-white/40 shadow-sm" title="Ver PDF">
                                                                            <i className="fas fa-file-pdf"></i>
                                                                        </a>
                                                                    )}
                                                                    {onPrint && (
                                                                        <button onClick={() => onPrint(q)} className="bg-white/50 dark:bg-gray-700/50 h-8 w-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-600/80 transition-all border border-white/40 shadow-sm" title="Imprimir">
                                                                            <i className="fas fa-print text-sm"></i>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )
                            )}

                            {activeDetailTab === 'contracts' && (
                                clientContracts.length === 0 ? (
                                    <div className="text-center py-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-gray-700/50 shadow-sm">
                                        <p className="text-gray-500 dark:text-gray-400">Este cliente no tiene contratos activos.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                                                <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Servicio</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proveedor</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Periodo</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Renovación</th>
                                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                    {clientContracts.map(c => (
                                                        <tr key={c.id} className="hover:bg-white/60 dark:hover:bg-gray-700/40 transition-colors">
                                                            <td className="px-4 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                                                {c.serviceName}
                                                                <div className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{c.serviceType}</div>
                                                            </td>
                                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">{c.provider || '-'}</td>
                                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium capitalize">{c.period}</td>
                                                            <td className="px-4 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                                                                {c.nextRenewalDate}
                                                            </td>
                                                            <td className="px-4 py-4 text-right text-sm font-black text-gray-800 dark:text-gray-100">${c.amount.toFixed(2)}</td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                                                                    ${c.status === 'active' ? 'bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/50' :
                                                                        c.status === 'paused' ? 'bg-amber-100/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200/50' :
                                                                            'bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200/50'}`}>
                                                                    {c.status === 'active' ? 'Activo' : c.status === 'paused' ? 'Pausado' : 'Cancelado'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
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
