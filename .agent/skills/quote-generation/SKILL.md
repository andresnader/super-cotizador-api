---
name: quote-generation
description: Cómo funciona el flujo de creación de cotizaciones, impresión PDF y generación de Google Docs
---

# Generación de Cotizaciones

## Flujo Principal

```
1. Usuario selecciona cliente (autocompletado)
2. Usuario agrega servicios (búsqueda + cantidades)
3. Cálculo automático: subtotal, IVA 15%, total
4. Genera número de cotización automático
5. Opción: guardar + imprimir PDF / guardar + crear Google Doc
```

## Archivos Involucrados
- `components/QuoteBuilder.tsx` — UI del constructor
- `App.tsx` → `PrintTemplate` — Template de impresión
- `services/google.ts` → `createQuoteDoc()` — Generación de Google Doc
- `types.ts` → `Quote`, `QuoteItem`

## Estructura de una Cotización (Quote)

```typescript
{
  id: string,              // UUID
  number: string,          // "COT-0001"
  issueDate: string,       // "01/03/2026"
  validityDate: string,    // "31/03/2026"
  client: Client,          // Objeto cliente completo
  items: QuoteItem[],      // Servicios cotizados
  subtotal: number,
  iva: number,             // 15% del subtotal
  total: number,
  notes: string,           // Términos y condiciones
  status: 'Pendiente' | 'Aceptada' | 'Rechazada',
  googleDocId?: string,    // ID del doc generado (solo Google mode)
  companySettings: CompanySettings  // Snapshot de config al momento
}
```

## Cálculos
```typescript
const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
const iva = subtotal * 0.15;
const total = subtotal + iva;
```

## Impresión PDF
1. Se abre un `Modal` con `PrintTemplate`
2. `PrintTemplate` renderiza HTML formateado profesionalmente
3. Al hacer click "Imprimir PDF" se llama `window.print()`
4. CSS `print:` media queries ocultan controles y optimizan layout

## Generación Google Doc
La función `createQuoteDoc()` en `google.ts`:
1. Crea un documento vacío en Google Docs
2. Usa `batchUpdate` con requests para insertar texto formateado
3. Aplica estilos (colores corporativos, fuentes, tamaños)
4. Genera tabla de items con headers coloreados
5. Retorna el `documentId` para vincular a la cotización

## Agregar Campos a una Cotización

1. Agregar campo en `QuoteItem` o `Quote` en `types.ts`
2. Actualizar `QuoteBuilder.tsx` para capturar el nuevo campo
3. Actualizar `PrintTemplate` en `App.tsx` para mostrarlo
4. Actualizar `createQuoteDoc()` en `google.ts` si se genera Doc
5. Actualizar `saveQuote()`/`fetchQuotes()` en ambos servicios (google + storage)

## Personalización del Template
El `PrintTemplate` en `App.tsx` usa los colores de `CompanySettings`:
- `settings.primaryColor` → Headers de tabla, líneas decorativas
- `settings.accentColor` → Total y monto final
- `settings.logo` → Logo de la empresa en el header
