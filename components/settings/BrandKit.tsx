import React, { useState } from 'react';
import { CompanySettings } from '../../types';

interface BrandKitProps {
    settings: CompanySettings;
    onUpdate: (settings: CompanySettings) => void;
}

const BrandKit: React.FC<BrandKitProps> = ({ settings, onUpdate }) => {
    const [formData, setFormData] = useState<CompanySettings>(settings);
    const [logoPreview, setLogoPreview] = useState<string>(settings.logo || '');

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result);
                setFormData(prev => ({ ...prev, logo: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (field: keyof CompanySettings, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    const fonts = [
        'Montserrat',
        'Inter',
        'Roboto',
        'Poppins',
        'Lato',
        'Open Sans',
        'Raleway',
        'Nunito'
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Configuración</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo
                    </label>
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        {logoPreview ? (
                            <img
                                src={logoPreview}
                                alt="Logo Preview"
                                className="max-h-24 mx-auto mb-4 object-contain"
                            />
                        ) : (
                            <div className="text-gray-400 mb-4">
                                <i className="fas fa-image text-4xl"></i>
                            </div>
                        )}
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            <i className="fas fa-upload mr-2"></i>
                            Subir Logo
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Typography */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipografía
                    </label>
                    <select
                        value={formData.typography}
                        onChange={(e) => handleChange('typography', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        {fonts.map(font => (
                            <option key={font} value={font}>{font}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Adicionar personalización de tipografías por Google Fonts
                    </p>
                </div>

                {/* Color Primario y Acento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color Primario
                        </label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={formData.primaryColor}
                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                className="h-12 w-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={formData.primaryColor}
                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                placeholder="#E23800"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color Acento
                        </label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={formData.accentColor}
                                onChange={(e) => handleChange('accentColor', e.target.value)}
                                className="h-12 w-12 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={formData.accentColor}
                                onChange={(e) => handleChange('accentColor', e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                placeholder="#A3A3A3"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                    Guardar
                </button>
            </form>
        </div>
    );
};

export default BrandKit;
