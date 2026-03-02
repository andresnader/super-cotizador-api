---
name: theming
description: Cómo trabajar con el sistema de temas dinámicos, colores, tipografía y dark mode en Super-Cotizador
---

# Sistema de Temas (Theme System)

## Archivos Clave
- `services/themeService.ts` — Lógica central de temas
- `components/settings/ThemeCustomization.tsx` — UI de personalización
- `components/settings/BrandKit.tsx` — Logo y colores corporativos
- `types.ts` — `ThemePreferences`, `ThemeMode`

## Modos de Tema Disponibles
- `light` (defecto)
- `dark`
- `midnight`
- `high-contrast`

## Cómo Funciona

1. Se guarda `ThemePreferences` en `localStorage` con key `themePreferences`
2. Al cargar la app se llama `initializeTheme()` que aplica CSS variables al `<html>`
3. El atributo `data-theme` controla los overrides de dark mode

### CSS Variables Dinámicas
```css
--accent-color: #4F46E5;      /* Color principal */
--accent-hover: #3730A3;       /* Color hover (auto-calculado) */
--bg-primary, --bg-secondary   /* Fondos según modo */
--text-primary, --text-secondary /* Textos según modo */
--border-color                  /* Bordes según modo */
```

## Agregar Soporte de Tema a un Nuevo Componente

### Usar colores con CSS variables
```tsx
// ✅ Correcto - respeta el tema
<div style={{ color: settings.primaryColor }}>...</div>

// ✅ Correcto - clases que se overridean por tema
<div className="bg-white text-gray-900">...</div>

// ❌ Evitar - colores hardcodeados que no cambian con el tema
<div style={{ backgroundColor: '#ffffff' }}>...</div>
```

### Clases que se transforman automáticamente
El `themeService` sobreescribe estas clases de Tailwind en dark mode:
- `bg-white` → fondo oscuro
- `text-gray-900/800` → texto claro
- `text-gray-600/500` → texto secundario claro
- `bg-gray-50` → fondo secundario oscuro
- `border-gray-200/100` → borde oscuro
- `text-indigo-600` / `bg-indigo-600` → color de acento dinámico

## Cambiar la Tipografía
Las fuentes se cargan dinámicamente desde Google Fonts. Fuentes curadas:
`Inter, Roboto, Poppins, Montserrat, Lato, Open Sans, Raleway, Nunito, Outfit, Work Sans, League Spartan`

```typescript
import { loadGoogleFont } from '../services/themeService';
loadGoogleFont('NombreFuente');
```

## Agregar Nuevo Color de Acento
En `themeService.ts`, agregar al array `PRESET_COLORS`:
```typescript
{ name: 'NuevoColor', value: '#HEXCODE' }
```
