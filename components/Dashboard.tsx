import React, { useState, useEffect, useMemo } from 'react';
import { Quote, CompanySettings, Client, RecurringContract, Service } from '../types';
import { dataManager } from '../services/dataManager';
import { notificationService } from '../services/notificationService';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardProps {
    settings: CompanySettings;
}

const Dashboard: React.FC<DashboardProps> = ({ settings }) => {
    // Data State
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [contracts, setContracts] = useState<RecurringContract[]>([]);
    const [loading, setLoading] = useState(true);

    // Quick Quote State
    const [quickClientId, setQuickClientId] = useState('');
    const [quickServiceId, setQuickServiceId] = useState('');
    const [quickItems, setQuickItems] = useState<Array<{ id: string; serviceId: string; serviceName: string; quantity: number; price: number }>>([]);
    const [quickValidity, setQuickValidity] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    const [quickQuoteNumber, setQuickQuoteNumber] = useState('');

    // Search State
    const [clientSearch, setClientSearch] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');

    // Modal States
    const [showQuickClientModal, setShowQuickClientModal] = useState(false);
    const [showQuickServiceModal, setShowQuickServiceModal] = useState(false);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);

    // Quick Forms
    const [quickClientForm, setQuickClientForm] = useState({ name: '', ruc: '', phone: '', contact: '' });
    const [quickServiceForm, setQuickServiceForm] = useState({ code: '', name: '', price: '', category: 'General' });

    const mode = dataManager.getMode();
    const sourceLabel = mode === 'google' ? 'Drive' : 'Local';
    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    // Load Data
    useEffect(() => {
        const load = async () => {
            try {
                const [quotesData, clientsData, contractsData, servicesData] = await Promise.all([
                    dataManager.fetchQuotes(),
                    dataManager.fetchClients(),
                    dataManager.fetchContracts(),
                    dataManager.fetchServices()
                ]);
                setQuotes(quotesData);
                setClients(clientsData);
                setContracts(contractsData);
                setServices(servicesData);
                setQuickQuoteNumber(`QT-${Date.now().toString().slice(-6)}`);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Filtered Lists
    const filteredClients = useMemo(() => {
        return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
    }, [clients, clientSearch]);

    const filteredServices = useMemo(() => {
        return services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));
    }, [services, serviceSearch]);

    // KPIs
    const kpis = useMemo(() => {
        const acceptedQuotes = quotes.filter(q => q.status === 'Aceptada');
        const pendingQuotes = quotes.filter(q => q.status === 'Pendiente');

        const totalSales = acceptedQuotes.reduce((sum, q) => sum + q.total, 0);
        const totalPending = pendingQuotes.reduce((sum, q) => sum + q.total, 0);

        // Renewals
        const activeContracts = contracts.filter(c => c.status === 'active');
        const now = new Date();
        const renewalsThisMonth = activeContracts.filter(c => {
            const parts = c.nextRenewalDate.split('/');
            if (parts.length === 3) {
                const [, month, year] = parts;
                return parseInt(month) === now.getMonth() + 1 && parseInt(year) === now.getFullYear();
            }
            return false;
        }).length;

        return {
            totalSales,
            totalPending,
            activeContracts: activeContracts.length,
            renewalsThisMonth
        };
    }, [quotes, contracts]);

    // Upcoming Renewals
    const upcomingRenewals = useMemo(() => {
        return contracts
            .filter(c => c.status === 'active')
            .sort((a, b) => {
                const dateA = notificationService.parseDate(a.nextRenewalDate);
                const dateB = notificationService.parseDate(b.nextRenewalDate);
                return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
            })
            .slice(0, 5);
    }, [contracts]);

    // Status Data for Pie Chart
    const statusData = useMemo(() => {
        const distribution = {
            'Aceptada': 0,
            'Pendiente': 0,
            'Rechazada': 0
        };
        quotes.forEach(q => {
            if (distribution[q.status as keyof typeof distribution] !== undefined) {
                distribution[q.status as keyof typeof distribution]++;
            }
        });
        return [
            { name: 'Aceptada', value: distribution['Aceptada'] },
            { name: 'Pendiente', value: distribution['Pendiente'] },
            { name: 'Rechazada', value: distribution['Rechazada'] }
        ];
    }, [quotes]);

    // Handlers
    const handleQuickClient = async () => {
        if (!quickClientForm.name || !quickClientForm.ruc) {
            alert('Por favor complete al menos el nombre y RUC del cliente.');
            return;
        }

        const newClient: Client = {
            id: crypto.randomUUID(),
            code: quickClientForm.ruc.slice(-4),
            name: quickClientForm.name,
            ruc: quickClientForm.ruc,
            contact: quickClientForm.contact,
            phone: quickClientForm.phone,
            address: '',
            city: ''
        };

        try {
            await dataManager.saveClient(newClient);
            setClients(prev => [newClient, ...prev]);
            setQuickClientId(newClient.id);
            setClientSearch(newClient.name); // Update search input
            setQuickClientForm({ name: '', ruc: '', phone: '', contact: '' });
            setShowQuickClientModal(false);
            alert('Cliente creado con éxito.');
        } catch (error) {
            console.error(error);
            alert('Error al crear el cliente.');
        }
    };

    const selectClient = (client: Client) => {
        setQuickClientId(client.id);
        setClientSearch(client.name);
        setShowClientDropdown(false);
    };

    const handleQuickService = async () => {
        if (!quickServiceForm.name || !quickServiceForm.price) {
            alert('Por favor complete al menos el nombre y precio del servicio.');
            return;
        }

        const newService: Service = {
            id: crypto.randomUUID(),
            code: quickServiceForm.code || `SRV-${Date.now().toString().slice(-4)}`,
            name: quickServiceForm.name,
            description: quickServiceForm.name,
            price: parseFloat(quickServiceForm.price),
            category: quickServiceForm.category,
            cost: 0
        };

        try {
            await dataManager.saveService(newService);
            setServices(prev => [newService, ...prev]);
            setQuickServiceId(newService.id);
            setServiceSearch(newService.name); // Update search input
            setQuickServiceForm({ code: '', name: '', price: '', category: 'General' });
            setShowQuickServiceModal(false);
            alert('Producto/Servicio creado con éxito.');
        } catch (error) {
            console.error(error);
            alert('Error al crear el producto/servicio.');
        }
    };

    const selectService = (service: Service) => {
        setQuickServiceId(service.id);
        setServiceSearch(service.name);
        setShowServiceDropdown(false);
    };

    // Add item to quick quote
    const handleAddItem = () => {
        if (!quickServiceId) {
            alert('Por favor seleccione un servicio.');
            return;
        }

        const service = services.find(s => s.id === quickServiceId);
        if (!service) return;

        const newItem = {
            id: crypto.randomUUID(),
            serviceId: service.id,
            serviceName: service.name,
            quantity: 1,
            price: service.price
        };

        setQuickItems(prev => [...prev, newItem]);
        setQuickServiceId(''); // Clear selection
        setServiceSearch('');
    };

    // Remove item from quick quote
    const handleRemoveItem = (itemId: string) => {
        setQuickItems(prev => prev.filter(item => item.id !== itemId));
    };

    // Update item quantity
    const handleItemQuantityChange = (itemId: string, quantity: number) => {
        setQuickItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
        ));
    };

    // Calculate totals
    const quickTotals = useMemo(() => {
        const subtotal = quickItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const iva = subtotal * 0.15;
        const total = subtotal + iva;
        return { subtotal, iva, total };
    }, [quickItems]);

    const handleQuickQuote = async () => {
        if (!quickClientId || quickItems.length === 0) {
            alert('Por favor seleccione un cliente y agregue al menos un servicio.');
            return;
        }

        const client = clients.find(c => c.id === quickClientId);
        if (!client) return;

        const newQuote: Quote = {
            id: crypto.randomUUID(),
            number: quickQuoteNumber || `QT-${Date.now().toString().slice(-6)}`,
            client: client,
            issueDate: new Date().toLocaleDateString('es-ES'),
            validityDate: (() => {
                if (!quickValidity) return new Date().toLocaleDateString('es-ES');
                const [y, m, d] = quickValidity.split('-');
                return `${d}/${m}/${y}`;
            })(),
            items: quickItems.map(item => {
                const service = services.find(s => s.id === item.serviceId);
                return {
                    id: item.id,
                    name: item.serviceName,
                    description: service?.description || '',
                    price: item.price,
                    quantity: item.quantity,
                    code: service?.code || '',
                    category: service?.category || 'General',
                    cost: service?.cost || 0
                };
            }),
            subtotal: quickTotals.subtotal,
            iva: quickTotals.iva,
            total: quickTotals.total,
            status: 'Pendiente',
            notes: `Cotización rápida generada desde el Dashboard.`,
            companySettings: settings
        };

        try {
            await dataManager.saveQuote(newQuote);
            setQuotes(prev => [newQuote, ...prev]);
            setQuickItems([]);
            setQuickClientId('');
            setClientSearch('');
            setQuickQuoteNumber(`QT-${Date.now().toString().slice(-6)}`);
            alert('Cotización rápida creada con éxito.');
        } catch (error) {
            console.error(error);
            alert('Error al crear la cotización.');
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando escritorio...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Escritorio</h2>
                    <p className="text-gray-500">Resumen de actividad y accesos rápidos ({sourceLabel})</p>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Widgets */}
                <div className="lg:col-span-2 space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Ventas (Mes)</p>
                            <p className="text-2xl font-bold text-gray-800">${kpis.totalSales.toFixed(0)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Pendiente</p>
                            <p className="text-2xl font-bold text-orange-600">${kpis.totalPending.toFixed(0)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Contratos</p>
                            <p className="text-2xl font-bold text-indigo-600">{kpis.activeContracts}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Renovaciones</p>
                            <p className="text-2xl font-bold text-green-600">{kpis.renewalsThisMonth}</p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Estatus de Cotizaciones</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Próximas Renovaciones</h3>
                            <div className="overflow-y-auto max-h-64 space-y-3">
                                {upcomingRenewals.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8 text-sm">No hay renovaciones próximas.</p>
                                ) : (
                                    upcomingRenewals.map(c => (
                                        <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">{c.clientName}</p>
                                                <p className="text-xs text-gray-500">{c.serviceName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-indigo-600">{c.nextRenewalDate}</p>
                                                <p className="text-xs text-gray-500">${c.amount}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Quote */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Cotizar Rápido</h3>

                    <div className="space-y-4">
                        {/* Quote Number & Periodicity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                                <input
                                    type="text"
                                    value={quickQuoteNumber}
                                    onChange={(e) => setQuickQuoteNumber(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Validez</label>
                                <input
                                    type="date"
                                    value={quickValidity}
                                    onChange={(e) => setQuickValidity(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Client Selector with Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                            <div className="flex space-x-2 relative">
                                <div className="w-full relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        value={clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value);
                                            setQuickClientId('');
                                            setShowClientDropdown(true);
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                                    />
                                    {showClientDropdown && (
                                        <div className="absolute z-50 w-full bg-white border border-gray-300 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {filteredClients.map(c => (
                                                <div key={c.id} className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100" onClick={() => selectClient(c)}>
                                                    <div className="font-medium text-gray-900">{c.name}</div>
                                                    <div className="text-xs text-gray-500">{c.ruc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowQuickClientModal(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors"
                                >
                                    <i className="fas fa-user-plus"></i>
                                </button>
                            </div>
                        </div>

                        {/* Service Selector with Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Producto / Servicio</label>
                            <div className="flex space-x-2 relative mb-2">
                                <div className="w-full relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar servicio..."
                                        value={serviceSearch}
                                        onChange={(e) => {
                                            setServiceSearch(e.target.value);
                                            setQuickServiceId('');
                                            setShowServiceDropdown(true);
                                        }}
                                        onFocus={() => setShowServiceDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowServiceDropdown(false), 200)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
                                    />
                                    {showServiceDropdown && (
                                        <div className="absolute z-50 w-full bg-white border border-gray-300 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {filteredServices.map(s => (
                                                <div key={s.id} className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100" onClick={() => selectService(s)}>
                                                    <div className="font-medium text-gray-900">{s.name}</div>
                                                    <div className="text-xs flex justify-between text-gray-500"><span>{s.code}</span><span className="font-bold">${s.price}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowQuickServiceModal(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors"
                                >
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                            <button
                                onClick={handleAddItem}
                                disabled={!quickServiceId}
                                className="w-full mt-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wide transition-colors"
                                title="Agregar a la lista"
                                type="button"
                            >
                                AÑADIR
                            </button>
                        </div>

                        {/* Items List */}
                        {quickItems.length > 0 && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Permite modificar</span>
                                </div>
                                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-600">
                                        <div className="col-span-6">Servicio</div>
                                        <div className="col-span-2 text-center">Cant.</div>
                                        <div className="col-span-3 text-right">Precio</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {quickItems.map(item => (
                                        <div key={item.id} className="px-3 py-3 border-b border-gray-100 hover:bg-gray-50">
                                            <div className="grid grid-cols-12 gap-2 items-center">
                                                <div className="col-span-6 text-sm font-medium text-gray-800 truncate">
                                                    {item.serviceName}
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value))}
                                                        className="w-full p-1 text-center border border-gray-300 rounded text-sm bg-white text-gray-900"
                                                    />
                                                </div>
                                                <div className="col-span-3 text-sm font-bold text-gray-800 text-right">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="text-red-500 hover:text-red-700 transition"
                                                        title="Eliminar"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Totals Display */}
                        {quickItems.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-bold text-gray-800">${quickTotals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">IVA (15%):</span>
                                    <span className="font-bold text-gray-800">${quickTotals.iva.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base pt-2 border-t border-gray-300">
                                    <span className="font-bold text-gray-800">Total:</span>
                                    <span className="font-bold text-indigo-600 text-lg">${quickTotals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleQuickQuote}
                            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            Crear Cotización
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-4">
                            Se creará una cotización en estado "Pendiente".
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Client Modal */}
            {showQuickClientModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Nuevo Cliente Rápido</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nombre *"
                                value={quickClientForm.name}
                                onChange={(e) => setQuickClientForm({ ...quickClientForm, name: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                            />
                            <input
                                type="text"
                                placeholder="RUC/CI *"
                                value={quickClientForm.ruc}
                                onChange={(e) => setQuickClientForm({ ...quickClientForm, ruc: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                            />
                            <input
                                type="text"
                                placeholder="Teléfono"
                                value={quickClientForm.phone}
                                onChange={(e) => setQuickClientForm({ ...quickClientForm, phone: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={quickClientForm.contact}
                                onChange={(e) => setQuickClientForm({ ...quickClientForm, contact: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowQuickClientModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleQuickClient}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Service Modal */}
            {showQuickServiceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Nuevo Producto Rápido</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nombre *"
                                value={quickServiceForm.name}
                                onChange={(e) => setQuickServiceForm({ ...quickServiceForm, name: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                            />
                            <input
                                type="text"
                                placeholder="Código (Opcional)"
                                value={quickServiceForm.code}
                                onChange={(e) => setQuickServiceForm({ ...quickServiceForm, code: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                            />
                            <input
                                type="number"
                                placeholder="Precio *"
                                value={quickServiceForm.price}
                                onChange={(e) => setQuickServiceForm({ ...quickServiceForm, price: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                            />
                            <select
                                value={quickServiceForm.category}
                                onChange={(e) => setQuickServiceForm({ ...quickServiceForm, category: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                            >
                                <option value="General">General</option>
                                <option value="Hosting">Hosting</option>
                                <option value="Dominio">Dominio</option>
                                <option value="Desarrollo">Desarrollo</option>
                                <option value="Diseño">Diseño</option>
                                <option value="Marketing">Marketing</option>
                            </select>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowQuickServiceModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleQuickService}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
