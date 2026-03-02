import React, { useState } from 'react';
import { dataManager } from '../../services/dataManager';
import { generateClientTemplate, generateServiceTemplate, parseClientsCSV, parseServicesCSV } from '../../services/csvService';
import { exportAllData, importAllData } from '../../services/storage';
import { importAllToFirestore } from '../../services/firestore';

const DataManager: React.FC = () => {
    const [isImporting, setIsImporting] = useState(false);
    const mode = dataManager.getMode();

    const handleClientTemplateDownload = () => {
        generateClientTemplate();
    };

    const handleServiceTemplateDownload = () => {
        generateServiceTemplate();
    };

    const handleClientCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const clients = await parseClientsCSV(file);

            if (confirm(`¿Importar ${clients.length} clientes? Esto agregará nuevos registros.`)) {
                for (const client of clients) {
                    await dataManager.saveClient(client);
                }
                alert(`✓ Se importaron ${clients.length} clientes exitosamente`);
            }
        } catch (error: any) {
            alert(`Error al importar: ${error.message}`);
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    const handleServiceCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const services = await parseServicesCSV(file);

            if (confirm(`¿Importar ${services.length} servicios? Esto agregará nuevos registros.`)) {
                for (const service of services) {
                    await dataManager.saveService(service);
                }
                alert(`✓ Se importaron ${services.length} servicios exitosamente`);
            }
        } catch (error: any) {
            alert(`Error al importar: ${error.message}`);
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    const handleExportJSON = async () => {
        try {
            const data = await exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            alert('✓ Exportación completada');
        } catch (error: any) {
            alert(`Error al exportar: ${error.message}`);
        }
    };

    const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('⚠️ ADVERTENCIA: Esto reemplazará TODOS tus datos actuales. ¿Estás seguro?')) {
            e.target.value = '';
            return;
        }

        setIsImporting(true);
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            await importAllData(data);
            alert('✓ Importación completada. Recarga la página para ver los cambios.');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            alert(`Error al importar: ${error.message}`);
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    const handleFirebaseImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('¿Importar todos los datos de este archivo a Firebase? Esto reemplazará datos existentes con los mismos IDs.')) {
            e.target.value = '';
            return;
        }

        setIsImporting(true);
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            const result = await importAllToFirestore(data);
            alert(
                `✓ Importación a Firebase completada:\n` +
                `- ${result.clients} clientes\n` +
                `- ${result.services} servicios\n` +
                `- ${result.quotes} cotizaciones\n` +
                `- ${result.contracts} contratos\n` +
                `- Configuración: ${result.settings ? 'Sí' : 'No'}\n\n` +
                `Recarga la página para ver los cambios.`
            );
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            alert(`Error al importar: ${error.message}`);
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Firebase info banner */}
            {mode === 'firebase' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-center">
                        <i className="fas fa-cloud text-indigo-600 mr-3 text-lg"></i>
                        <div>
                            <h3 className="font-semibold text-indigo-800">Datos sincronizados en la nube</h3>
                            <p className="text-sm text-indigo-600">Tus datos se guardan automáticamente en Firebase Firestore.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Firebase Import Section */}
            {mode === 'firebase' && (
                <div className="bg-white rounded-xl border border-indigo-200 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                        <i className="fas fa-cloud-upload-alt text-indigo-600 mr-2"></i>
                        Importar Datos a Firebase
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Sube un archivo JSON de backup para migrar todos tus datos (clientes, servicios, cotizaciones, contratos) a Firebase.
                    </p>
                    <label className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold cursor-pointer">
                        <i className="fas fa-file-import mr-2"></i>
                        Seleccionar archivo JSON
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFirebaseImportJSON}
                            disabled={isImporting}
                            className="hidden"
                        />
                    </label>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Importación Masiva (CSV)</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Clientes */}
                    <div className="border border-gray-200 rounded-lg p-5">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-users text-blue-600 mr-2"></i>
                            Clientes
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleClientTemplateDownload}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm flex items-center justify-center"
                            >
                                <i className="fas fa-download mr-2 text-blue-600"></i>
                                Descargar Plantilla
                            </button>
                            <label className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center justify-center cursor-pointer">
                                <i className="fas fa-file-csv mr-2"></i>
                                Seleccionar CSV
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleClientCSVImport}
                                    disabled={isImporting}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Servicios */}
                    <div className="border border-gray-200 rounded-lg p-5">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-concierge-bell text-green-600 mr-2"></i>
                            Servicios
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleServiceTemplateDownload}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm flex items-center justify-center"
                            >
                                <i className="fas fa-download mr-2 text-green-600"></i>
                                Descargar Plantilla
                            </button>
                            <label className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center justify-center cursor-pointer">
                                <i className="fas fa-file-csv mr-2"></i>
                                Seleccionar CSV
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleServiceCSVImport}
                                    disabled={isImporting}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* JSON Backup Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Gestión de Datos (Backup)</h2>
                <p className="text-sm text-gray-600 mb-6">
                    Exporte o importe todos los datos (clientes, servicios, historial) en formato JSON para copias de seguridad.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={handleExportJSON}
                        className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-semibold flex items-center justify-center"
                    >
                        <i className="fas fa-download mr-2"></i>
                        Exportar JSON
                    </button>

                    <label className="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-semibold flex items-center justify-center cursor-pointer">
                        <i className="fas fa-upload mr-2"></i>
                        Importar JSON
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportJSON}
                            disabled={isImporting}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            {isImporting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-700 font-medium">Procesando...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataManager;
