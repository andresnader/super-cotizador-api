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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Configuración</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Empresa
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ameizin | Digital Solutions"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección
                    </label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Urdesa Norte Av. 1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contacto (Email)
                    </label>
                    <input
                        type="email"
                        value={formData.contact}
                        onChange={(e) => handleChange('contact', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="andres@ameizin.ec"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        RUC
                    </label>
                    <input
                        type="text"
                        value={formData.ruc}
                        onChange={(e) => handleChange('ruc', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="0916092075001"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sitio Web
                    </label>
                    <input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => handleChange('website', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="https://ameizin.ec"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900 transition font-semibold"
                >
                    Actualizar Datos Generales
                </button>
            </form>
        </div>
    );
};

export default CompanyProfile;
