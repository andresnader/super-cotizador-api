import React, { useState } from 'react';
import { dataManager } from '../../services/dataManager';
import { sessionService } from '../../services/sessionService';
import { initializeUserDatabase } from '../../services/google';
import { generateClientTemplate, generateServiceTemplate, parseClientsCSV, parseServicesCSV } from '../../services/csvService';
import { exportAllData, importAllData } from '../../services/storage';

const DataManager: React.FC = () => {
    const [isImporting, setIsImporting] = useState(false);
    const [currentSheetId] = useState(sessionService.getSpreadsheetId() || '');
    const [newSheetId, setNewSheetId] = useState('');
    const [switchSheetId, setSwitchSheetId] = useState('');
    const mode = dataManager.getMode();

    const handleCopyId = () => {
        navigator.clipboard.writeText(currentSheetId);
        alert('ID copiado al portapapeles');
    };

    const handleOpenDrive = () => {
        window.open(`https://docs.google.com/spreadsheets/d/${currentSheetId}`, '_blank');
    };

    const handleCreateNewDb = async () => {
        if (confirm('¿Crear una nueva base de datos vacía? Se desconectará de la actual y se creará una hoja nueva en tu Drive.')) {
            try {
                const newId = await initializeUserDatabase();
                sessionService.saveSpreadsheetId(newId);
                alert('Nueva base de datos creada. Recargando...');
                window.location.reload();
            } catch (e: any) {
                alert('Error: ' + e.message);
            }
        }
    };

    const handleSwitchDb = async () => {
        if (!switchSheetId.trim()) return;

        if (confirm('¿Cambiar a esta base de datos? Se recargará la página.')) {
            sessionService.saveSpreadsheetId(switchSheetId.trim());
            alert('Base de datos actualizada. Recargando...');
            window.location.reload();
        }
    };

    const handleImportDb = async () => {
        if (!newSheetId.trim()) return;

        if (confirm('¿Importar clientes y servicios de esta base de datos? Se agregarán los registros nuevos.')) {
            setIsImporting(true);
            try {
                const result = await dataManager.importFromSpreadsheet(newSheetId.trim());
                alert(`✓ Importación exitosa:\n- ${result.clients} clientes nuevos\n- ${result.services} servicios nuevos`);
                setNewSheetId('');
            } catch (error: any) {
                console.error(error);
                alert('Error al importar. Asegúrate de tener permiso de LECTURA en la hoja de origen.');
            } finally {
                setIsImporting(false);
            }
        }
    };

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

    return (
        <div className="space-y-6">
            {/* Google Drive Connection Section */}
            {mode === 'google' && (
                <div className="bg-white rounded-xl border border-indigo-200 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                        <i className="fab fa-google-drive text-indigo-600 mr-2"></i>
                        Conexión Google Drive
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Gestiona la conexión con tu hoja de cálculo de Google Sheets.
                    </p>

                    <div className="space-y-6">
                        {/* Current DB Info */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-gray-700 mb-2">Base de Datos Actual</h3>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={currentSheetId}
                                    readOnly
                                    className="flex-1 bg-white border border-gray-300 text-gray-500 text-sm rounded-lg p-2.5"
                                />
                                <button
                                    onClick={handleCopyId}
                                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg transition"
                                    title="Copiar ID"
                                >
                                    <i className="fas fa-copy"></i>
                                </button>
                                <button
                                    onClick={handleOpenDrive}
                                    className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg transition"
                                    title="Abrir en Drive"
                                >
                                    <i className="fas fa-external-link-alt"></i>
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCreateNewDb}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    + Crear Nueva Base de Datos
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Switch DB */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Cambiar Base de Datos</h3>
                                <p className="text-xs text-gray-500 mb-2">Conéctate a una base de datos existente (tuya o compartida).</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={switchSheetId}
                                        onChange={(e) => setSwitchSheetId(e.target.value)}
                                        placeholder="ID de la hoja..."
                                        className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                                    />
                                    <button
                                        onClick={handleSwitchDb}
                                        disabled={!switchSheetId.trim()}
                                        className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            </div>

                            {/* Import from another DB */}
                            <div className="border-l border-gray-200 pl-8">
                                <h3 className="font-semibold text-gray-700 mb-2">Importar Datos (Copiar)</h3>
                                <p className="text-xs text-gray-500 mb-2">Copia clientes/servicios de otra hoja a la tuya actual.</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSheetId}
                                        onChange={(e) => setNewSheetId(e.target.value)}
                                        placeholder="ID de origen..."
                                        className="flex-1 bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                                    />
                                    <button
                                        onClick={handleImportDb}
                                        disabled={!newSheetId.trim() || isImporting}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        {isImporting ? '...' : 'Importar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Import Section */}
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
