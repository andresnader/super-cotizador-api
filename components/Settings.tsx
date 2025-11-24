import React, { useState } from 'react';
import { CompanySettings, Client, Service } from '../types';
import { 
    saveCompanySettings, 
    exportData, 
    importData, 
    downloadFile, 
    parseCSV, 
    getClients, 
    saveClients, 
    getServices, 
    saveServices 
} from '../services/storage';

interface SettingsProps {
    settings: CompanySettings;
    onUpdate: (s: CompanySettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
    const [form, setForm] = useState(settings);
    const [importMsg, setImportMsg] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setForm({ ...form, logo: ev.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveCompanySettings(form);
        onUpdate(form);
        alert("Configuración guardada.");
    };

    const handleBackupDownload = () => {
        const json = exportData();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
    };

    const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    const success = importData(ev.target.result as string);
                    if (success) {
                        alert("Datos restaurados. Recargue la página.");
                        window.location.reload();
                    } else {
                        alert("Error al importar backup.");
                    }
                }
            };
            reader.readAsText(file);
        }
    };

    // --- CSV Import Handlers ---

    const downloadClientTemplate = () => {
        const headers = "Identificación No.,Razón Social,Nombre Comercial,Dirección,Teléfono,Email";
        downloadFile("Plantilla_Clientes.csv", headers + "\n");
    };

    const downloadServiceTemplate = () => {
        const headers = "id,code,description,price,category,costointerno";
        downloadFile("Plantilla_Servicios.csv", headers + "\n");
    };

    const handleClientCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target?.result as string;
                const { data } = parseCSV(text);
                
                if (data.length === 0) {
                    setImportMsg({ text: "No se encontraron datos de clientes válidos.", type: 'error' });
                    return;
                }

                const mappings = {
                    'identificacionno': 'ruc',
                    'razonsocial': 'name',
                    'nombrecomercial': 'code',
                    'direccion': 'address',
                    'telefono': 'phone',
                    'email': 'contact',
                };

                let addedCount = 0;
                let updatedCount = 0;
                const clients = getClients();
                const newClients = [...clients];

                data.forEach((row: any) => {
                    const clientData: any = {};
                    Object.entries(mappings).forEach(([csvKey, appKey]) => {
                        clientData[appKey] = row[csvKey] || '';
                    });

                    if (!clientData.name) return;
                    if (!clientData.code) clientData.code = clientData.name.substring(0, 10).toUpperCase();

                    const existingIdx = newClients.findIndex(c => c.ruc === clientData.ruc);
                    if (existingIdx >= 0 && clientData.ruc) {
                        newClients[existingIdx] = { ...newClients[existingIdx], ...clientData };
                        updatedCount++;
                    } else {
                        clientData.id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        newClients.push(clientData as Client);
                        addedCount++;
                    }
                });

                saveClients(newClients);
                setImportMsg({ text: `Clientes: ${addedCount} nuevos, ${updatedCount} actualizados.`, type: 'success' });
            } catch (err) {
                setImportMsg({ text: "Error al procesar el archivo CSV de clientes.", type: 'error' });
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handleServiceCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target?.result as string;
                const { data } = parseCSV(text);
                
                if (data.length === 0) {
                    setImportMsg({ text: "No se encontraron datos de servicios válidos.", type: 'error' });
                    return;
                }

                const mappings = {
                    'id': 'code',
                    'code': 'name',
                    'description': 'description',
                    'price': 'price',
                    'category': 'category',
                    'costointerno': 'cost'
                };

                let addedCount = 0;
                let updatedCount = 0;
                const services = getServices();
                const newServices = [...services];

                data.forEach((row: any) => {
                    const serviceData: any = {};
                    Object.entries(mappings).forEach(([csvKey, appKey]) => {
                        let val = row[csvKey];
                        if (appKey === 'price' || appKey === 'cost') {
                            val = parseFloat(String(val).replace('$', '').replace(',', '.')) || 0;
                        }
                        serviceData[appKey] = val;
                    });

                    if (!serviceData.name) return;
                    if (!serviceData.code) serviceData.code = 'SRV-' + Date.now();

                    const existingIdx = newServices.findIndex(s => s.code === serviceData.code);
                    if (existingIdx >= 0 && serviceData.code) {
                        newServices[existingIdx] = { ...newServices[existingIdx], ...serviceData };
                        updatedCount++;
                    } else {
                        serviceData.id = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        newServices.push(serviceData as Service);
                        addedCount++;
                    }
                });

                saveServices(newServices);
                setImportMsg({ text: `Servicios: ${addedCount} nuevos, ${updatedCount} actualizados.`, type: 'success' });
            } catch (err) {
                setImportMsg({ text: "Error al procesar el archivo CSV de servicios.", type: 'error' });
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Configuración</h2>
            <form onSubmit={handleSave} className="space-y-4">
                <div><label className="block text-sm font-medium">Nombre Empresa</label><input name="name" value={form.name} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                <div><label className="block text-sm font-medium">Dirección</label><input name="address" value={form.address} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                <div><label className="block text-sm font-medium">Contacto (Email)</label><input name="contact" value={form.contact} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                <div><label className="block text-sm font-medium">RUC</label><input name="ruc" value={form.ruc} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                <div><label className="block text-sm font-medium">Sitio Web</label><input name="website" value={form.website} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Color Primario</label>
                        <input type="color" name="primaryColor" value={form.primaryColor} onChange={handleChange} className="w-full h-10 border rounded p-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Color Acento</label>
                        <input type="color" name="accentColor" value={form.accentColor} onChange={handleChange} className="w-full h-10 border rounded p-1" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium">Logo</label>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700" />
                    {form.logo && <img src={form.logo} alt="Preview" className="mt-2 h-16 object-contain border p-1 rounded" />}
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Guardar</button>
            </form>

            <div className="mt-12 pt-6 border-t border-gray-200">
                <h3 className="font-bold mb-4 text-xl text-gray-800">Importación Masiva (CSV)</h3>
                
                {importMsg && (
                    <div className={`mb-4 p-3 rounded-lg text-sm border ${importMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        {importMsg.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Import Clients */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-2">Clientes</h4>
                        <div className="flex flex-col gap-2">
                             <button onClick={downloadClientTemplate} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium text-left">
                                <i className="fas fa-download mr-1"></i> Descargar Plantilla
                            </button>
                            <label className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg cursor-pointer hover:bg-gray-50 text-center text-sm shadow-sm">
                                <i className="fas fa-file-csv mr-2 text-green-600"></i> Seleccionar CSV
                                <input type="file" className="hidden" accept=".csv" onChange={handleClientCSVUpload} />
                            </label>
                        </div>
                    </div>

                    {/* Import Services */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-2">Servicios</h4>
                        <div className="flex flex-col gap-2">
                            <button onClick={downloadServiceTemplate} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium text-left">
                                <i className="fas fa-download mr-1"></i> Descargar Plantilla
                            </button>
                            <label className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg cursor-pointer hover:bg-gray-50 text-center text-sm shadow-sm">
                                <i className="fas fa-file-csv mr-2 text-green-600"></i> Seleccionar CSV
                                <input type="file" className="hidden" accept=".csv" onChange={handleServiceCSVUpload} />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-6 border-t border-gray-200">
                <h3 className="font-bold mb-2 text-xl text-gray-800">Gestión de Datos (Backup)</h3>
                <p className="text-sm text-gray-600 mb-6">Exporte o importe todos los datos (clientes, servicios, historial) en formato JSON para copias de seguridad.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={handleBackupDownload} 
                        className="bg-gray-700 hover:bg-gray-800 text-white p-4 rounded-lg flex items-center justify-center gap-3 transition shadow-md group"
                    >
                        <i className="fas fa-download text-xl group-hover:scale-110 transition-transform"></i>
                        <span className="font-semibold text-lg">Exportar JSON</span>
                    </button>
                    
                    <label className="bg-gray-400 hover:bg-gray-500 text-white p-4 rounded-lg flex items-center justify-center gap-3 transition shadow-md cursor-pointer relative group">
                        <i className="fas fa-file-import text-xl group-hover:scale-110 transition-transform"></i>
                        <span className="font-semibold text-lg">Importar JSON</span>
                        <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            accept=".json" 
                            onChange={handleBackupUpload} 
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Settings;