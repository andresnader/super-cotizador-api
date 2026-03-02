---
name: new-component
description: Cómo crear un nuevo componente/módulo en Super-Cotizador siguiendo los patrones existentes
---

# Crear un Nuevo Componente en Super-Cotizador

## Prerrequisitos
- Entender el patrón `DataManager` (Strategy Pattern) en `services/dataManager.ts`
- Revisar `types.ts` para las interfaces existentes

## Pasos

### 1. Definir la Interfaz en `types.ts`

Agregar la nueva interfaz siguiendo el patrón existente:

```typescript
export interface NuevoEntidad {
  id: string;
  rowId?: any; // number para sheets, string para local
  // ... campos específicos
}
```

> **IMPORTANTE**: Siempre incluir `id: string` y `rowId?: any` para compatibilidad con ambos modos de almacenamiento.

### 2. Crear el Componente TSX en `components/`

Seguir la estructura estándar:

```typescript
import React, { useState, useEffect } from 'react';
import { NuevoEntidad } from '../types';
import { dataManager } from '../services/dataManager';

interface NuevoComponentProps {
  // props necesarias
}

const NuevoComponent: React.FC<NuevoComponentProps> = ({ /* props */ }) => {
  const [items, setItems] = useState<NuevoEntidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dataManager.fetchNuevoEntidad();
        setItems(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* UI con TailwindCSS */}
    </div>
  );
};

export default NuevoComponent;
```

### 3. Agregar Métodos al DataManager

En `services/dataManager.ts`, agregar los métodos CRUD:

```typescript
async fetchNuevoEntidad(): Promise<NuevoEntidad[]> {
    return this.mode === 'google'
        ? googleService.fetchNuevoEntidad(this.getSpreadsheetId())
        : storageService.fetchNuevoEntidad();
}
```

### 4. Implementar Storage Local en `services/storage.ts`

```typescript
const _getNuevoEntidad = (): NuevoEntidad[] => 
  JSON.parse(localStorage.getItem('nuevo_entidad') || '[]');

const _saveNuevoEntidad = (data: NuevoEntidad[]) => 
  localStorage.setItem('nuevo_entidad', JSON.stringify(data));
```

### 5. Implementar Google Sheets API en `services/google.ts`

- Agregar nueva hoja en `initializeUserDatabase()` con los headers
- Crear funciones `fetchNuevoEntidad()`, `saveNuevoEntidad()`, `deleteNuevoEntidad()`
- Seguir el patrón de mapeo de filas existente

### 6. Registrar la Pestaña en `App.tsx`

Agregar:
1. Import del componente
2. Nueva condición en el render: `{activeTab === 'nuevo' && <NuevoComponent />}`

### 7. Agregar al Layout

En `components/Layout.tsx`, agregar el nuevo item de navegación con ícono FontAwesome.

## Convenciones de Estilo
- Usar clases TailwindCSS (no CSS inline)
- Iconos: FontAwesome (CDN ya incluido)
- Colores primarios: `indigo-600`, `indigo-700`
- Cards: `bg-white rounded-xl shadow-sm border border-gray-200`
- Botones primarios: `bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700`
- Texto responsivo: usar variantes `md:` para breakpoints
