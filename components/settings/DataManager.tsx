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
        <div className="space-y-8">
            {/* Firebase info banner */}
            {mode === 'firebase' && (
                <div className="bg-indigo-50/50 backdrop-blur-md border border-indigo-200/50 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center">
                        <i className="fas fa-cloud text-indigo-500 mr-4 text-xl"></i>
                        <div>
                            <h3 className="font-bold text-indigo-900 mb-1">Datos sincronizados en la nube</h3>
                            <p className="text-sm font-medium text-indigo-700/80">Tus datos se guardan automáticamente en Firebase Firestore.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Firebase Import Section */}
            {mode === 'firebase' && (
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 lg:p-8 rounded-[2rem] shadow-sm">
                    <h2 className="text-xl font-extrabold text-slate-800 mb-2 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800">
                        <i className="fas fa-cloud-upload-alt text-indigo-600 mr-3"></i>
                        Importar Datos a Firebase
                    </h2>
                    <p className="text-sm font-medium text-slate-600 mb-6">
                        Sube un archivo JSON de backup para migrar todos tus datos (clientes, servicios, cotizaciones, contratos) a Firebase.
                    </p>
                    <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-bold cursor-pointer shadow-sm">
                        <i className="fas fa-file-import mr-3"></i>
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

            <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 lg:p-8 rounded-[2rem] shadow-sm">
                <h2 className="text-2xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800">Importación Masiva (CSV)</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Clientes */}
                    <div className="bg-white/50 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-5 flex items-center text-lg">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mr-3 text-blue-600 shadow-inner">
                                <i className="fas fa-users"></i>
                            </div>
                            Clientes
                        </h3>
                        <div className="space-y-4">
                            <button
                                onClick={handleClientTemplateDownload}
                                className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl hover:bg-white/80 transition-all text-sm font-bold text-slate-700 shadow-sm flex items-center justify-center"
                            >
                                <i className="fas fa-download mr-2 text-blue-600"></i>
                                Descargar Plantilla
                            </button>
                            <label className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all text-sm font-bold flex items-center justify-center cursor-pointer shadow-sm">
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
                    <div className="bg-white/50 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-5 flex items-center text-lg">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center mr-3 text-emerald-600 shadow-inner">
                                <i className="fas fa-concierge-bell"></i>
                            </div>
                            Servicios
                        </h3>
                        <div className="space-y-4">
                            <button
                                onClick={handleServiceTemplateDownload}
                                className="w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl hover:bg-white/80 transition-all text-sm font-bold text-slate-700 shadow-sm flex items-center justify-center"
                            >
                                <i className="fas fa-download mr-2 text-emerald-600"></i>
                                Descargar Plantilla
                            </button>
                            <label className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all text-sm font-bold flex items-center justify-center cursor-pointer shadow-sm">
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
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 lg:p-8 rounded-[2rem] shadow-sm">
                <h2 className="text-2xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800">Gestión de Datos (Backup)</h2>
                <p className="text-sm font-medium text-slate-600 mb-8">
                    Exporte o importe todos los datos (clientes, servicios, historial) en formato JSON para copias de seguridad.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={handleExportJSON}
                        className="px-6 py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-900 hover:shadow-lg hover:shadow-slate-800/20 transition-all font-bold flex items-center justify-center shadow-sm"
                    >
                        <i className="fas fa-download mr-3"></i>
                        Exportar JSON
                    </button>

                    <label className="px-6 py-4 bg-white/60 backdrop-blur-md border border-slate-300 text-slate-700 rounded-xl hover:bg-white/80 hover:shadow-md transition-all font-bold flex items-center justify-center cursor-pointer shadow-sm">
                        <i className="fas fa-upload mr-3 text-slate-500"></i>
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all">
                    <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-10 text-center shadow-2xl border border-white/50 animate-in fade-in zoom-in duration-300">
                        <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-100 border-t-indigo-600 mx-auto mb-6 shadow-sm"></div>
                        <p className="text-indigo-900 font-bold text-lg">Procesando...</p>
                        <p className="text-slate-500 text-sm mt-2 font-medium">Por favor, espera un momento</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataManager;
