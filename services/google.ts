
import { Client, Service, Quote, RecurringContract } from '../types';


// CONFIGURACIÓN
const CLIENT_ID = "1005993441268-4sle7juetquq55efkqehm252ebtml4tv.apps.googleusercontent.com";
const SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
].join(' ');

// Template ID para generar documentos
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

export const signIn = async (): Promise<{ userInfo: any, token: string, expiresIn: number }> => {
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

                resolve({
                    userInfo,
                    token: resp.access_token,
                    expiresIn: resp.expires_in || 3600 // Default 1 hora
                });
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

// --- DATABASE INITIALIZATION ---

/**
 * Inicializa la base de datos del usuario (crea un nuevo archivo con 4 hojas)
 */
export const initializeUserDatabase = async (): Promise<string> => {
    const createResponse = await window.gapi.client.sheets.spreadsheets.create({
        resource: {
            properties: {
                title: 'Super Cotizador - Base de Datos'
            },
            sheets: [
                {
                    properties: { title: 'Clientes' },
                    data: [{
                        startRow: 0,
                        startColumn: 0,
                        rowData: [{
                            values: [
                                { userEnteredValue: { stringValue: 'ID' } },
                                { userEnteredValue: { stringValue: 'RUC' } },
                                { userEnteredValue: { stringValue: 'Nombre' } },
                                { userEnteredValue: { stringValue: 'Contacto' } },
                                { userEnteredValue: { stringValue: 'Teléfono' } },
                                { userEnteredValue: { stringValue: 'Email' } },
                                { userEnteredValue: { stringValue: 'Dirección' } },
                                { userEnteredValue: { stringValue: 'Ciudad' } }
                            ]
                        }]
                    }]
                },
                {
                    properties: { title: 'Servicios' },
                    data: [{
                        startRow: 0,
                        startColumn: 0,
                        rowData: [{
                            values: [
                                { userEnteredValue: { stringValue: 'ID' } },
                                { userEnteredValue: { stringValue: 'Código' } },
                                { userEnteredValue: { stringValue: 'Nombre' } },
                                { userEnteredValue: { stringValue: 'Precio' } },
                                { userEnteredValue: { stringValue: 'Descripción' } },
                                { userEnteredValue: { stringValue: 'Categoría' } }
                            ]
                        }]
                    }]
                },
                {
                    properties: { title: 'Cotizaciones' },
                    data: [{
                        startRow: 0,
                        startColumn: 0,
                        rowData: [{
                            values: [
                                { userEnteredValue: { stringValue: 'ID' } },
                                { userEnteredValue: { stringValue: 'Número' } },
                                { userEnteredValue: { stringValue: 'Fecha Emisión' } },
                                { userEnteredValue: { stringValue: 'Fecha Validez' } },
                                { userEnteredValue: { stringValue: 'Cliente JSON' } },
                                { userEnteredValue: { stringValue: 'Items JSON' } },
                                { userEnteredValue: { stringValue: 'Total' } },
                                { userEnteredValue: { stringValue: 'Estado' } },
                                { userEnteredValue: { stringValue: 'Notas' } },
                                { userEnteredValue: { stringValue: 'Doc ID' } }
                            ]
                        }]
                    }]
                },
                {
                    properties: { title: 'Contratos' },
                    data: [{
                        startRow: 0,
                        startColumn: 0,
                        rowData: [{
                            values: [
                                { userEnteredValue: { stringValue: 'ID' } },
                                { userEnteredValue: { stringValue: 'Cliente ID' } },
                                { userEnteredValue: { stringValue: 'Cliente Nombre' } },
                                { userEnteredValue: { stringValue: 'Tipo Servicio' } },
                                { userEnteredValue: { stringValue: 'Nombre Servicio' } },
                                { userEnteredValue: { stringValue: 'Descripción' } },
                                { userEnteredValue: { stringValue: 'Proveedor' } },
                                { userEnteredValue: { stringValue: 'Monto' } },
                                { userEnteredValue: { stringValue: 'Periodo' } },
                                { userEnteredValue: { stringValue: 'Fecha Inicio' } },
                                { userEnteredValue: { stringValue: 'Próxima Renovación' } },
                                { userEnteredValue: { stringValue: 'Estado' } },
                                { userEnteredValue: { stringValue: 'Auto Renovación' } },
                                { userEnteredValue: { stringValue: 'Notas' } }
                            ]
                        }]
                    }]
                }
            ]
        }
    });

    return createResponse.result.spreadsheetId;
};

/**
 * Verifica si un spreadsheet existe y es accesible
 */
export const checkDatabaseExists = async (spreadsheetId: string): Promise<boolean> => {
    try {
        await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId
        });
        return true;
    } catch (error) {
        console.error('Database not accessible:', error);
        return false;
    }
};

