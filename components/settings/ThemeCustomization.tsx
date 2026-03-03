import React, { useState } from 'react';
import { ThemePreferences, ThemeMode, CompanySettings } from '../../types';
import { CURATED_FONTS, PRESET_COLORS, saveThemePreferences, getThemePreferences } from '../../services/themeService';

interface ThemeCustomizationProps {
    settings: CompanySettings;
    onUpdate: (settings: CompanySettings) => void;
}

const ThemeCustomization: React.FC<ThemeCustomizationProps> = ({ settings, onUpdate }) => {
    const currentTheme = settings.themePreferences || getThemePreferences();
    const [themePrefs, setThemePrefs] = useState<ThemePreferences>(currentTheme);
    const [customColor, setCustomColor] = useState(currentTheme.accentColor);
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
            setLogoUrl('');
            analyzeLogoColors(result);
            onUpdate({ ...settings, logo: result });
        };
        reader.readAsDataURL(file);
    };

    const applyLogoUrl = () => {
        const url = logoUrl.trim();
        if (url) {
            setLogoPreview(url);
            analyzeLogoColors(url);
            onUpdate({ ...settings, logo: url });
        }
    };

    const analyzeLogoColors = (imageSrc: string) => {
        const img = new Image();
        img.src = imageSrc;
        img.crossOrigin = "Anonymous";
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
                handleAccentColorChange(hexColor);
            }
        };
    };

    const themeModesConfig: { mode: ThemeMode; label: string; icon: string; description: string }[] = [
        { mode: 'light', label: 'Claro', icon: 'fa-sun', description: 'Tema con fondo claro' },
        { mode: 'dark', label: 'Oscuro', icon: 'fa-moon', description: 'Tema con fondo oscuro' },
        { mode: 'midnight', label: 'Medianoche', icon: 'fa-star', description: 'Tema oscuro profundo' },
        { mode: 'high-contrast', label: 'Alto Contraste', icon: 'fa-adjust', description: 'Máximo contraste' }
    ];

    const handleThemeModeChange = (mode: ThemeMode) => {
        const newPrefs = { ...themePrefs, mode };
        setThemePrefs(newPrefs);
        saveThemePreferences(newPrefs);
        updateSettings(newPrefs);
    };

    const handleAccentColorChange = (color: string) => {
        setCustomColor(color);
        const newPrefs = { ...themePrefs, accentColor: color };
        setThemePrefs(newPrefs);
        saveThemePreferences(newPrefs);
        updateSettings(newPrefs);
    };

    const handleFontChange = (fontFamily: string) => {
        const newPrefs = { ...themePrefs, fontFamily };
        setThemePrefs(newPrefs);
        saveThemePreferences(newPrefs);
        updateSettings(newPrefs);
    };

    const updateSettings = (newPrefs: ThemePreferences) => {
        onUpdate({
            ...settings,
            themePreferences: newPrefs,
            primaryColor: newPrefs.accentColor,
            typography: newPrefs.fontFamily
        });
    };

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-lg p-6 lg:p-8 rounded-[2rem]">
            <h2 className="text-2xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800">Apariencia y Marca</h2>
            <p className="text-sm text-slate-600 mb-8 font-medium">
                Personaliza la identidad visual, colores, fuentes y modo de tema
            </p>

            {/* Logo Section */}
            <div className="mb-10 pb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">Logo de Empresa</h3>
                <div className="bg-white/50 backdrop-blur-md border border-white/50 rounded-3xl p-8 text-center shadow-sm">
                    {logoPreview ? (
                        <div className="relative inline-block">
                            <img
                                src={logoPreview}
                                alt="Logo Preview"
                                className="max-h-24 mx-auto mb-4 object-contain"
                            />
                        </div>
                    ) : (
                        <div className="text-gray-400 mb-4">
                            <i className="fas fa-image text-4xl"></i>
                        </div>
                    )}

                    <div className="max-w-md mx-auto space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                onBlur={applyLogoUrl}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLogoUrl(); } }}
                                placeholder="https://ejemplo.com/logo.png"
                                className="flex-1 px-4 py-3 bg-white/50 backdrop-blur-md border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all"
                            />
                            <button
                                onClick={applyLogoUrl}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all text-sm font-bold shadow-sm"
                            >
                                Aplicar
                            </button>
                        </div>
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/60"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                                <span className="bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-slate-500 border border-white/30">O subir archivo</span>
                            </div>
                        </div>
                        <label className="cursor-pointer inline-flex items-center px-6 py-3 bg-white/60 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/80 transition-all text-sm font-bold text-indigo-800 shadow-sm">
                            <i className="fas fa-upload mr-3 text-indigo-600"></i>
                            Seleccionar Imagen
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Theme Modes */}
            <div className="mb-10">
                <h3 className="text-lg font-bold text-slate-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">Modo de Tema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {themeModesConfig.map((modeConfig) => (
                        <button
                            key={modeConfig.mode}
                            onClick={() => handleThemeModeChange(modeConfig.mode)}
                            className={`
                relative p-5 rounded-3xl transition-all duration-300
                ${themePrefs.mode === modeConfig.mode
                                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-400 shadow-lg shadow-indigo-100/50 scale-[1.02]'
                                    : 'bg-white/40 backdrop-blur-md border border-white/60 hover:bg-white/60 shadow-sm hover:shadow-md'
                                }
              `}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors
                  ${themePrefs.mode === modeConfig.mode ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md' : 'bg-white/60 text-slate-500'}
                `}>
                                    <i className={`fas ${modeConfig.icon} text-xl`}></i>
                                </div>
                                <h4 className={`font-semibold mb-1 ${themePrefs.mode === modeConfig.mode ? 'text-indigo-700' : 'text-gray-800'}`}>
                                    {modeConfig.label}
                                </h4>
                                <p className="text-xs text-gray-500">{modeConfig.description}</p>
                            </div>
                            {themePrefs.mode === modeConfig.mode && (
                                <div className="absolute top-2 right-2">
                                    <i className="fas fa-check-circle text-indigo-600"></i>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Accent Color */}
            <div className="mb-10">
                <h3 className="text-lg font-bold text-slate-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">Color de Acento</h3>

                {/* Preset Colors */}
                <div className="grid grid-cols-5 md:grid-cols-10 gap-3 mb-4">
                    {PRESET_COLORS.map((colorOption) => (
                        <button
                            key={colorOption.value}
                            onClick={() => handleAccentColorChange(colorOption.value)}
                            className={`
                relative w-14 h-14 rounded-2xl transition-all duration-300
                hover:scale-110 hover:shadow-lg shadow-sm
                ${themePrefs.accentColor === colorOption.value ? 'ring-4 ring-offset-2 ring-white scale-110 shadow-lg' : 'border border-white/20'}
              `}
                            style={{ backgroundColor: colorOption.value }}
                            title={colorOption.name}
                        >
                            {themePrefs.accentColor === colorOption.value && (
                                <i className="fas fa-check text-white text-sm"></i>
                            )}
                        </button>
                    ))}
                </div>

                {/* Custom Color Picker */}
                <div className="flex items-center space-x-4 bg-white/40 backdrop-blur-md border border-white/50 p-4 rounded-3xl mt-6 inline-flex shadow-sm">
                    <label className="text-sm font-bold text-slate-700">Color Personalizado:</label>
                    <div className="flex items-center space-x-3">
                        <input
                            type="color"
                            value={customColor}
                            onChange={(e) => handleAccentColorChange(e.target.value)}
                            className="h-10 w-14 rounded-xl border-none cursor-pointer bg-transparent p-0"
                        />
                        <input
                            type="text"
                            value={customColor}
                            onChange={(e) => handleAccentColorChange(e.target.value)}
                            className="px-4 py-2 bg-white/60 backdrop-blur-md border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm w-32 text-slate-800 shadow-sm"
                            placeholder="#4F46E5"
                        />
                    </div>
                </div>
            </div>

            {/* Font Family */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">Tipografía</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CURATED_FONTS.map((font) => (
                        <button
                            key={font}
                            onClick={() => handleFontChange(font)}
                            className={`
                p-5 rounded-3xl text-left transition-all duration-300 border
                ${themePrefs.fontFamily === font
                                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-md scale-[1.02]'
                                    : 'bg-white/40 backdrop-blur-md border-white/60 hover:bg-white/60 shadow-sm hover:shadow-md'
                                }
              `}
                            style={{ fontFamily: `${font}, sans-serif` }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className={`font-semibold ${themePrefs.fontFamily === font ? 'text-indigo-700' : 'text-gray-800'}`}>
                                        {font}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        AaBbCc 123
                                    </div>
                                </div>
                                {themePrefs.fontFamily === font && (
                                    <i className="fas fa-check-circle text-indigo-600"></i>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview Section */}
            <div className="mt-10 p-8 rounded-3xl bg-white/30 backdrop-blur-xl border border-white/60 shadow-inner">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Vista Previa</h3>
                <p className="text-sm text-slate-600 mb-6 font-medium">
                    Los cambios se aplican en tiempo real. Recarga la página para ver el tema completo aplicado.
                </p>
                <div className="flex flex-wrap gap-4">
                    <button
                        className="px-6 py-3 rounded-full text-white font-bold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: themePrefs.accentColor, boxShadow: `0 10px 15px -3px ${themePrefs.accentColor}40` }}
                    >
                        Botón de ejemplo
                    </button>
                    <div className="px-6 py-3 rounded-full font-bold bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm" style={{ color: themePrefs.accentColor }}>
                        Texto de acento
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-5 bg-blue-50/50 backdrop-blur-md border border-blue-200/50 rounded-2xl shadow-sm">
                <div className="flex items-start space-x-4">
                    <i className="fas fa-info-circle text-blue-500 mt-1 text-lg"></i>
                    <div className="text-sm text-blue-900">
                        <p className="font-bold mb-1">Tip:</p>
                        <p className="font-medium text-blue-800/80">Tus preferencias de tema se guardan automáticamente y se aplicarán cada vez que inicies sesión.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeCustomization;
