import { Client, Service, Quote, CompanySettings } from '../types';
import { SHEETS_CONFIG } from '../config/google';

// Helper to convert sheet row to Client
const rowToClient = (row: any[]): Client => ({
    id: row[0] || `client_${Date.now()}`,
    code: row[1] || '',
    name: row[2] || '',
    ruc: row[3] || '',
    contact: row[4] || '',
    phone: row[5] || '',
    address: row[6] || '',
    city: row[7] || ''
});

// Helper to convert Client to sheet row
const clientToRow = (client: Client): any[] => [
    client.id,
    client.code,
    client.name,
    client.ruc,
    client.contact,
    client.phone,
    client.address,
    client.city
];

// Helper to convert sheet row to Service
const rowToService = (row: any[]): Service => ({
    id: row[0] || `service_${Date.now()}`,
    code: row[1] || '',
    name: row[2] || '',
    description: row[3] || '',
    price: parseFloat(row[4]) || 0,
    category: row[5] || '',
    cost: parseFloat(row[6]) || 0
});

// Helper to convert Service to sheet row
const serviceToRow = (service: Service): any[] => [
    service.id,
    service.code,
    service.name,
    service.description,
    service.price,
    service.category,
    service.cost
];

// Helper to convert sheet row to Quote
const rowToQuote = (row: any[]): Quote => ({
    id: row[0] || `quote_${Date.now()}`,
    number: row[1] || '',
    issueDate: row[2] || '',
    validityDate: row[3] || '',
    client: JSON.parse(row[4] || '{}'),
    items: JSON.parse(row[5] || '[]'),
    subtotal: parseFloat(row[6]) || 0,
    iva: parseFloat(row[7]) || 0,
    total: parseFloat(row[8]) || 0,
    notes: row[9] || '',
    status: (row[10] || 'Pendiente') as 'Pendiente' | 'Aceptada' | 'Rechazada',
    companySettings: JSON.parse(row[11] || '{}')
});

// Helper to convert Quote to sheet row
const quoteToRow = (quote: Quote): any[] => [
    quote.id,
    quote.number,
    quote.issueDate,
    quote.validityDate,
    JSON.stringify(quote.client),
    JSON.stringify(quote.items),
    quote.subtotal,
    quote.iva,
    quote.total,
    quote.notes,
    quote.status,
    JSON.stringify(quote.companySettings)
];

// Get Clients from Google Sheets
export const getClients = async (): Promise<Client[]> => {
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_CONFIG.CLIENTS.SHEET_ID,
            range: SHEETS_CONFIG.CLIENTS.RANGE,
        });
        const rows = response.result.values || [];
        return rows.map(rowToClient);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
};

// Save Clients to Google Sheets
export const saveClients = async (clients: Client[]): Promise<void> => {
    try {
        const values = clients.map(clientToRow);
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SHEETS_CONFIG.CLIENTS.SHEET_ID,
            range: SHEETS_CONFIG.CLIENTS.RANGE,
            valueInputOption: 'RAW',
            resource: { values }
        });
    } catch (error) {
        console.error('Error saving clients:', error);
        throw error;
    }
};

// Get Services from Google Sheets
export const getServices = async (): Promise<Service[]> => {
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_CONFIG.SERVICES.SHEET_ID,
            range: SHEETS_CONFIG.SERVICES.RANGE,
        });
        const rows = response.result.values || [];
        return rows.map(rowToService);
    } catch (error) {
        console.error('Error fetching services:', error);
        return [];
    }
};

// Save Services to Google Sheets
export const saveServices = async (services: Service[]): Promise<void> => {
    try {
        const values = services.map(serviceToRow);
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SHEETS_CONFIG.SERVICES.SHEET_ID,
            range: SHEETS_CONFIG.SERVICES.RANGE,
            valueInputOption: 'RAW',
            resource: { values }
        });
    } catch (error) {
        console.error('Error saving services:', error);
        throw error;
    }
};

// Get Quotes from Google Sheets
export const getQuotes = async (): Promise<Quote[]> => {
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_CONFIG.QUOTES.SHEET_ID,
            range: SHEETS_CONFIG.QUOTES.RANGE,
        });
        const rows = response.result.values || [];
        return rows.map(rowToQuote);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        return [];
    }
};

// Save Quotes to Google Sheets
export const saveQuotes = async (quotes: Quote[]): Promise<void> => {
    try {
        const values = quotes.map(quoteToRow);
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SHEETS_CONFIG.QUOTES.SHEET_ID,
            range: SHEETS_CONFIG.QUOTES.RANGE,
            valueInputOption: 'RAW',
            resource: { values }
        });
    } catch (error) {
        console.error('Error saving quotes:', error);
        throw error;
    }
};

// Company Settings (still using localStorage as fallback)
const defaultSettings: CompanySettings = {
    name: 'Tu Empresa S.A.',
    address: 'Tu Dirección, Guayaquil',
    contact: 'tuemail@empresa.com',
    ruc: '1234567890001',
    repName: 'Andrés Nader',
    repTitle: 'Gerente General',
    logo: 'https://placehold.co/200x100/eef2ff/4f46e5?text=Tu+Logo',
    primaryColor: '#1a202c',
    accentColor: '#4f46e5',
    website: '',
    whatsapp: '',
    typography: 'Inter, sans-serif'
};

export const getCompanySettings = (): CompanySettings => {
    const stored = localStorage.getItem('companySettings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
};

export const saveCompanySettings = (data: CompanySettings) => {
    localStorage.setItem('companySettings', JSON.stringify(data));
};

// Quote Counter (still using localStorage)
export const getQuoteCounter = (): number => parseInt(localStorage.getItem('quoteCounter') || '1');
export const incrementQuoteCounter = () => {
    const current = getQuoteCounter();
    localStorage.setItem('quoteCounter', (current + 1).toString());
    return current + 1;
};

// Utility functions
export const downloadFile = (filename: string, text: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};