/**
 * Busca si ya existe una base de datos en el Drive del usuario
 */
export const findExistingDatabase = async (): Promise<string | null> => {
    try {
        const response = await window.gapi.client.drive.files.list({
            q: "name = 'Super Cotizador - Base de Datos' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            return files[0].id;
        }
        return null;
    } catch (error) {
        console.error('Error searching for database:', error);
        return null;
    }
};

/**
 * Elimina la base de datos (archivo Spreadsheet)
 */
export const deleteDatabase = async (fileId: string): Promise<void> => {
    try {
        await window.gapi.client.drive.files.delete({
            fileId
        });
    } catch (error) {
        console.error('Error deleting database:', error);
        throw error;
    }
};

export const setGapiToken = (token: string) => {
    window.gapi.client.setToken({ access_token: token });
};

// --- DATA METHODS ---

export const fetchClients = async (spreadsheetId: string): Promise<Client[]> => {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Clientes!A2:H',
    });

    return (response.result.values || []).map((row: any[], index: number) => {
        const id = row[0] || '';
        const ruc = row[1] || '';
        const name = row[2] || '';
        const contact = row[3] || '';
        const phone = row[4] || '';
        const email = row[5] || '';
        const address = row[6] || '';
        const city = row[7] || '';

        return {
            rowId: index + 2,
            id: id || ruc || `client_row_${index + 2}`,
            code: ruc,
            name,
            ruc,
            contact: email || contact,
            phone,
            address,
            city
        };
    }).filter((c: Client) => c.ruc || c.name);
};

export const saveClient = async (spreadsheetId: string, client: Client) => {
    const rowData = [
        client.id || client.ruc || `client_${Date.now()}`,
        client.ruc || '',
        client.name || '',
        client.contact || '',
        client.phone || '',
        (client.contact && client.contact.includes('@')) ? client.contact : '',
        client.address || '',
        client.city || ''
    ];

    if (client.rowId) {
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Clientes!A${client.rowId}:H${client.rowId}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [rowData] }
        });
    } else {
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Clientes!A:H',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [rowData] }
        });
    }
};

export const deleteClient = async (spreadsheetId: string, rowId: number) => {
    await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `Clientes!A${rowId}:H${rowId}`,
    });
};

export const fetchServices = async (spreadsheetId: string): Promise<Service[]> => {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Servicios!A2:F',
    });

    return (response.result.values || []).map((row: any[], index: number) => {
        const id = row[0] || `service_row_${index + 2}`;
        const code = row[1] || id;
        const name = row[2] || '';
        const price = parseFloat(String(row[3] || '0').replace(/[^0-9.-]+/g, "")) || 0;
        const description = row[4] || name;
        const category = row[5] || 'General';

        return {
            rowId: index + 2,
            id,
            code,
            name,
            description,
            price,
            category,
            cost: 0
        };
    }).filter((s: Service) => s.id || s.name);
};

export const saveService = async (spreadsheetId: string, service: Service) => {
    const rowData = [
        service.id || `service_${Date.now()}`,
        service.code || '',
        service.name || '',
        service.price || 0,
        service.description || '',
        service.category || 'General'
    ];

    if (service.rowId) {
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Servicios!A${service.rowId}:F${service.rowId}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [rowData] }
        });
    } else {
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Servicios!A:F',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [rowData] }
        });
    }
};

export const deleteService = async (spreadsheetId: string, rowId: number) => {
    await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `Servicios!A${rowId}:F${rowId}`,
    });
};

