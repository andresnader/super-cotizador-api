import React, { useState } from 'react';
import { CompanySettings } from '../../types';

interface BrandKitProps {
    settings: CompanySettings;
    onUpdate: (settings: CompanySettings) => void;
}

const BrandKit: React.FC<BrandKitProps> = ({ settings, onUpdate }) => {
    const [formData, setFormData] = useState<CompanySettings>(settings);
    const [logoPreview, setLogoPreview] = useState<string>(settings.logo || '');
    const [logoUrl, setLogoUrl] = useState<string>(
        settings.logo && !settings.logo.startsWith('data:') ? settings.logo : ''
    );

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setLogoPreview(result);
            setFormData(prev => ({ ...prev, logo: result }));
            setLogoUrl('');
            analyzeLogoColors(result);
        };
        reader.readAsDataURL(file);
    };

    const applyLogoUrl = () => {
        const url = logoUrl.trim();
        if (url) {
            setFormData(prev => ({ ...prev, logo: url }));
            setLogoPreview(url);
            analyzeLogoColors(url);
        }
    };

    const analyzeLogoColors = (imageSrc: string) => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const colorCounts: { [key: string]: number } = {};
            let maxCount = 0;
            let dominantColor = '';

            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const a = imageData[i + 3];

                // Skip transparent and very light/dark pixels
                if (a < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) continue;

                const rgb = `${r},${g},${b}`;
                colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;

                if (colorCounts[rgb] > maxCount) {
                    maxCount = colorCounts[rgb];
                    dominantColor = rgb;
                }
            }

            if (dominantColor) {
                const [r, g, b] = dominantColor.split(',').map(Number);
                const toHex = (c: number) => {
                    const hex = c.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                };
                const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

                // Set primary color
                setFormData(prev => ({ ...prev, primaryColor: hexColor }));

                // Calculate accent color (complementary or lighter/darker)
                // Simple complementary for now
                const compR = 255 - r;
                const compG = 255 - g;
                const compB = 255 - b;
                const accentHex = `#${toHex(compR)}${toHex(compG)}${toHex(compB)}`;

                setFormData(prev => ({ ...prev, accentColor: accentHex }));
            }
        };
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
        'Nunito',
        'League Spartan'
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Configuración</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo
                    </label>
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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

                        {/* URL input */}
                        <div className="mb-3">
                            <input
                                type="text"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                onBlur={applyLogoUrl}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLogoUrl(); } }}
                                placeholder="https://ameizin.red/cotizador/logo.png"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white text-gray-900"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Pega la URL de tu logo y presiona Enter o haz click afuera
                            </p>
                        </div>

                        {/* File upload */}
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                            <i className="fas fa-upload mr-2"></i>
                            Subir archivo
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
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
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm bg-white text-gray-900"
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
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm bg-white text-gray-900"
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
