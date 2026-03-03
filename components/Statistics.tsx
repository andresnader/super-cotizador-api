
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
        <div className="statistics-container relative p-4 sm:p-6 lg:p-8 rounded-[2rem] print:shadow-none print:border-none print:p-0 print:bg-transparent min-h-screen">
            {/* Ambient Backgrounds for Glass Effect */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-2xl pointer-events-none z-0 no-print"></div>
            <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-blue-50/50 pointer-events-none -z-20 no-print"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl pointer-events-none -z-10 no-print"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl pointer-events-none -z-10 no-print"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Estadísticas <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">y Reportes</span>
                    </h2>
                </div>

                {/* Filters */}
                <div className="mb-8 p-5 sm:p-6 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-lg no-print hover:bg-white/50 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400"></div>
                    <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <i className="fas fa-sliders-h text-indigo-500"></i> Filtros y Controles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 group-focus-within:text-indigo-600 transition-colors">Fecha Inicio</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-3 text-sm bg-white/50 border border-white/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 group-focus-within:text-purple-600 transition-colors">Fecha Fin</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-3 text-sm bg-white/50 border border-white/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 group-focus-within:text-blue-600 transition-colors">Cliente</label>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full p-3 text-sm bg-white/50 border border-white/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="all">Todos</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 group-focus-within:text-teal-600 transition-colors">Producto/Servicio</label>
                            <select
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                className="w-full p-3 text-sm bg-white/50 border border-white/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none transition-all shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="all">Todos</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 group-focus-within:text-orange-600 transition-colors">Estado</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as any)}
                                className="w-full p-3 text-sm bg-white/50 border border-white/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none transition-all shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="all">Todas</option>
                                <option value="Aceptada">Aceptadas</option>
                                <option value="Pendiente">Pendientes</option>
                                <option value="Rechazada">Rechazadas</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/40">
                        <button onClick={resetFilters} className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold bg-white/60 hover:bg-white text-gray-700 rounded-xl hover:shadow-md transition-all border border-white/80 backdrop-blur-md flex items-center justify-center">
                            <i className="fas fa-redo mr-2 text-gray-500"></i> Limpiar
                        </button>
                        <button onClick={exportToCSV} className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center">
                            <i className="fas fa-file-csv mr-2"></i> CSV
                        </button>
                        <button onClick={exportToPDF} className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center">
                            <i className="fas fa-file-pdf mr-2"></i> PDF
                        </button>
                    </div>
                </div>

                {/* KPIs Grid */}
                <h3 className="text-xl font-bold text-gray-800 mb-4 ml-2">Métricas Principales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10 print:grid-cols-4">
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-600/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-xs sm:text-sm text-green-700 font-extrabold uppercase tracking-wider relative z-10">Ventas (Aceptadas)</p>
                        <p className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mt-2 relative z-10">${kpis.totalSales.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-xs sm:text-sm text-blue-700 font-extrabold uppercase tracking-wider relative z-10">Ticket Promedio</p>
                        <p className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mt-2 relative z-10">${kpis.avgTicket.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-fuchsia-600/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-xs sm:text-sm text-purple-700 font-extrabold uppercase tracking-wider relative z-10">Tasa Conversión</p>
                        <p className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600 mt-2 relative z-10">{kpis.conversionRate.toFixed(1)}%</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-amber-600/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-xs sm:text-sm text-orange-700 font-extrabold uppercase tracking-wider relative z-10">Total Pendiente</p>
                        <p className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 mt-2 relative z-10">${kpis.totalPending.toFixed(2)}</p>
                    </div>

                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-xs sm:text-sm text-yellow-700 font-extrabold uppercase tracking-wider relative z-10">Producto Top</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-500 mt-2 relative z-10 truncate px-2">{bestSeller}</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-violet-600/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-xs sm:text-sm text-indigo-700 font-extrabold uppercase tracking-wider relative z-10">Cotizaciones (Total)</p>
                        <p className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mt-2 relative z-10">{kpis.totalQuotes}</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-rose-600/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-xs sm:text-sm text-pink-700 font-extrabold uppercase tracking-wider relative z-10">Este Mes</p>
                        <p className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600 mt-2 relative z-10">{kpis.currentMonthQuotes}</p>
                    </div>
                    <div className={`bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all hover:-translate-y-1`}>
                        <div className={`absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-100 transition-opacity ${kpis.growthRate >= 0 ? 'from-teal-400/10 to-emerald-600/10' : 'from-red-400/10 to-rose-600/10'}`}></div>
                        <p className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider relative z-10 ${kpis.growthRate >= 0 ? 'text-teal-700' : 'text-red-700'}`}>Crecimiento</p>
                        <p className={`text-2xl sm:text-3xl md:text-4xl font-black mt-2 relative z-10 text-transparent bg-clip-text bg-gradient-to-r ${kpis.growthRate >= 0 ? 'from-teal-600 to-emerald-600' : 'from-red-600 to-rose-600'}`}>
                            {kpis.growthRate >= 0 ? '+' : ''}{kpis.growthRate.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Contract KPIs */}
                <h3 className="text-xl font-bold text-gray-800 mb-4 ml-2">Métricas de Contratos Recurrentes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10 print:grid-cols-4">
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-teal-500/10 opacity-50"></div>
                        <p className="text-xs sm:text-sm text-cyan-800 font-extrabold uppercase tracking-wider relative z-10">Activos</p>
                        <p className="text-2xl sm:text-3xl font-black text-cyan-600 mt-2 relative z-10">{kpis.activeContracts}</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-blue-500/10 opacity-50"></div>
                        <p className="text-xs sm:text-sm text-indigo-800 font-extrabold uppercase tracking-wider relative z-10">MRR Mensual</p>
                        <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-2 relative z-10">${kpis.mrr.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-amber-500/10 opacity-50"></div>
                        <p className="text-xs sm:text-sm text-orange-800 font-extrabold uppercase tracking-wider relative z-10">Renov. (Mes)</p>
                        <p className="text-2xl sm:text-3xl font-black text-orange-600 mt-2 relative z-10">{kpis.renewalsThisMonth}</p>
                    </div>
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] text-center border border-white/60 shadow-lg relative overflow-hidden group hover:bg-white/50 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-rose-500/10 opacity-50"></div>
                        <p className="text-xs sm:text-sm text-red-800 font-extrabold uppercase tracking-wider relative z-10">Alertas</p>
                        <p className="text-2xl sm:text-3xl font-black text-red-600 mt-2 relative z-10">{kpis.pendingAlerts}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mb-8 print:grid-cols-3">
                    {/* Sales by Month Chart */}
                    <div className="xl:col-span-2 h-96 bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-white/60 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                        <h3 className="text-xl font-extrabold mb-6 text-gray-800 flex items-center gap-2">
                            <i className="fas fa-chart-bar text-blue-500"></i> Ventas por Mes
                        </h3>
                        <div className="w-full h-[calc(100%-3rem)]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesByMonthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} />
                                    <Tooltip
                                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Ventas']}
                                        contentStyle={{ borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="sales" fill="url(#colorSales)" radius={[6, 6, 0, 0]} />
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={settings.accentColor} stopOpacity={0.8} />
                                            <stop offset="100%" stopColor={settings.accentColor} stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Upcoming Renewals Widget */}
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-white/60 shadow-lg h-96 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-400"></div>
                        <h3 className="text-xl font-extrabold mb-4 text-gray-800 flex items-center gap-2 shrink-0">
                            <i className="fas fa-bell text-yellow-500"></i> Próximas Renov.
                        </h3>
                        <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-3">
                            {upcomingRenewals.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                    <i className="fas fa-check-circle text-4xl mb-3 text-emerald-400 opacity-50"></i>
                                    <p className="font-medium">No hay renovaciones pendientes</p>
                                </div>
                            ) : (
                                upcomingRenewals.map(c => (
                                    <div key={c.id} className="p-4 bg-white/60 backdrop-blur-md rounded-[1.5rem] border border-white/80 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="overflow-hidden pr-2">
                                                <p className="font-bold text-gray-900 text-sm truncate">{c.clientName}</p>
                                                <p className="text-xs font-semibold text-indigo-600 truncate">{c.serviceName}</p>
                                            </div>
                                            <span className="shrink-0 text-xs font-black text-white bg-gradient-to-r from-orange-400 to-red-400 px-2.5 py-1 rounded-full shadow-sm">
                                                {c.nextRenewalDate}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100/50 px-2 py-0.5 rounded-lg">
                                                {c.period === 'monthly' ? 'Mensual' :
                                                    c.period === 'quarterly' ? 'Trimestral' :
                                                        c.period === 'semiannual' ? 'Semestral' :
                                                            c.period === 'annual' ? 'Anual' : c.period}
                                            </span>
                                            <span className="font-extrabold text-gray-800 text-sm">${c.amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Products and Clients */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 print:grid-cols-2">
                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-white/60 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                        <h3 className="text-xl font-extrabold mb-6 text-gray-800 flex items-center gap-2">
                            <i className="fas fa-trophy text-emerald-500"></i> Top 5 Productos
                        </h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProductsData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} />
                                    <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12, fontWeight: 700 }} />
                                    <Tooltip
                                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Ventas']}
                                        contentStyle={{ borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.4)' }}
                                    />
                                    <Bar dataKey="value" fill="url(#colorProducts)" radius={[0, 6, 6, 0]} />
                                    <defs>
                                        <linearGradient id="colorProducts" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#34d399" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-white/60 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-fuchsia-400"></div>
                        <h3 className="text-xl font-extrabold mb-6 text-gray-800 flex items-center gap-2">
                            <i className="fas fa-users text-purple-500"></i> Top 5 Clientes
                        </h3>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topClientsData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} />
                                    <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12, fontWeight: 700 }} />
                                    <Tooltip
                                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Ventas']}
                                        contentStyle={{ borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.4)' }}
                                    />
                                    <Bar dataKey="value" fill="url(#colorClients)" radius={[0, 6, 6, 0]} />
                                    <defs>
                                        <linearGradient id="colorClients" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#a78bfa" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-white/60 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-300 via-gray-400 to-zinc-300"></div>
                    <h3 className="text-xl font-extrabold mb-6 text-gray-800 flex items-center gap-2">
                        <i className="fas fa-chart-pie text-gray-600"></i> Distribución por Estado
                    </h3>
                    <div className="flex justify-center items-center w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={120}
                                    innerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