export const fetchQuotes = async (spreadsheetId: string): Promise<Quote[]> => {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Cotizaciones!A2:J',
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
                client,
                items,
                total: parseFloat(row[6]) || 0,
                status: row[7],
                notes: row[8] || '',
                googleDocId: row[9] || null,
                subtotal: 0,
                iva: 0,
                companySettings: {} as any
            };
        } catch (e) {
            return null;
        }
    }).filter((q: any) => q !== null) as Quote[];
};

export const saveQuote = async (spreadsheetId: string, quote: Quote) => {
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
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Cotizaciones!A${quote.rowId}:J${quote.rowId}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [rowData] }
        });
    } else {
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Cotizaciones!A:J',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [rowData] }
        });
    }
};

export const updateQuoteStatus = async (spreadsheetId: string, rowId: number, status: string) => {
    await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Cotizaciones!H${rowId}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[status]] }
    });
};

export const deleteQuote = async (spreadsheetId: string, rowId: number) => {
    await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `Cotizaciones!A${rowId}:J${rowId}`,
    });
};

export const createQuoteDoc = async (quote: Quote): Promise<string> => {
    const docTitle = `Cotización ${quote.number} - ${quote.client.name}`;

    const copyResp = await window.gapi.client.drive.files.copy({
        fileId: CONTRACT_TEMPLATE_ID,
        resource: { name: docTitle }
    });
    const newDocId = copyResp.result.id;

    const requests = [
        { replaceAllText: { containsText: { text: '{{CLIENTE_NOMBRE}}', matchCase: false }, replaceText: quote.client.name || '' } },
        { replaceAllText: { containsText: { text: '{{CLIENTE_RUC}}', matchCase: false }, replaceText: quote.client.ruc || '' } },
        { replaceAllText: { containsText: { text: '{{COTIZACION_NUMERO}}', matchCase: false }, replaceText: quote.number || '' } },
        { replaceAllText: { containsText: { text: '{{FECHA_EMISION}}', matchCase: false }, replaceText: quote.issueDate || '' } },
        { replaceAllText: { containsText: { text: '{{TOTAL}}', matchCase: false }, replaceText: `$${(quote.total || 0).toFixed(2)}` } },
    ];

    await window.gapi.client.docs.documents.batchUpdate({
        documentId: newDocId,
        resource: { requests }
    });

    return newDocId;
};

// --- CONTRACT METHODS ---

export const fetchContracts = async (spreadsheetId: string): Promise<RecurringContract[]> => {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Contratos!A2:N',
    });

    return (response.result.values || []).map((row: any[], index: number) => {
        if (row.length < 10) return null;
        try {
            return {
                rowId: index + 2,
                id: row[0] || `contract_${index}`,
                clientId: row[1],
                clientName: row[2],
                serviceType: row[3] as any,
                serviceName: row[4],
                description: row[5] || '',
                provider: row[6] || '',
                amount: parseFloat(row[7]) || 0,
                period: row[8] as any,
                startDate: row[9],
                nextRenewalDate: row[10],
                status: row[11] as any,
                autoRenew: row[12] === 'TRUE',
                notes: row[13] || ''
            };
        } catch (e) {
            return null;
        }
    }).filter((c: any) => c !== null) as RecurringContract[];
};

export const saveContract = async (spreadsheetId: string, contract: RecurringContract) => {
    const rowData = [
        contract.id || `contract_${Date.now()}`,
        contract.clientId,
        contract.clientName,
        contract.serviceType,
        contract.serviceName,
        contract.description || '',
        contract.provider || '',
        contract.amount,
        contract.period,
        contract.startDate,
        contract.nextRenewalDate,
        contract.status,
        contract.autoRenew ? 'TRUE' : 'FALSE',
        contract.notes || ''
    ];

    if (contract.rowId) {
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Contratos!A${contract.rowId}:N${contract.rowId}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [rowData] }
        });
    } else {
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Contratos!A:N',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [rowData] }
        });
    }
};

export const deleteContract = async (spreadsheetId: string, rowId: number) => {
    await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `Contratos!A${rowId}:N${rowId}`,
    });
};
