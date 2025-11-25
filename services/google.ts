
import { Client, Service, Quote, CompanySettings } from '../types';

// CONFIGURACIÓN
const CLIENT_ID = "1005993441268-4sle7juetquq55efkqehm252ebtml4tv.apps.googleusercontent.com";
const SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
].join(' ');

// SHEET IDs
const CLIENTS_SHEET_ID = '1JnowPVvio2tSjNSmQH6z8drqejmiwwVthmkFj2eGf2g';
const CLIENTS_SHEET_RANGE = 'Hoja 1!A2:F';
const SERVICES_SHEET_ID = '19FdGfh7wtznlOHsnp5Ntd9ZF2fSZLd11yUD40VP0VNI';
const SERVICES_SHEET_RANGE = 'Hoja 1!A2:E';
const QUOTES_SHEET_ID = '153s8Lhum68zConWSbbFQtbR3dYzkafHy-4YQJ1HpvLk';
const QUOTES_SHEET_RANGE = 'Hoja 1!A2:J';
const CONTRACT_TEMPLATE_ID = '1MNE19Ymp40dTZ4Ulv31An3EWVRc8SW-ktD2H-dOFSa4';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Tipos para window global
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

export const initializeGoogleApi = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const script1 = document.createElement('script');
        script1.src = 'https://apis.google.com/js/api.js';
        script1.async = true;
        script1.defer = true;
        script1.onload = () => {
            window.gapi.load('client', async () => {
                try {
                    await window.gapi.client.init({
                        discoveryDocs: [
                            'https://sheets.googleapis.com/$discovery/rest?version=v4',
                            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                            'https://docs.googleapis.com/$discovery/rest?version=v1'
                        ],
                    });
                    gapiInited = true;
                    if (gisInited) resolve();
                } catch (err) {
                    reject(err);
                }
            });
        };
        document.body.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = 'https://accounts.google.com/gsi/client';
        script2.async = true;
        script2.defer = true;
        script2.onload = () => {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (resp: any) => {
                    if (resp.error) {
                        throw resp;
                    }
                }, // Callback manejado en signIn
            });
            gisInited = true;
            if (gapiInited) resolve();
        };
        document.body.appendChild(script2);
    });
};

export const signIn = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                reject(resp);
            }
            // Obtener info de usuario
            try {
                const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { 'Authorization': `Bearer ${resp.access_token}` }
                }).then(res => res.json());
                resolve(userInfo);
            } catch (err) {
                reject(err);
            }
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

export const signOut = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token);
        window.gapi.client.setToken('');
    }
};

// --- DATA METHODS ---

export const fetchClients = async (): Promise<Client[]> => {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: CLIENTS_SHEET_ID,
        range: CLIENTS_SHEET_RANGE,
    });
    
    return (response.result.values || []).map((row: any[], index: number) => {
        const ruc = row[0] || '';
        const name = row[1] || '';
        const contact = row[5] || row[4] || '';
        return {
            rowId: index + 2,
            id: ruc || `client_row_${index + 2}`,
            code: ruc,
            name: name,
            ruc: ruc,
            contact: contact,
            phone: row[4] || '',
            address: '', // No mapeado en sheet original pero requerido por interfaz
            city: ''
        };
    }).filter((c: Client) => c.ruc || c.name);
};

export const saveClient = async (client: Client) => {
    const isEmail = client.contact.includes('@');
    const rowData = [
        client.ruc,
        client.name,
        client.name,
        '',
        isEmail ? client.phone : client.contact,
        isEmail ? client.contact : ''
    ];

    if (client.rowId) {
        // Update
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CLIENTS_SHEET_ID,
            range: `Hoja 1!A${client.rowId}:F${client.rowId}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [rowData] }
        });
    } else {
        // Create
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CLIENTS_SHEET_ID,
            range: 'Hoja 1!A:F',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [rowData] }
        });
    }
};

export const deleteClient = async (rowId: number) => {
    await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: CLIENTS_SHEET_ID,
        range: `Hoja 1!A${rowId}:F${rowId}`,
    });
};

export const fetchServices = async (): Promise<Service[]> => {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SERVICES_SHEET_ID,
        range: SERVICES_SHEET_RANGE,
    });

    return (response.result.values || []).map((row: any[], index: number) => {
        const id = row[0] || '';
        const name = row[2] || '';
        const price = parseFloat(String(row[3] || '0').replace(/[^0-9.-]+/g,"")) || 0;
        return {
            rowId: index + 2,
            id: id || `service_row_${index + 2}`,
            code: id, // Usando ID como código visual
            name: name,
            description: name,
            price: price,
            category: 'General',
            cost: 0
        };
    }).filter((s: Service) => s.id || s.name);
};

export const saveService = async (service: Service) => {
    const rowData = [
        service.id || `service_${Date.now()}`,
        '',
        service.name,
        service.price,
        new Date().toISOString()
    ];

    if (service.rowId) {
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SERVICES_SHEET_ID,
            range: `Hoja 1!A${service.rowId}:E${service.rowId}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [rowData] }
        });
    } else {
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SERVICES_SHEET_ID,
            range: 'Hoja 1!A:E',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [rowData] }
        });
    }
};

