---
description: Cómo trabajar con el sistema Liquid Glass (Glassmorphism, Mobile-First) en Super-Cotizador
---

# Liquid Glass & Mobile-Friendly UX Skill

## 1. Patrones de Diseño Liquid Glass (Glassmorphism)
El diseño "Liquid Glass" se basa en capas translúcidas, colores vibrantes en el fondo (que pueden filtrarse), y bordes suaves.

- **Fondo Translúcido**: Usa `bg-white/70`, `bg-white/40`, o variables CSS personalizadas con opacidad + `backdrop-blur-md` o `backdrop-blur-lg` de Tailwind.
- **Bordes Suaves**: Usa `border border-white/20` o `border-white/40` para simular el cristal. En dark mode: `border-gray-700/50`.
- **Sombras Sutiles**: Usa bordes difuminados y sombras grandes pero sutiles (`shadow-xl` o personalizadas).
- **Formas Redondeadas**: Usa `rounded-2xl` o `rounded-3xl` para contenedores principales, `rounded-xl` para botones.

Ejemplo base de tarjeta:
```tsx
<div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-3xl p-6 shadow-xl">
  {/* Content */}
</div>
```

## 2. Pautas Mobile-First
- **Touch Targets**: Botones con al menos `h-12` o `min-h-[44px]` (`py-3 px-4`).
- **Layouts Flexibles**: Usa `flex-col` en móvil, `md:flex-row` en desktop. Los inputs y botones suelen ocupar `w-full` en móvil.
- **Navegación Fluida**: Tarjetas apiladas, scroll suave, padding generoso (`p-4` a `p-6`).

## 3. Botones Premium
Botones con degradados, padding alto y micro-interacciones:
```tsx
<button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-95 w-full">
  Ver Detalles
</button>
```

## 4. Workflow de Rediseño (Stitch MCP)
0. Analiza el código actual y entiende la funcionalidad sección a sección y los componentes que se utilizan. 
1. Pide a Stitch MCP la generación de la vista requerida.
2. Extrae las clases Tailwind y estructura JSX.
3. Implanta en la base de código local preservando la funcionalidad existente (estados, hooks, servicios).
