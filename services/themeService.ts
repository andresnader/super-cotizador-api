import { ThemePreferences } from '../types';

// Default theme preferences
const defaultThemePreferences: ThemePreferences = {
    mode: 'light',
    accentColor: '#4f46e5',
    fontFamily: 'Inter'
};

// List of curated Google Fonts
export const CURATED_FONTS = [
    'Inter',
    'Roboto',
    'Poppins',
    'Montserrat',
    'Lato',
    'Open Sans',
    'Raleway',
    'Nunito',
    'Outfit',
    'Work Sans',
    'League Spartan'
];

// Preset accent colors
export const PRESET_COLORS = [
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#9333EA' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Green', value: '#10B981' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Cyan', value: '#06B6D4' }
];

/**
 * Load a Google Font dynamically
 */
export const loadGoogleFont = (fontFamily: string): void => {
    // Check if font is already loaded
    const existingLink = document.querySelector(`link[href*="family=${fontFamily.replace(' ', '+')}"]`);
    if (existingLink) return;

    // Create and append link element for Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
};

/**
 * Apply theme to the document
 */
export const applyTheme = (preferences: ThemePreferences): void => {
    const root = document.documentElement;

    // Set theme mode attribute
    root.setAttribute('data-theme', preferences.mode);

    // Set custom accent color as CSS variable
    root.style.setProperty('--accent-color', preferences.accentColor);
    root.style.setProperty('--accent-hover', adjustColorBrightness(preferences.accentColor, -20));

    // Apply font family
    loadGoogleFont(preferences.fontFamily);
    document.body.style.fontFamily = `${preferences.fontFamily}, sans-serif`;

    // Inject dynamic styles to override Tailwind classes
    let styleTag = document.getElementById('theme-overrides');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'theme-overrides';
        document.head.appendChild(styleTag);
    }

    const css = `
        .text-indigo-600 { color: var(--accent-color) !important; }
        .bg-indigo-600 { background-color: var(--accent-color) !important; }
        .border-indigo-600 { border-color: var(--accent-color) !important; }
        .bg-indigo-50 { background-color: color-mix(in srgb, var(--accent-color) 10%, white) !important; }
        .hover\\:text-indigo-600:hover { color: var(--accent-color) !important; }
        .hover\\:bg-indigo-600:hover { background-color: var(--accent-hover) !important; }
        .hover\\:bg-indigo-700:hover { background-color: var(--accent-hover) !important; }
        .hover\\:bg-indigo-50:hover { background-color: color-mix(in srgb, var(--accent-color) 15%, white) !important; }
        
        /* Dark mode overrides */
        [data-theme="dark"] .bg-white { background-color: var(--bg-primary) !important; }
        [data-theme="dark"] .text-gray-900 { color: var(--text-primary) !important; }
        [data-theme="dark"] .text-gray-800 { color: var(--text-primary) !important; }
        [data-theme="dark"] .text-gray-600 { color: var(--text-secondary) !important; }
        [data-theme="dark"] .text-gray-500 { color: var(--text-tertiary) !important; }
        [data-theme="dark"] .bg-gray-50 { background-color: var(--bg-secondary) !important; }
        [data-theme="dark"] .border-gray-200 { border-color: var(--border-color) !important; }
        [data-theme="dark"] .border-gray-100 { border-color: var(--border-color) !important; }
        
        [data-theme="midnight"] .bg-white { background-color: var(--bg-primary) !important; }
        [data-theme="midnight"] .text-gray-900 { color: var(--text-primary) !important; }
        [data-theme="midnight"] .text-gray-800 { color: var(--text-primary) !important; }
        [data-theme="midnight"] .text-gray-600 { color: var(--text-secondary) !important; }
        [data-theme="midnight"] .text-gray-500 { color: var(--text-tertiary) !important; }
        [data-theme="midnight"] .bg-gray-50 { background-color: var(--bg-secondary) !important; }
        [data-theme="midnight"] .border-gray-200 { border-color: var(--border-color) !important; }
        [data-theme="midnight"] .border-gray-100 { border-color: var(--border-color) !important; }
    `;

    styleTag.innerHTML = css;
};

/**
 * Adjust color brightness for hover states
 */
const adjustColorBrightness = (hex: string, percent: number): string => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Adjust brightness
    const adjust = (value: number) => {
        const adjusted = value + (value * percent / 100);
        return Math.max(0, Math.min(255, adjusted));
    };

    // Convert back to hex
    const toHex = (value: number) => {
        const hex = Math.round(value).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
};

/**
 * Get theme preferences from localStorage
 */
export const getThemePreferences = (): ThemePreferences => {
    try {
        const stored = localStorage.getItem('themePreferences');
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...defaultThemePreferences, ...parsed };
        }
    } catch (error) {
        console.error('Error loading theme preferences:', error);
    }
    return defaultThemePreferences;
};

/**
 * Save theme preferences to localStorage
 */
export const saveThemePreferences = (preferences: ThemePreferences): void => {
    try {
        localStorage.setItem('themePreferences', JSON.stringify(preferences));
        applyTheme(preferences);
    } catch (error) {
        console.error('Error saving theme preferences:', error);
    }
};

/**
 * Initialize theme on app load
 */
export const initializeTheme = (): void => {
    const preferences = getThemePreferences();
    applyTheme(preferences);
};