export const deleteService = async (rowId: number) => {
    await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: SERVICES_SHEET_ID,
        range: `Hoja 1!A${rowId}:E${rowId}`,
    });
};

export const fetchQuotes = async (): Promise<Quote[]> => {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: QUOTES_SHEET_ID,
        range: QUOTES_SHEET_RANGE,
    });

    return (response.result.values || []).map((row: any[], index: number) => {
        if (row.length < 8) return null;
        try {
            const client = JSON.parse(row[4] || '{}');
            const items = JSON.parse(row[5] || '[]');
            return {
                rowId: index + 2,
                id: row[0],
                number: row[1],
                issueDate: row[2],
                validityDate: row[3],
                client: client,
                items: items,
                total: parseFloat(row[6]) || 0,
                status: row[7],
                notes: row[8] || '',
                googleDocId: row[9] || null,
                subtotal: 0, // Calculado si necesario o guardado
                iva: 0,
                companySettings: {} as any // Se llena al cargar si necesario
            };
        } catch (e) {
            return null;
        }
    }).filter((q: any) => q !== null) as Quote[];
};

export const saveQuote = async (quote: Quote) => {
    const rowData = [
        quote.id,
        quote.number,
        quote.issueDate,
        quote.validityDate,
        JSON.stringify(quote.client),
        JSON.stringify(quote.items),
        quote.total,
        quote.status,
        quote.notes,
        quote.googleDocId || ''
    ];

    if (quote.rowId) {
        // Update existing (mostly status)
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: QUOTES_SHEET_ID,
            range: `Hoja 1!A${quote.rowId}:J${quote.rowId}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [rowData] }
        });
    } else {
        // Append
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: QUOTES_SHEET_ID,
            range: 'Hoja 1!A:J',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [rowData] }
        });
    }
};

export const updateQuoteStatus = async (rowId: number, status: string) => {
    await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: QUOTES_SHEET_ID,
        range: `Hoja 1!H${rowId}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[status]] }
    });
};

export const createQuoteDoc = async (quote: Quote): Promise<string> => {
    const docTitle = `Cotización ${quote.number} - ${quote.client.name}`;
    
    // 1. Copy Template
    const copyResp = await window.gapi.client.drive.files.copy({
        fileId: CONTRACT_TEMPLATE_ID,
        resource: { name: docTitle }
    });
    const newDocId = copyResp.result.id;

    // 2. Replace Text
    const requests = [
        { replaceAllText: { containsText: { text: '{{CLIENTE_NOMBRE}}', matchCase: false }, replaceText: quote.client.name || '' } },
        { replaceAllText: { containsText: { text: '{{CLIENTE_RUC}}', matchCase: false }, replaceText: quote.client.ruc || '' } },
        { replaceAllText: { containsText: { text: '{{COTIZACION_NUMERO}}', matchCase: false }, replaceText: quote.number || '' } },
        { replaceAllText: { containsText: { text: '{{FECHA_EMISION}}', matchCase: false }, replaceText: quote.issueDate || '' } },
        { replaceAllText: { containsText: { text: '{{TOTAL}}', matchCase: false }, replaceText: `$${(quote.total || 0).toFixed(2)}` } },
        // Add more replacements as needed
    ];

    await window.gapi.client.docs.documents.batchUpdate({
        documentId: newDocId,
        resource: { requests }
    });

    return newDocId;
};
