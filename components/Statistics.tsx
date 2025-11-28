
import React, { useState, useEffect, useMemo } from 'react';
import { Quote, CompanySettings, Client, Service, RecurringContract } from '../types';
import { dataManager } from '../services/dataManager';
import { notificationService } from '../services/notificationService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface StatisticsProps {
    settings: CompanySettings;
}

const Statistics: React.FC<StatisticsProps> = ({ settings }) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [contracts, setContracts] = useState<RecurringContract[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedClient, setSelectedClient] = useState('all');
    const [selectedService, setSelectedService] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState<'all' | Quote['status']>('all');

    const mode = dataManager.getMode();
    const sourceLabel = mode === 'google' ? 'Drive' : 'Local';

    useEffect(() => {
        const load = async () => {
            try {
                const [quotesData, clientsData, servicesData, contractsData] = await Promise.all([
                    dataManager.fetchQuotes(),
                    dataManager.fetchClients(),
                    dataManager.fetchServices(),
                    dataManager.fetchContracts()
                ]);
                setQuotes(quotesData);
                setClients(clientsData);
                setServices(servicesData);
                setContracts(contractsData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Filter quotes based on selected filters
    const filteredQuotes = useMemo(() => {
        return quotes.filter(q => {
            // Date filter
            if (startDate || endDate) {
                const quoteDateParts = q.issueDate?.split('/');
                if (quoteDateParts && quoteDateParts.length === 3) {
                    const [day, month, year] = quoteDateParts;
                    const quoteDate = new Date(`${year}-${month}-${day}`);

                    if (startDate && quoteDate < new Date(startDate)) return false;
                    if (endDate && quoteDate > new Date(endDate)) return false;
                }
            }

            // Client filter
            if (selectedClient !== 'all' && q.client.id !== selectedClient) return false;

            // Service filter
            if (selectedService !== 'all' && !q.items.some(item => item.id === selectedService)) return false;

            // Status filter
            if (selectedStatus !== 'all' && q.status !== selectedStatus) return false;

            return true;
        });
    }, [quotes, startDate, endDate, selectedClient, selectedService, selectedStatus]);

    // KPIs calculation
    const kpis = useMemo(() => {
        const acceptedQuotes = filteredQuotes.filter(q => q.status === 'Aceptada');
        const pendingQuotes = filteredQuotes.filter(q => q.status === 'Pendiente');

        const totalSales = acceptedQuotes.reduce((sum, q) => sum + q.total, 0);
        const totalPending = pendingQuotes.reduce((sum, q) => sum + q.total, 0);
        const avgTicket = acceptedQuotes.length ? totalSales / acceptedQuotes.length : 0;
        const conversionRate = filteredQuotes.length ? (acceptedQuotes.length / filteredQuotes.length) * 100 : 0;

        // Current month quotes
        const now = new Date();
        const currentMonth = filteredQuotes.filter(q => {
            const parts = q.issueDate?.split('/');
            if (parts && parts.length === 3) {
                const [, month, year] = parts;
                return parseInt(month) === now.getMonth() + 1 && parseInt(year) === now.getFullYear();
            }
            return false;
        });

        // Previous month for growth calculation
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthQuotes = quotes.filter(q => {
            const parts = q.issueDate?.split('/');
            if (parts && parts.length === 3) {
                const [, month, year] = parts;
                return parseInt(month) === prevMonth.getMonth() + 1 && parseInt(year) === prevMonth.getFullYear();
            }
            return false;
        }).filter(q => q.status === 'Aceptada');

        const currentMonthSales = currentMonth.filter(q => q.status === 'Aceptada').reduce((sum, q) => sum + q.total, 0);
        const prevMonthSales = prevMonthQuotes.reduce((sum, q) => sum + q.total, 0);
        const growthRate = prevMonthSales ? ((currentMonthSales - prevMonthSales) / prevMonthSales) * 100 : 0;

        // Contract KPIs
        const activeContracts = contracts.filter(c => c.status === 'active');
        const mrr = activeContracts.reduce((sum, c) => {
            let monthlyAmount = 0;
            switch (c.period) {
                case 'monthly': monthlyAmount = c.amount; break;
                case 'quarterly': monthlyAmount = c.amount / 3; break;
                case 'semiannual': monthlyAmount = c.amount / 6; break;
                case 'annual': monthlyAmount = c.amount / 12; break;
            }
            return sum + monthlyAmount;
        }, 0);

        const renewalsThisMonth = activeContracts.filter(c => {
            const parts = c.nextRenewalDate.split('/');
            if (parts.length === 3) {
                const [, month, year] = parts;
                return parseInt(month) === now.getMonth() + 1 && parseInt(year) === now.getFullYear();
            }
            return false;
        }).length;

        const pendingAlerts = notificationService.checkUpcomingRenewals(contracts).length;

        return {
            totalSales,
            avgTicket,
            conversionRate,
            totalPending,
            totalQuotes: filteredQuotes.length,
            currentMonthQuotes: currentMonth.length,
            growthRate,
            activeContracts: activeContracts.length,
            mrr,
            renewalsThisMonth,
            pendingAlerts
        };
    }, [filteredQuotes, quotes, contracts]);

    // Best selling product
    const bestSeller = useMemo(() => {
        const acceptedQuotes = filteredQuotes.filter(q => q.status === 'Aceptada');
        const salesByProduct: Record<string, number> = {};
        acceptedQuotes.forEach(q => {
            (q.items || []).forEach(i => {
                salesByProduct[i.name] = (salesByProduct[i.name] || 0) + (i.quantity || 1);
            });
        });
        return Object.entries(salesByProduct).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    }, [filteredQuotes]);

    // Chart data
    const salesByMonthData = useMemo(() => {
        const acceptedQuotes = filteredQuotes.filter(q => q.status === 'Aceptada');
        const salesByMonth: Record<string, number> = {};
        acceptedQuotes.forEach(q => {
            if (!q.issueDate) return;
            const parts = q.issueDate.split('/');
            if (parts.length === 3) {
                const [, month, year] = parts;
                const key = `${year}-${month.padStart(2, '0')}`;
                salesByMonth[key] = (salesByMonth[key] || 0) + q.total;
            }
        });

        return Object.keys(salesByMonth).sort().map(k => ({
            name: k,
            sales: salesByMonth[k]
        }));
    }, [filteredQuotes]);

    // Top 5 products
    const topProductsData = useMemo(() => {
        const acceptedQuotes = filteredQuotes.filter(q => q.status === 'Aceptada');
        const productSales: Record<string, number> = {};
        acceptedQuotes.forEach(q => {
            (q.items || []).forEach(i => {
                productSales[i.name] = (productSales[i.name] || 0) + (i.price * i.quantity);
            });
        });

        return Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
    }, [filteredQuotes]);

    // Top 5 clients
    const topClientsData = useMemo(() => {
        const acceptedQuotes = filteredQuotes.filter(q => q.status === 'Aceptada');
        const clientSales: Record<string, number> = {};
        acceptedQuotes.forEach(q => {
            clientSales[q.client.name] = (clientSales[q.client.name] || 0) + q.total;
        });

        return Object.entries(clientSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
    }, [filteredQuotes]);

    // Upcoming Renewals Widget
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

    // Status distribution
    const statusData = useMemo(() => {
        const distribution = {
            'Aceptada': 0,
            'Pendiente': 0,
            'Rechazada': 0
        };

        filteredQuotes.forEach(q => {
            distribution[q.status] = (distribution[q.status] || 0) + 1;
        });

        return [
            { name: 'Aceptada', value: distribution['Aceptada'] },
            { name: 'Pendiente', value: distribution['Pendiente'] },
            { name: 'Rechazada', value: distribution['Rechazada'] }
        ];
    }, [filteredQuotes]);

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Número', 'Cliente', 'Fecha', 'Total', 'Estado'];
        const rows = filteredQuotes.map(q => [
            q.number,
            q.client.name,
            q.issueDate,
            q.total.toFixed(2),
            q.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export to PDF (using screenshot)
    const exportToPDF = async () => {
        const dashboardElement = document.querySelector('.statistics-container');
        if (!dashboardElement) {
            alert('Error: No se pudo encontrar el contenedor de estadísticas');
            return;
        }

        try {
            // Show loading
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            loadingDiv.innerHTML = '<div class="bg-white p-6 rounded-xl"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div><p class="text-gray-700">Generando PDF...</p></div>';
            document.body.appendChild(loadingDiv);

            // Capture screenshot
            const canvas = await html2canvas(dashboardElement as HTMLElement, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Convert to PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`estadisticas_${new Date().toISOString().slice(0, 10)}.pdf`);

            // Remove loading
            document.body.removeChild(loadingDiv);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF');
        }
    };

    // Reset filters
    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedClient('all');
        setSelectedService('all');
        setSelectedStatus('all');
    };

    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    if (loading) return <div className="p-8 text-center">Cargando estadísticas...</div>;

    return (
        <div className="statistics-container bg-white p-6 rounded-xl shadow-lg border border-gray-100 print:shadow-none print:border-none print:p-0">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Estadísticas y Reportes ({sourceLabel})</h2>

            {/* Filters */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 no-print">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Fecha Inicio</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2 text-sm border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Fecha Fin</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2 text-sm border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Cliente</label>
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="w-full p-2 text-sm border rounded-lg"
                        >
                            <option value="all">Todos</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Producto/Servicio</label>
                        <select
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className="w-full p-2 text-sm border rounded-lg"
                        >
                            <option value="all">Todos</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Estado</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as any)}
                            className="w-full p-2 text-sm border rounded-lg"
                        >
                            <option value="all">Todas</option>
                            <option value="Aceptada">Aceptadas</option>
                            <option value="Pendiente">Pendientes</option>
                            <option value="Rechazada">Rechazadas</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                    <button onClick={resetFilters} className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        <i className="fas fa-redo mr-2"></i>Limpiar Filtros
                    </button>
                    <button onClick={exportToCSV} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i className="fas fa-file-csv mr-2"></i>Exportar CSV
                    </button>
                    <button onClick={exportToPDF} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <i className="fas fa-file-pdf mr-2"></i>Exportar PDF
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:grid-cols-4">
                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                    <p className="text-xs text-green-800 font-semibold uppercase">Ventas (Aceptadas)</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-600">${kpis.totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                    <p className="text-xs text-blue-800 font-semibold uppercase">Ticket Promedio</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">${kpis.avgTicket.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100">
                    <p className="text-xs text-purple-800 font-semibold uppercase">Tasa Conversión</p>
                    <p className="text-2xl md:text-3xl font-bold text-purple-600">{kpis.conversionRate.toFixed(1)}%</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
                    <p className="text-xs text-orange-800 font-semibold uppercase">Total Pendiente</p>
                    <p className="text-2xl md:text-3xl font-bold text-orange-600">${kpis.totalPending.toFixed(2)}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-100">
                    <p className="text-xs text-yellow-800 font-semibold uppercase">Producto Top</p>
                    <p className="text-lg md:text-xl font-bold text-yellow-600 truncate">{bestSeller}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-100">
                    <p className="text-xs text-indigo-800 font-semibold uppercase">Cotizaciones Totales</p>
                    <p className="text-2xl md:text-3xl font-bold text-indigo-600">{kpis.totalQuotes}</p>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg text-center border border-pink-100">
                    <p className="text-xs text-pink-800 font-semibold uppercase">Este Mes</p>
                    <p className="text-2xl md:text-3xl font-bold text-pink-600">{kpis.currentMonthQuotes}</p>
                </div>
                <div className={`${kpis.growthRate >= 0 ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100'} p-4 rounded-lg text-center border`}>
                    <p className={`text-xs font-semibold uppercase ${kpis.growthRate >= 0 ? 'text-teal-800' : 'text-red-800'}`}>Crecimiento</p>
                    <p className={`text-2xl md:text-3xl font-bold ${kpis.growthRate >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                        {kpis.growthRate >= 0 ? '+' : ''}{kpis.growthRate.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Contract KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:grid-cols-4">
                <div className="bg-teal-50 p-4 rounded-lg text-center border border-teal-100">
                    <p className="text-xs text-teal-800 font-semibold uppercase">Contratos Activos</p>
                    <p className="text-2xl md:text-3xl font-bold text-teal-600">{kpis.activeContracts}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-100">
                    <p className="text-xs text-indigo-800 font-semibold uppercase">MRR (Mensual)</p>
                    <p className="text-2xl md:text-3xl font-bold text-indigo-600">${kpis.mrr.toFixed(2)}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
                    <p className="text-xs text-orange-800 font-semibold uppercase">Renovaciones (Mes)</p>
                    <p className="text-2xl md:text-3xl font-bold text-orange-600">{kpis.renewalsThisMonth}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100">
                    <p className="text-xs text-red-800 font-semibold uppercase">Alertas Pendientes</p>
                    <p className="text-2xl md:text-3xl font-bold text-red-600">{kpis.pendingAlerts}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 print:grid-cols-3">
                {/* Sales by Month Chart */}
                <div className="lg:col-span-2 h-80 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Ventas por Mes</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesByMonthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                            <Bar dataKey="sales" fill={settings.accentColor} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Upcoming Renewals Widget */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm h-80 overflow-y-auto print:h-auto print:overflow-visible print:shadow-none">
                    <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                        <i className="fas fa-bell text-yellow-500 mr-2"></i> Próximas Renovaciones
                    </h3>
                    {upcomingRenewals.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No hay renovaciones próximas.</p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingRenewals.map(c => (
                                <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{c.clientName}</p>
                                            <p className="text-xs text-gray-500">{c.serviceName}</p>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                            {c.nextRenewalDate}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-xs text-gray-500 capitalize">{c.period}</span>
                                        <span className="font-bold text-gray-700 text-sm">${c.amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Products and Clients */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 print:grid-cols-2">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Top 5 Productos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topProductsData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={150} />
                            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                            <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Top 5 Clientes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topClientsData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={150} />
                            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                            <Bar dataKey="value" fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold mb-4 text-gray-700">Distribución por Estado</h3>
                <div className="flex justify-center items-center">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
