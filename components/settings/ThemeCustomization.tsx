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
        onUpdate({ ...settings, themePreferences: newPrefs });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Personalización de Apariencia</h2>
            <p className="text-sm text-gray-600 mb-6">
                Personaliza los colores, fuentes y modo de tema de la aplicación
            </p>

            {/* Theme Modes */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Modo de Tema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {themeModesConfig.map((modeConfig) => (
                        <button
                            key={modeConfig.mode}
                            onClick={() => handleThemeModeChange(modeConfig.mode)}
                            className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${themePrefs.mode === modeConfig.mode
                                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }
              `}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-3
                  ${themePrefs.mode === modeConfig.mode ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}
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
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Color de Acento</h3>

                {/* Preset Colors */}
                <div className="grid grid-cols-5 md:grid-cols-10 gap-3 mb-4">
                    {PRESET_COLORS.map((colorOption) => (
                        <button
                            key={colorOption.value}
                            onClick={() => handleAccentColorChange(colorOption.value)}
                            className={`
                relative w-12 h-12 rounded-lg transition-all duration-200
                hover:scale-110 hover:shadow-md
                ${themePrefs.accentColor === colorOption.value ? 'ring-2 ring-offset-2 ring-gray-800 scale-105' : ''}
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
                <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700">Color personalizado:</label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="color"
                            value={customColor}
                            onChange={(e) => handleAccentColorChange(e.target.value)}
                            className="h-10 w-20 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={customColor}
                            onChange={(e) => handleAccentColorChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm w-28 bg-white text-gray-900"
                            placeholder="#4F46E5"
                        />
                    </div>
                </div>
            </div>

            {/* Font Family */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipografía</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CURATED_FONTS.map((font) => (
                        <button
                            key={font}
                            onClick={() => handleFontChange(font)}
                            className={`
                p-4 rounded-lg border-2 text-left transition-all duration-200
                ${themePrefs.fontFamily === font
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
            <div className="mt-8 p-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Vista Previa</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Los cambios se aplican en tiempo real. Recarga la página para ver el tema completo aplicado.
                </p>
                <div className="flex flex-wrap gap-3">
                    <button
                        className="px-4 py-2 rounded-lg text-white font-medium transition"
                        style={{ backgroundColor: themePrefs.accentColor }}
                    >
                        Botón de ejemplo
                    </button>
                    <div className="px-4 py-2 border-2 rounded-lg" style={{ borderColor: themePrefs.accentColor, color: themePrefs.accentColor }}>
                        Texto de acento
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                    <i className="fas fa-info-circle text-blue-600 mt-1"></i>
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Tip:</p>
                        <p>Tus preferencias de tema se guardan automáticamente y se aplicarán cada vez que inicies sesión.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeCustomization;
