
import { Client, Service, Quote, Contract, CompanySettings } from '../types';

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

// Synchronous helpers for internal use
const _getClients = (): Client[] => JSON.parse(localStorage.getItem('clients') || '[]');
const _saveClients = (data: Client[]) => localStorage.setItem('clients', JSON.stringify(data));

const _getServices = (): Service[] => JSON.parse(localStorage.getItem('services') || '[]');
const _saveServices = (data: Service[]) => localStorage.setItem('services', JSON.stringify(data));

const _getQuotes = (): Quote[] => JSON.parse(localStorage.getItem('quotesHistory') || '[]');
const _saveQuotes = (data: Quote[]) => localStorage.setItem('quotesHistory', JSON.stringify(data));

const _getContracts = (): Contract[] => JSON.parse(localStorage.getItem('contracts') || '[]');
const _saveContracts = (data: Contract[]) => localStorage.setItem('contracts', JSON.stringify(data));

// --- Async Interface implementation for DataManager ---

export const fetchClients = async (): Promise<Client[]> => {
    return Promise.resolve(_getClients());
};

export const saveClient = async (client: Client): Promise<void> => {
    const clients = _getClients();
    if (client.id && clients.some(c => c.id === client.id)) {
        const index = clients.findIndex(c => c.id === client.id);
        clients[index] = { ...client, rowId: client.id }; // Use ID as rowId for local
    } else {
        client.id = client.id || `client_${Date.now()}`;
        client.rowId = client.id;
        clients.push(client);
    }
    _saveClients(clients);
    return Promise.resolve();
};

export const deleteClient = async (rowId: any): Promise<void> => {
    const clients = _getClients();
    const newClients = clients.filter(c => c.id !== rowId); // For local, rowId is the ID
    _saveClients(newClients);
    return Promise.resolve();
};

export const fetchServices = async (): Promise<Service[]> => {
    return Promise.resolve(_getServices());
};

export const saveService = async (service: Service): Promise<void> => {
    const services = _getServices();
    if (service.id && services.some(s => s.id === service.id)) {
        const index = services.findIndex(s => s.id === service.id);
        services[index] = { ...service, rowId: service.id };
    } else {
        service.id = service.id || `service_${Date.now()}`;
        service.rowId = service.id;
        services.push(service);
    }
    _saveServices(services);
    return Promise.resolve();
};

export const deleteService = async (rowId: any): Promise<void> => {
    const services = _getServices();
    const newServices = services.filter(s => s.id !== rowId);
    _saveServices(newServices);
    return Promise.resolve();
};

export const fetchQuotes = async (): Promise<Quote[]> => {
    return Promise.resolve(_getQuotes());
};

export const saveQuote = async (quote: Quote): Promise<void> => {
    const quotes = _getQuotes();
    // Local quotes usually are immutable history, but we allow status updates
    const index = quotes.findIndex(q => q.id === quote.id);
    if (index >= 0) {
        quotes[index] = { ...quote, rowId: quote.id };
    } else {
        quote.rowId = quote.id;
        quotes.push(quote);
    }
    _saveQuotes(quotes);
    return Promise.resolve();
};

export const updateQuoteStatus = async (rowId: any, status: string): Promise<void> => {
    const quotes = _getQuotes();
    const index = quotes.findIndex(q => q.id === rowId);
    if (index >= 0) {
        quotes[index].status = status as any;
        _saveQuotes(quotes);
    }
    return Promise.resolve();
};

// --- Settings & Utils ---

export const getCompanySettings = (): CompanySettings => {
  const stored = localStorage.getItem('companySettings');
  return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
};
export const saveCompanySettings = (data: CompanySettings) => localStorage.setItem('companySettings', JSON.stringify(data));

export const getQuoteCounter = (): number => parseInt(localStorage.getItem('quoteCounter') || '1');
export const incrementQuoteCounter = () => {
  const current = getQuoteCounter();
  localStorage.setItem('quoteCounter', (current + 1).toString());
  return current + 1;
};

// Full backup/restore
export const exportData = () => {
    return JSON.stringify({
        __ameizin_version: 'v1.0',
        clients: _getClients(),
        services: _getServices(),
        quotesHistory: _getQuotes(),
        contracts: _getContracts(),
        quoteCounter: getQuoteCounter(),
        companySettings: getCompanySettings()
    }, null, 2);
}

export const importData = (jsonStr: string) => {
    try {
        const data = JSON.parse(jsonStr);
        if (data.__ameizin_version !== 'v1.0') throw new Error("Invalid version");
        _saveClients(data.clients || []);
        _saveServices(data.services || []);
        _saveQuotes(data.quotesHistory || []);
        _saveContracts(data.contracts || []);
        saveCompanySettings(data.companySettings || defaultSettings);
        localStorage.setItem('quoteCounter', (data.quoteCounter || 1).toString());
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

// Utilidades CSV
export const downloadFile = (filename: string, text: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

export const parseCSV = (csvText: string) => {
    const rows = csvText.trim().split('\n').map(row => row.trim()).filter(row => row.length > 0);
    if (rows.length === 0) return { headers: [], data: [] };

    const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''));
    const data: any[] = [];
    const separator = ',';

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowData: any = {};
        let currentValue = '';
        let inQuotes = false;
        let colIndex = 0;

        for (let j = 0; j < row.length; j++) {
            const char = row[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
                if (colIndex < headers.length) {
                    rowData[headers[colIndex]] = currentValue.trim().replace(/^"|"$/g, '');
                }
                currentValue = '';
                colIndex++;
            } else {
                currentValue += char;
            }
        }
        if (colIndex < headers.length) {
            rowData[headers[colIndex]] = currentValue.trim().replace(/^"|"$/g, '');
        }
        if (Object.keys(rowData).length > 0) {
            data.push(rowData);
        }
    }
    return { headers, data };
};

// Export for DataManager usage
export const getClients = _getClients;
export const saveClients = _saveClients;
export const getServices = _getServices;
export const saveServices = _saveServices;
export const getQuotes = _getQuotes;
export const saveQuotes = _saveQuotes;
export const getContracts = _getContracts;
export const saveContracts = _saveContracts;
