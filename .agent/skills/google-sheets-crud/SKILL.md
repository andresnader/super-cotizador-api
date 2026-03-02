---
name: google-sheets-crud
description: Cómo agregar operaciones CRUD para una nueva entidad usando Google Sheets API v4 en Super-Cotizador
---

# CRUD con Google Sheets API v4

## Contexto
Este proyecto usa Google Sheets como base de datos cloud. Cada entidad tiene su propia hoja (sheet/tab) dentro de un archivo Spreadsheet único del usuario.

## Archivos Involucrados
- `services/google.ts` — Operaciones API de Google
- `services/storage.ts` — Fallback localStorage
- `services/dataManager.ts` — Abstracción (Strategy Pattern)
- `services/sessionService.ts` — Obtención del `spreadsheetId`

## Paso 1: Agregar Hoja en la Inicialización

En `google.ts`, dentro de `initializeUserDatabase()`, agregar una nueva hoja:

```typescript
{
  addSheet: {
    properties: {
      title: 'NuevaEntidad',
      gridProperties: { rowCount: 1000, columnCount: 10 }
    }
  }
}
```

Y su fila de headers:

```typescript
{
  range: 'NuevaEntidad!A1:E1',
  values: [['ID', 'Campo1', 'Campo2', 'Campo3', 'Campo4']]
}
```

## Paso 2: Implementar fetch

```typescript
export async function fetchNuevaEntidad(spreadsheetId: string): Promise<NuevaEntidad[]> {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'NuevaEntidad!A2:E',  // Saltar headers
    });

    const rows = response.result.values || [];
    return rows.map((row: any[], index: number) => ({
        id: row[0] || '',
        campo1: row[1] || '',
        campo2: row[2] || '',
        campo3: row[3] || '',
        campo4: row[4] || '',
        rowId: index + 2  // +2 porque empezamos en A2
    }));
}
```

## Paso 3: Implementar save (append o update)

```typescript
export async function saveNuevaEntidad(spreadsheetId: string, item: NuevaEntidad) {
    const values = [[item.id, item.campo1, item.campo2, item.campo3, item.campo4]];

    if (item.rowId) {
        // UPDATE — sobreescribir fila existente
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `NuevaEntidad!A${item.rowId}:E${item.rowId}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });
    } else {
        // CREATE — agregar nueva fila
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'NuevaEntidad!A:E',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
        });
    }
}
```

## Paso 4: Implementar delete

```typescript
export async function deleteNuevaEntidad(spreadsheetId: string, rowId: number) {
    // Limpiar la fila (no se puede eliminar con Sheets API v4 fácilmente)
    await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `NuevaEntidad!A${rowId}:E${rowId}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [['', '', '', '', '']] }
    });
}
```

## Paso 5: Registrar en DataManager

En `services/dataManager.ts`:

```typescript
async fetchNuevaEntidad(): Promise<NuevaEntidad[]> {
    return this.mode === 'google'
        ? googleService.fetchNuevaEntidad(this.getSpreadsheetId())
        : storageService.fetchNuevaEntidad();
}

async saveNuevaEntidad(item: NuevaEntidad): Promise<void> {
    return this.mode === 'google'
        ? googleService.saveNuevaEntidad(this.getSpreadsheetId(), item)
        : storageService.saveNuevaEntidad(item);
}

async deleteNuevaEntidad(rowId: any): Promise<void> {
    return this.mode === 'google'
        ? googleService.deleteNuevaEntidad(this.getSpreadsheetId(), rowId)
        : storageService.deleteNuevaEntidad(rowId);
}
```

## Notas Importantes

> **rowId**: En modo Google, `rowId` es el número de fila (1-indexed) en la hoja. En modo local, es el `id` string. El tipo `any` en la interfaz `DataService` permite esta flexibilidad.

> **Spreadsheet ID**: Siempre obtenerlo de `sessionService.getSpreadsheetId()`, nunca hardcodearlo.

> **Error Handling**: Envolver llamadas API en try/catch. Si falla Google, considerar fallback a local.
