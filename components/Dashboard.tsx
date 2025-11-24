import React, { useState, useEffect } from 'react';
import { getQuotes } from '../services/storage';
import { Quote, CompanySettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
    settings: CompanySettings;
}

const Dashboard: React.FC<DashboardProps> = ({ settings }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  
  useEffect(() => {
    setQuotes(getQuotes());
  }, []);

  const acceptedQuotes = quotes.filter(q => q.status === 'Aceptada');
  const totalSales = acceptedQuotes.reduce((sum, q) => sum + q.total, 0);
  const avgTicket = acceptedQuotes.length ? totalSales / acceptedQuotes.length : 0;
  
  // Best seller
  const salesByProduct: Record<string, number> = {};
  acceptedQuotes.forEach(q => {
    q.items.forEach(i => {
      salesByProduct[i.name] = (salesByProduct[i.name] || 0) + i.quantity;
    });
  });
  const bestSeller = Object.entries(salesByProduct).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  // Chart Data
  const salesByMonth: Record<string, number> = {};
  acceptedQuotes.forEach(q => {
      // Date format is DD/MM/YYYY
      const [day, month, year] = q.issueDate.split('/');
      const key = `${year}-${month}`;
      salesByMonth[key] = (salesByMonth[key] || 0) + q.total;
  });
  
  const chartData = Object.keys(salesByMonth).sort().map(k => ({
      name: k,
      sales: salesByMonth[k]
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard de Ventas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                <p className="text-sm text-green-800 font-semibold uppercase">Ventas (Aceptadas)</p>
                <p className="text-3xl font-bold text-green-600">${totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                <p className="text-sm text-blue-800 font-semibold uppercase">Ticket Promedio</p>
                <p className="text-3xl font-bold text-blue-600">${avgTicket.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-100">
                <p className="text-sm text-yellow-800 font-semibold uppercase">Producto Top</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600 truncate">{bestSeller}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-100">
                <p className="text-sm text-indigo-800 font-semibold uppercase">Cotizaciones Totales</p>
                <p className="text-3xl font-bold text-indigo-600">{quotes.length}</p>
            </div>
        </div>

        <div className="h-80 w-full bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Ventas por Mes</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Bar dataKey="sales" fill={settings.accentColor} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default Dashboard;