import React, { useState } from 'react';
import { CompanySettings } from '../../types';

interface CompanyProfileProps {
    settings: CompanySettings;
    onUpdate: (settings: CompanySettings) => void;
}

const CompanyProfile: React.FC<CompanyProfileProps> = ({ settings, onUpdate }) => {
    const [formData, setFormData] = useState<CompanySettings>(settings);

    const handleChange = (field: keyof CompanySettings, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-lg p-6 lg:p-8 rounded-[2rem]">
            <h2 className="text-2xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800">Perfil de la Empresa</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mx-1 mb-2">
                        Nombre Empresa
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                        placeholder="Ameizin | Digital Solutions"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mx-1 mb-2">
                        Dirección
                    </label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="w-full bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                        placeholder="Urdesa Norte Av. 1"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mx-1 mb-2">
                            Contacto (Email)
                        </label>
                        <input
                            type="email"
                            value={formData.contact}
                            onChange={(e) => handleChange('contact', e.target.value)}
                            className="w-full bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                            placeholder="andres@ameizin.ec"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mx-1 mb-2">
                            WhatsApp (opcional)
                        </label>
                        <input
                            type="text"
                            value={formData.whatsapp || ''}
                            onChange={(e) => handleChange('whatsapp', e.target.value)}
                            className="w-full bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                            placeholder="+593 99 999 9999"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mx-1 mb-2">
                            RUC
                        </label>
                        <input
                            type="text"
                            value={formData.ruc}
                            onChange={(e) => handleChange('ruc', e.target.value)}
                            className="w-full bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                            placeholder="0916092075001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mx-1 mb-2">
                            Sitio Web (opcional)
                        </label>
                        <input
                            type="url"
                            value={formData.website || ''}
                            onChange={(e) => handleChange('website', e.target.value)}
                            className="w-full bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                            placeholder="https://ameizin.ec"
                        />
                    </div>
                </div>

                <div className="border-t border-white/50 pt-6 mt-8">
                    <h3 className="text-sm font-extrabold text-indigo-800 mb-6 uppercase tracking-wider mx-1">Representante Legal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mx-1 mb-2">
                                Nombre del Representante
                            </label>
                            <input
                                type="text"
                                value={formData.repName || ''}
                                onChange={(e) => handleChange('repName', e.target.value)}
                                className="w-full bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                                placeholder="Andrés Nader"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mx-1 mb-2">
                                Cargo / Título
                            </label>
                            <input
                                type="text"
                                value={formData.repTitle || ''}
                                onChange={(e) => handleChange('repTitle', e.target.value)}
                                className="w-full bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                                placeholder="Gerente General"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-full font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Actualizar Datos Generales
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyProfile;
