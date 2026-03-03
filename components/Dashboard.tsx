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
    const [quickValidity, setQuickValidity] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
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
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
            {/* Header Liquid Glass */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

                <div>
                    <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-900 tracking-tight">
                        Escritorio
                    </h2>
                    <p className="text-gray-600 font-medium mt-1">Resumen de actividad y accesos rápidos</p>
                </div>
                <div className="text-sm font-medium text-indigo-900 bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/80 shadow-sm flex items-center gap-2">
                    <i className="far fa-calendar-alt text-indigo-500"></i>
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Widgets */}
                <div className="lg:col-span-2 space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {/* KPI: Ventas */}
                        <div className="bg-white/40 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-white/60 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl group-hover:bg-emerald-400/30 transition-colors"></div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-chart-line"></i>
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Ventas (Mes)</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-800">${kpis.totalSales.toFixed(0)}</p>
                        </div>

                        {/* KPI: Pendiente */}
                        <div className="bg-white/40 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-white/60 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl group-hover:bg-amber-400/30 transition-colors"></div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                                    <i className="far fa-clock"></i>
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Pendiente</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-800">${kpis.totalPending.toFixed(0)}</p>
                        </div>

                        {/* KPI: Contratos */}
                        <div className="bg-white/40 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-white/60 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl group-hover:bg-indigo-400/30 transition-colors"></div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-file-signature"></i>
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Contratos</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-800">{kpis.activeContracts}</p>
                        </div>

                        {/* KPI: Renovaciones */}
                        <div className="bg-white/40 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-white/60 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl group-hover:bg-pink-400/30 transition-colors"></div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-sync-alt"></i>
                                </div>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Renovaciones</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-800">{kpis.renewalsThisMonth}</p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Estatus Chart Liquid Glass */}
                        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/50 rounded-full blur-3xl -z-10"></div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <i className="fas fa-chart-pie text-indigo-500"></i>
                                Estatus de Cotizaciones
                            </h3>
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
                                            stroke="transparent"
                                        >
                                            {statusData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(12px)',
                                                borderRadius: '1rem',
                                                border: '1px solid rgba(255,255,255,0.6)',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Upcoming Renewals Liquid Glass */}
                        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-xl relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-200/50 rounded-full blur-3xl -z-10"></div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <i className="fas fa-calendar-alt text-rose-500"></i>
                                Próximas Renovaciones
                            </h3>
                            <div className="overflow-y-auto max-h-64 space-y-3 custom-scrollbar pr-2">
                                {upcomingRenewals.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                            <i className="far fa-calendar-check text-2xl"></i>
                                        </div>
                                        <p className="text-gray-500 font-medium">No hay renovaciones próximas.</p>
                                    </div>
                                ) : (
                                    upcomingRenewals.map(c => (
                                        <div key={c.id} className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-shadow">
                                            <div>
                                                <p className="font-bold text-sm text-gray-800 line-clamp-1">{c.clientName}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{c.serviceName}</p>
                                            </div>
                                            <div className="text-right ml-4 shrink-0">
                                                <p className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-500">{c.nextRenewalDate}</p>
                                                <p className="text-xs font-bold text-gray-700">${c.amount}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Quote */}
                {/* Right Column: Quick Quote Liquid Glass */}
                <div className="hidden md:flex bg-white/60 backdrop-blur-2xl p-6 lg:p-8 rounded-[2rem] border border-white/80 shadow-2xl relative overflow-hidden flex-col h-full">
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-indigo-400/30 to-rose-400/30 rounded-full blur-3xl -z-10"></div>

                    <h3 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-indigo-900 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <i className="fas fa-bolt"></i>
                        </div>
                        Cotizar Rápido
                    </h3>

                    <div className="space-y-5 flex-grow">
                        {/* Quote Number & Periodicity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Número</label>
                                <input
                                    type="text"
                                    value={quickQuoteNumber}
                                    onChange={(e) => setQuickQuoteNumber(e.target.value)}
                                    className="w-full p-3 border border-white/60 rounded-2xl text-sm bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Validez</label>
                                <input
                                    type="date"
                                    value={quickValidity}
                                    onChange={(e) => setQuickValidity(e.target.value)}
                                    className="w-full p-3 border border-white/60 rounded-2xl text-sm bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Client Selector with Search */}
                        <div className="relative z-20">
                            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Cliente</label>
                            <div className="flex space-x-2 relative">
                                <div className="w-full relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i className="fas fa-user-circle text-gray-400 group-focus-within:text-indigo-500 transition-colors"></i>
                                    </div>
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
                                        className="w-full p-3 pl-10 border border-white/60 rounded-2xl text-sm bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                                    />
                                    {showClientDropdown && (
                                        <div className="absolute z-50 w-full bg-white/90 backdrop-blur-2xl border border-white/60 mt-2 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-hidden">
                                            {filteredClients.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">No se encontraron clientes</div>
                                            ) : (
                                                filteredClients.map((c, i) => (
                                                    <div key={c.id} className={`p-3 cursor-pointer hover:bg-indigo-50 transition-colors ${i !== filteredClients.length - 1 ? 'border-b border-gray-100' : ''}`} onClick={() => selectClient(c)}>
                                                        <div className="font-bold text-gray-800">{c.name}</div>
                                                        <div className="text-xs text-indigo-500 font-medium">{c.ruc}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowQuickClientModal(true)}
                                    className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white w-12 rounded-2xl shadow-md transition-all flex items-center justify-center transform hover:scale-105"
                                    title="Nuevo Cliente"
                                >
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        {/* Service Selector with Search */}
                        <div className="relative z-10">
                            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Producto / Servicio</label>
                            <div className="flex space-x-2 relative mb-3">
                                <div className="w-full relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i className="fas fa-box-open text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i>
                                    </div>
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
                                        className="w-full p-3 pl-10 border border-white/60 rounded-2xl text-sm bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-sm"
                                    />
                                    {showServiceDropdown && (
                                        <div className="absolute z-50 w-full bg-white/90 backdrop-blur-2xl border border-white/60 mt-2 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-hidden">
                                            {filteredServices.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">No se encontraron productos</div>
                                            ) : (
                                                filteredServices.map((s, i) => (
                                                    <div key={s.id} className={`p-3 cursor-pointer hover:bg-emerald-50 transition-colors ${i !== filteredServices.length - 1 ? 'border-b border-gray-100' : ''}`} onClick={() => selectService(s)}>
                                                        <div className="font-bold text-gray-800">{s.name}</div>
                                                        <div className="text-xs flex justify-between items-center mt-1">
                                                            <span className="text-gray-500 px-2 py-0.5 bg-gray-100 rounded-md font-mono">{s.code}</span>
                                                            <span className="font-bold text-emerald-600">${s.price.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowQuickServiceModal(true)}
                                    className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white w-12 rounded-2xl shadow-md transition-all flex items-center justify-center transform hover:scale-105"
                                    title="Nuevo Servicio"
                                >
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                            <button
                                onClick={handleAddItem}
                                disabled={!quickServiceId}
                                className="w-full py-3 bg-white/70 hover:bg-white border border-indigo-200 text-indigo-700 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-widest shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                                type="button"
                            >
                                <i className="fas fa-level-down-alt"></i> AÑADIR A LA LISTA
                            </button>
                        </div>

                        {/* Items List */}
                        {quickItems.length > 0 && (
                            <div className="border border-white/60 bg-white/40 rounded-2xl overflow-hidden shadow-inner flex flex-col mt-4 max-h-[250px]">
                                <div className="bg-white/60 px-4 py-2 border-b border-white/60 backdrop-blur-md">
                                    <div className="grid grid-cols-12 gap-2 text-xs font-black text-indigo-900 uppercase tracking-widest">
                                        <div className="col-span-6">Ítem</div>
                                        <div className="col-span-2 text-center">Cant</div>
                                        <div className="col-span-3 text-right">Monto</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                </div>
                                <div className="overflow-y-auto custom-scrollbar flex-grow">
                                    {quickItems.map(item => (
                                        <div key={item.id} className="px-4 py-3 border-b border-white/40 hover:bg-white/60 transition-colors">
                                            <div className="grid grid-cols-12 gap-2 items-center">
                                                <div className="col-span-6 text-sm font-bold text-gray-800 line-clamp-2 leading-tight">
                                                    {item.serviceName}
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value))}
                                                        className="w-full p-1.5 text-center border border-white/80 rounded-lg text-sm bg-white/80 text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                </div>
                                                <div className="col-span-3 text-sm font-black text-gray-800 text-right">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <i className="fas fa-times text-xs"></i>
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
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-2xl border border-gray-200 shadow-sm mt-4 space-y-3">
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-gray-500 font-bold uppercase tracking-wider">Subtotal:</span>
                                    <span className="font-bold text-gray-800">${quickTotals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-gray-500 font-bold uppercase tracking-wider">IVA (15%):</span>
                                    <span className="font-bold text-gray-800">${quickTotals.iva.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-end pt-3 border-t border-gray-200">
                                    <span className="font-black text-gray-800 text-lg uppercase">Total:</span>
                                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500 text-3xl leading-none">
                                        ${quickTotals.total.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/60">
                        <button
                            onClick={handleQuickQuote}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white rounded-[1.5rem] font-black text-lg hover:from-pink-600 hover:via-red-600 hover:to-orange-600 transition-all shadow-[0_10px_20px_-10px_rgba(239,68,68,0.5)] hover:shadow-[0_15px_30px_-10px_rgba(239,68,68,0.7)] transform hover:-translate-y-1"
                        >
                            CREAR COTIZACIÓN
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Client Modal Liquid Glass */}
            {showQuickClientModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
                        <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <i className="fas fa-user-plus"></i>
                            </div>
                            Nuevo Cliente
                        </h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nombre *"
                                value={quickClientForm.name}
                                onChange={(e) => setQuickClientForm({ ...quickClientForm, name: e.target.value })}
                                className="w-full p-4 border border-white/60 rounded-2xl bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                            />
                            <input
                                type="text"
                                placeholder="RUC/CI *"
                                value={quickClientForm.ruc}
                                onChange={(e) => setQuickClientForm({ ...quickClientForm, ruc: e.target.value })}
                                className="w-full p-4 border border-white/60 rounded-2xl bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                            />
                            <input
                                type="text"
                                placeholder="Teléfono"
                                value={quickClientForm.phone}
                                onChange={(e) => setQuickClientForm({ ...quickClientForm, phone: e.target.value })}
                                className="w-full p-4 border border-white/60 rounded-2xl bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={quickClientForm.contact}
                                onChange={(e) => setQuickClientForm({ ...quickClientForm, contact: e.target.value })}
                                className="w-full p-4 border border-white/60 rounded-2xl bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                            />
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setShowQuickClientModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleQuickClient}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 transition-all"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Service Modal Liquid Glass */}
            {showQuickServiceModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
                        <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <i className="fas fa-box-open"></i>
                            </div>
                            Nuevo Producto
                        </h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nombre *"
                                value={quickServiceForm.name}
                                onChange={(e) => setQuickServiceForm({ ...quickServiceForm, name: e.target.value })}
                                className="w-full p-4 border border-white/60 rounded-2xl bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
                            />
                            <input
                                type="text"
                                placeholder="Código (Opcional)"
                                value={quickServiceForm.code}
                                onChange={(e) => setQuickServiceForm({ ...quickServiceForm, code: e.target.value })}
                                className="w-full p-4 border border-white/60 rounded-2xl bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
                            />
                            <input
                                type="number"
                                placeholder="Precio *"
                                value={quickServiceForm.price}
                                onChange={(e) => setQuickServiceForm({ ...quickServiceForm, price: e.target.value })}
                                className="w-full p-4 border border-white/60 rounded-2xl bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
                            />
                            <div className="relative">
                                <select
                                    value={quickServiceForm.category}
                                    onChange={(e) => setQuickServiceForm({ ...quickServiceForm, category: e.target.value })}
                                    className="w-full p-4 border border-white/60 rounded-2xl bg-white/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all appearance-none"
                                >
                                    <option value="General">General</option>
                                    <option value="Hosting">Hosting</option>
                                    <option value="Dominio">Dominio</option>
                                    <option value="Desarrollo">Desarrollo</option>
                                    <option value="Diseño">Diseño</option>
                                    <option value="Marketing">Marketing</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                    <i className="fas fa-chevron-down text-sm"></i>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setShowQuickServiceModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleQuickService}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
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
