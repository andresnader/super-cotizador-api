import { Client, Service } from '../types';

/**
 * Servicio para manejo de archivos CSV (importación/exportación)
 */

// Genera plantilla CSV para Clientes
export const generateClientTemplate = (): void => {
    const headers = ['RUC', 'Nombre', 'Contacto', 'Teléfono', 'Dirección', 'Ciudad'];
    const exampleRow = ['0916092075001', 'Empresa Ejemplo S.A.', 'contacto@ejemplo.com', '0999999999', 'Av. Principal 123', 'Guayaquil'];

    const csvContent = [
        headers.join(','),
        exampleRow.join(','),
        // Añadir filas vacías para que el usuario llene
        ',,,,,',
        ',,,,,',
        ',,,,,',
    ].join('\n');

    downloadCSV(csvContent, 'plantilla_clientes.csv');
};

// Genera plantilla CSV para Servicios
export const generateServiceTemplate = (): void => {
    const headers = ['Código', 'Nombre', 'Precio', 'Descripción', 'Categoría'];
    const exampleRow = ['SRV001', 'Servicio Ejemplo', '100.00', 'Descripción del servicio', 'General'];

    const csvContent = [
        headers.join(','),
        exampleRow.join(','),
        // Añadir filas vacías
        ',,,,',
        ',,,,',
        ',,,,'
    ].join('\n');

    downloadCSV(csvContent, 'plantilla_servicios.csv');
};

// Parsea y valida CSV de clientes
export const parseClientsCSV = async (file: File): Promise<Client[]> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        throw new Error('El archivo CSV está vacío o no tiene datos');
    }

    // Verificar headers
    const headers = lines[0].toLowerCase();
    if (!headers.includes('ruc') || !headers.includes('nombre')) {
        throw new Error('El CSV debe contener al menos las columnas: RUC, Nombre');
    }

    const clients: Client[] = [];

    // Parsear filas (skip header)
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        if (values.length < 2 || !values[0] || !values[1]) {
            continue; // Skip empty or incomplete rows
        }

        const client: Client = {
            id: `client_${Date.now()}_${i}`,
            ruc: values[0].trim(),
            name: values[1].trim(),
            contact: values[2]?.trim() || '',
            phone: values[3]?.trim() || '',
            address: values[4]?.trim() || '',
            city: values[5]?.trim() || '',
            code: values[0].trim()
        };

        // Validación básica
        if (client.ruc.length < 10) {
            throw new Error(`Fila ${i + 1}: RUC inválido (${client.ruc})`);
        }

        clients.push(client);
    }

    if (clients.length === 0) {
        throw new Error('No se encontraron clientes válidos en el archivo');
    }

    return clients;
};

// Parsea y valida CSV de servicios
export const parseServicesCSV = async (file: File): Promise<Service[]> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        throw new Error('El archivo CSV está vacío o no tiene datos');
    }

    // Verificar headers
    const headers = lines[0].toLowerCase();
    if (!headers.includes('nombre') || !headers.includes('precio')) {
        throw new Error('El CSV debe contener al menos las columnas: Nombre, Precio');
    }

    const services: Service[] = [];

    // Parsear filas (skip header)
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        if (values.length < 2 || !values[1] || !values[2]) {
            continue; // Skip empty or incomplete rows
        }

        const price = parseFloat(values[2].trim());
        if (isNaN(price)) {
            throw new Error(`Fila ${i + 1}: Precio inválido (${values[2]})`);
        }

        const service: Service = {
            id: `service_${Date.now()}_${i}`,
            code: values[0]?.trim() || `SRV${i}`,
            name: values[1].trim(),
            price: price,
            description: values[3]?.trim() || '',
            category: values[4]?.trim() || 'General',
            cost: 0
        };

        services.push(service);
    }

    if (services.length === 0) {
        throw new Error('No se encontraron servicios válidos en el archivo');
    }

    return services;
};

// Helper: Parsea una línea CSV considerando comillas
const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
};

// Helper: Descarga un string como archivo CSV
const downloadCSV = (content: string, filename: string): void => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
