import React, { useState, useEffect, useMemo } from 'react';
import { RecurringContract, ContractPeriod, Client } from '../types';
import { dataManager } from '../services/dataManager';
import { notificationService } from '../services/notificationService';
import Modal from './Modal';



interface ContractFormProps {
    form: Partial<RecurringContract>;
    clients: Client[];
    isEditing: boolean;
    onFormChange: (field: keyof RecurringContract, value: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const ContractForm: React.FC<ContractFormProps> = ({ form, clients, isEditing, onFormChange, onSubmit, onCancel }) => {
    // Helper to calculate next renewal date based on start date and period
    useEffect(() => {
        if (form.startDate && form.period && !form.nextRenewalDate) {
            const date = new Date(form.startDate);
            const today = new Date();

            const monthsToAdd = {
                'monthly': 1,
                'quarterly': 3,
                'semiannual': 6,
                'annual': 12
            }[form.period as ContractPeriod] || 1;

            let nextDate = new Date(date);
            // If start date is in the past, calculate the next future renewal
            while (nextDate <= today) {
                nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
            }

            // Format as YYYY-MM-DD for input type="date"
            const formatted = nextDate.toISOString().split('T')[0];
            onFormChange('nextRenewalDate', formatted);
        }
    }, [form.startDate, form.period]);

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {/* Client & Service Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <select
                        value={form.clientId || ''}
                        onChange={(e) => {
                            const client = clients.find(c => c.id === e.target.value);
                            onFormChange('clientId', e.target.value);
                            if (client) onFormChange('clientName', client.name);
                        }}
                        required
                        className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">Seleccionar Cliente</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Servicio</label>
                    <select
                        value={form.serviceType || 'other'}
                        onChange={(e) => onFormChange('serviceType', e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="hosting">Hosting</option>
                        <option value="domain">Dominio</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="other">Otro</option>
                    </select>
                </div>
            </div>

            {/* Service Name & Provider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                    <input
                        value={form.serviceName || ''}
                        onChange={(e) => onFormChange('serviceName', e.target.value)}
                        placeholder="Ej: Hosting Plan Básico"
                        required
                        className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor / Operador</label>
                    <input
                        value={form.provider || ''}
                        onChange={(e) => onFormChange('provider', e.target.value)}
                        placeholder="Ej: GoDaddy, HostGator"
                        className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* Amount & Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={form.amount || ''}
                        onChange={(e) => onFormChange('amount', parseFloat(e.target.value))}
                        required
                        className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período de Cobro</label>
                    <select
                        value={form.period || 'monthly'}
                        onChange={(e) => onFormChange('period', e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="monthly">Mensual</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="semiannual">Semestral</option>
                        <option value="annual">Anual</option>
                    </select>
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                    <input
                        type="date"
                        value={form.startDate ? form.startDate.split('/').reverse().join('-') : ''} // Convert DD/MM/YYYY to YYYY-MM-DD for input
                        onChange={(e) => {
                            // Store as YYYY-MM-DD temporarily or convert immediately? 
                            // Let's stick to YYYY-MM-DD for input and convert to DD/MM/YYYY on save if needed, 
                            // but types say DD/MM/YYYY. Let's handle conversion.
                            const val = e.target.value; // YYYY-MM-DD
                            // onFormChange expects the value as is, we'll format on submit or keep consistent
                            // Let's just store YYYY-MM-DD in form state for simplicity and convert when saving/loading
                            onFormChange('startDate', val);
                        }}
                        required
                        className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Próxima Renovación</label>
                    <input
                        type="date"
                        value={form.nextRenewalDate ? form.nextRenewalDate.split('/').reverse().join('-') : ''}
                        onChange={(e) => onFormChange('nextRenewalDate', e.target.value)}
                        required
                        className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* Status & AutoRenew */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                        value={form.status || 'active'}
                        onChange={(e) => onFormChange('status', e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="active">Activo</option>
                        <option value="paused">Pausado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>
                <div className="flex items-center mt-6">
                    <input
                        type="checkbox"
                        id="autoRenew"
                        checked={form.autoRenew || false}
                        onChange={(e) => onFormChange('autoRenew', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoRenew" className="ml-2 block text-sm text-gray-900">
                        Auto-renovación
                    </label>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Notas</label>
                <textarea
                    value={form.description || ''}
                    onChange={(e) => onFormChange('description', e.target.value)}
                    rows={3}
                    className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    {isEditing ? 'Actualizar Contrato' : 'Guardar Contrato'}
                </button>
            </div>
        </form>
    );
};

const Contracts: React.FC = () => {
    const [contracts, setContracts] = useState<RecurringContract[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<Partial<RecurringContract>>({
        status: 'active',
        autoRenew: true,
        period: 'monthly',
        serviceType: 'hosting'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [loadedContracts, loadedClients] = await Promise.all([
                dataManager.fetchContracts(),
                dataManager.fetchClients()
            ]);
            setContracts(loadedContracts);
            setClients(loadedClients);

            // Check for notifications
            notificationService.notifyUpcomingRenewals(loadedContracts);
        } catch (error) {
            console.error("Error loading contracts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (field: keyof RecurringContract, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Convert dates from YYYY-MM-DD to DD/MM/YYYY if needed, or keep consistent.
            // The types say DD/MM/YYYY. Let's convert.
            const formatDate = (d: string) => {
                if (!d) return '';
                if (d.includes('/')) return d; // Already formatted
                const [y, m, d_part] = d.split('-');
                return `${d_part}/${m}/${y}`;
            };

            const contractToSave = {
                ...form,
                startDate: formatDate(form.startDate || ''),
                nextRenewalDate: formatDate(form.nextRenewalDate || '')
            } as RecurringContract;

            await dataManager.saveContract(contractToSave);
            await loadData();
            setShowFormModal(false);
            setForm({ status: 'active', autoRenew: true, period: 'monthly', serviceType: 'hosting' });
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving contract:", error);
            alert("Error al guardar el contrato");
        }
    };

    const handleEdit = (contract: RecurringContract) => {
        // Convert DD/MM/YYYY to YYYY-MM-DD for inputs
        const parseDate = (d: string) => {
            if (!d) return '';
            if (d.includes('-')) return d;
            const [day, month, year] = d.split('/');
            return `${year}-${month}-${day}`;
        };

        setForm({
            ...contract,
            startDate: parseDate(contract.startDate),
            nextRenewalDate: parseDate(contract.nextRenewalDate)
        });
        setIsEditing(true);
        setShowFormModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este contrato?')) {
            try {
                await dataManager.deleteContract(id);
                await loadData();
            } catch (error) {
                console.error("Error deleting contract:", error);
            }
        }
    };

    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            const matchesSearch =
                c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.provider.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = filterType === 'all' || c.serviceType === filterType;
            const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [contracts, searchTerm, filterType, filterStatus]);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Activo';
            case 'paused': return 'Pausado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'monthly': return 'Mensual';
            case 'quarterly': return 'Trimestral';
            case 'semiannual': return 'Semestral';
            case 'annual': return 'Anual';
            default: return period;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'paused': return 'bg-orange-100 text-orange-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDaysUntilRenewal = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/').map(Number);
        const renewalDate = new Date(year, month - 1, day);
        const today = new Date();
        const diffTime = renewalDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Contratos</h2>
                <button
                    onClick={() => {
                        setForm({ status: 'active', autoRenew: true, period: 'monthly', serviceType: 'hosting' });
                        setIsEditing(false);
                        setShowFormModal(true);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i> Nuevo Contrato
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Buscar por cliente, servicio o proveedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg outline-none"
                >
                    <option value="all">Todos los Tipos</option>
                    <option value="hosting">Hosting</option>
                    <option value="domain">Dominio</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="other">Otro</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg outline-none"
                >
                    <option value="all">Todos los Estados</option>
                    <option value="active">Activos</option>
                    <option value="paused">Pausados</option>
                    <option value="cancelled">Cancelados</option>
                </select>
            </div>

            {/* Contracts List */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Cargando contratos...</div>
            ) : filteredContracts.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm">
                    No se encontraron contratos.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContracts.map(contract => {
                        const daysUntil = getDaysUntilRenewal(contract.nextRenewalDate);
                        const isUrgent = daysUntil <= 30 && contract.status === 'active';

                        return (
                            <div key={contract.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-5 relative overflow-hidden">
                                {isUrgent && (
                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">
                                        Vence en {daysUntil} días
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getStatusColor(contract.status)}`}>
                                            {getStatusLabel(contract.status)}
                                        </span>
                                        <h3 className="font-bold text-lg text-gray-800 mt-2">{contract.serviceName}</h3>
                                        <p className="text-sm text-gray-500">{contract.clientName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-indigo-600 text-lg">${contract.amount.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400 capitalize">{getPeriodLabel(contract.period)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-server w-4 text-center text-gray-400"></i>
                                        <span>{contract.provider || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-calendar-alt w-4 text-center text-gray-400"></i>
                                        <span>Renueva: {contract.nextRenewalDate}</span>
                                    </div>
                                    {contract.description && (
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-align-left w-4 text-center text-gray-400"></i>
                                            <span className="truncate">{contract.description}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => handleEdit(contract)}
                                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition"
                                        title="Editar"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(contract.id)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                                        title="Eliminar"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
            >
                <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        {isEditing ? "Editar Contrato" : "Nuevo Contrato"}
                    </h3>
                    <ContractForm
                        form={form}
                        clients={clients}
                        isEditing={isEditing}
                        onFormChange={handleFormChange}
                        onSubmit={handleSubmit}
                        onCancel={() => setShowFormModal(false)}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default Contracts;
