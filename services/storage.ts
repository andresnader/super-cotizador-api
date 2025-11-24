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

export const getClients = (): Client[] => JSON.parse(localStorage.getItem('clients') || '[]');
export const saveClients = (data: Client[]) => localStorage.setItem('clients', JSON.stringify(data));

export const getServices = (): Service[] => JSON.parse(localStorage.getItem('services') || '[]');
export const saveServices = (data: Service[]) => localStorage.setItem('services', JSON.stringify(data));

export const getQuotes = (): Quote[] => JSON.parse(localStorage.getItem('quotesHistory') || '[]');
export const saveQuotes = (data: Quote[]) => localStorage.setItem('quotesHistory', JSON.stringify(data));

export const getContracts = (): Contract[] => JSON.parse(localStorage.getItem('contracts') || '[]');
export const saveContracts = (data: Contract[]) => localStorage.setItem('contracts', JSON.stringify(data));

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
        clients: getClients(),
        services: getServices(),
        quotesHistory: getQuotes(),
        contracts: getContracts(),
        quoteCounter: getQuoteCounter(),
        companySettings: getCompanySettings()
    }, null, 2);
}

export const importData = (jsonStr: string) => {
    try {
        const data = JSON.parse(jsonStr);
        if (data.__ameizin_version !== 'v1.0') throw new Error("Invalid version");
        saveClients(data.clients || []);
        saveServices(data.services || []);
        saveQuotes(data.quotesHistory || []);
        saveContracts(data.contracts || []);
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

    // Normalizar cabeceras: minúsculas y sin caracteres especiales
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
        // Añadir el último valor
        if (colIndex < headers.length) {
            rowData[headers[colIndex]] = currentValue.trim().replace(/^"|"$/g, '');
        }
        
        if (Object.keys(rowData).length > 0) {
            data.push(rowData);
        }
    }
    return { headers, data };
};