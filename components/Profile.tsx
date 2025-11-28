import React, { useState, useEffect } from 'react';
import { dataManager } from '../services/dataManager';
import { sessionService } from '../services/sessionService';
import { deleteDatabase } from '../services/google';

interface ProfileProps {
    onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
    const [stats, setStats] = useState({
        clients: 0,
        services: 0,
        quotes: 0,
        contracts: 0
    });
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const session = sessionService.getSession();
    const mode = dataManager.getMode();

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [clients, services, quotes, contracts] = await Promise.all([
                    dataManager.fetchClients(),
                    dataManager.fetchServices(),
                    dataManager.fetchQuotes(),
                    dataManager.fetchContracts()
                ]);

                setStats({
                    clients: clients.length,
                    services: services.length,
                    quotes: quotes.length,
                    contracts: contracts.length
                });
            } catch (error) {
                console.error("Error loading stats:", error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    const handleDeleteData = async () => {
        if (!confirm("¿ESTÁS SEGURO? Esta acción eliminará permanentemente todos tus datos (Clientes, Servicios, Cotizaciones, Contratos). No se puede deshacer.")) {
            return;
        }

        if (mode === 'google') {
            if (!confirm("Se eliminará el archivo 'Super Cotizador - Base de Datos' de tu Google Drive. ¿Confirmar?")) {
                return;
            }
        }

        setIsDeleting(true);
        try {
            if (mode === 'google') {
                const spreadsheetId = sessionService.getSpreadsheetId();
                if (spreadsheetId) {
                    await deleteDatabase(spreadsheetId);
                }
            } else {
                localStorage.clear();
            }

            alert("Datos eliminados correctamente.");
            onLogout();
        } catch (error) {
            console.error("Error deleting data:", error);
            alert("Hubo un error al eliminar los datos. Por favor intenta de nuevo.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Perfil de Usuario</h2>

            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                        {session?.userEmail ? session.userEmail.charAt(0).toUpperCase() : <i className="fas fa-user"></i>}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {session?.userEmail || 'Usuario Local'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {mode === 'google' ? 'Conectado con Google Drive' : 'Almacenamiento Local'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Datos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                <StatCard
                    title="Clientes"
                    value={stats.clients}
                    icon="fa-users"
                    color="bg-blue-50 text-blue-600"
                    loading={loading}
                />
                <StatCard
                    title="Servicios"
                    value={stats.services}
                    icon="fa-concierge-bell"
                    color="bg-green-50 text-green-600"
                    loading={loading}
                />
                <StatCard
                    title="Cotizaciones"
                    value={stats.quotes}
                    icon="fa-file-invoice-dollar"
                    color="bg-purple-50 text-purple-600"
                    loading={loading}
                />
                <StatCard
                    title="Contratos"
                    value={stats.contracts}
                    icon="fa-file-contract"
                    color="bg-orange-50 text-orange-600"
                    loading={loading}
                />
            </div>

            {/* Danger Zone */}
            <div className="border border-red-200 rounded-xl overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                    <h3 className="text-red-800 font-semibold flex items-center">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Zona de Peligro
                    </h3>
                </div>
                <div className="p-6 bg-white">
                    <p className="text-gray-600 mb-4">
                        Si deseas eliminar toda tu información del sistema, puedes hacerlo aquí.
                        {mode === 'google'
                            ? " Esto eliminará el archivo de base de datos de tu Google Drive."
                            : " Esto borrará todos los datos almacenados en este navegador."}
                    </p>
                    <button
                        onClick={handleDeleteData}
                        disabled={isDeleting}
                        className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm font-medium flex items-center ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isDeleting ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Eliminando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-trash-alt mr-2"></i>
                                Eliminar todos mis datos
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string, value: number, icon: string, color: string, loading: boolean }> = ({ title, value, icon, color, loading }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            {loading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            )}
        </div>
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${color}`}>
            <i className={`fas ${icon} text-xl`}></i>
        </div>
    </div>
);

export default Profile;
