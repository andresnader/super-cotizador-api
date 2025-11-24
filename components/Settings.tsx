import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { saveCompanySettings, exportData, importData } from '../services/storage';

interface SettingsProps {
    settings: CompanySettings;
    onUpdate: (s: CompanySettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
    const [form, setForm] = useState(settings);

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
                <h3 className="font-bold mb-4 text-xl">Gestión de Datos (Backup)</h3>
                <p className="text-sm text-gray-600 mb-4">Exporte o importe todos los datos (clientes, servicios, historial) en formato JSON para copias de seguridad.</p>
                <div className="flex space-x-4">
                    <button onClick={handleBackupDownload} className="flex-1 bg-gray-600 text-white px-4 py-3 rounded hover:bg-gray-700 transition">
                        <i className="fas fa-download mr-2"></i> Exportar JSON
                    </button>
                    <label className="flex-1 bg-gray-400 text-white px-4 py-3 rounded hover:bg-gray-500 transition cursor-pointer text-center relative">
                        <i className="fas fa-file-import mr-2"></i> Importar JSON
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".json" onChange={handleBackupUpload} />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Settings;