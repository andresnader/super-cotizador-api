
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

export const signIn = async (options: { prompt?: string } = {}): Promise<{ userInfo: any, token: string, expiresIn: number }> => {
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

        const requestConfig: any = { prompt: 'consent' };
        if (options.prompt) {
            requestConfig.prompt = options.prompt;
        }

        tokenClient.requestAccessToken(requestConfig);
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
                },
                {
                    properties: { title: 'Configuracion' },
                    data: [{
                        startRow: 0,
                        startColumn: 0,
                        rowData: [{
                            values: [
                                { userEnteredValue: { stringValue: 'Key' } },
                                { userEnteredValue: { stringValue: 'Value' } }
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

/**
 * Importa datos desde otra hoja de cálculo (Merge)
 */
export const importFromSpreadsheet = async (sourceSpreadsheetId: string, targetSpreadsheetId: string): Promise<{ clients: number, services: number }> => {
    // 1. Fetch data from source
    const sourceClients = await fetchClients(sourceSpreadsheetId);
    const sourceServices = await fetchServices(sourceSpreadsheetId);

    // 2. Fetch current data to check for duplicates
    const currentClients = await fetchClients(targetSpreadsheetId);
    const currentServices = await fetchServices(targetSpreadsheetId);

    let newClientsCount = 0;
    let newServicesCount = 0;

    // 3. Filter and Save Clients
    const existingClientIds = new Set(currentClients.map(c => c.ruc || c.name));

    for (const client of sourceClients) {
        const key = client.ruc || client.name;
        if (!existingClientIds.has(key)) {
            await saveClient(targetSpreadsheetId, { ...client, rowId: undefined });
            newClientsCount++;
        }
    }

    // 4. Filter and Save Services
    const existingServiceIds = new Set(currentServices.map(s => s.code || s.name));

    for (const service of sourceServices) {
        const key = service.code || service.name;
        if (!existingServiceIds.has(key)) {
            await saveService(targetSpreadsheetId, { ...service, rowId: undefined });
            newServicesCount++;
        }
    }

    return { clients: newClientsCount, services: newServicesCount };
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

/**
 * Helper to convert HEX color to RGB for Google Docs API
 */
function hexToRgb(hex: string): { red: number; green: number; blue: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        red: parseInt(result[1], 16) / 255,
        green: parseInt(result[2], 16) / 255,
        blue: parseInt(result[3], 16) / 255
    } : { red: 0.31, green: 0.27, blue: 0.90 }; // Default indigo
}

/**
 * Creates a formatted Google Doc for a quote
 */
export const createQuoteDoc = async (quote: Quote): Promise<string> => {
    const docTitle = `Cotización ${quote.number} - ${quote.client.name}`;
    const settings = quote.companySettings;

    // Convert company colors
    const primaryRGB = hexToRgb(settings.primaryColor);
    const accentRGB = hexToRgb(settings.accentColor);

    // Create a new blank document
    const createResp = await window.gapi.client.docs.documents.create({
        resource: {
            title: docTitle
        }
    });
    const newDocId = createResp.result.documentId;

    // Build the document content using batch update requests
    const requests: any[] = [];
    let currentIndex = 1;

    // Helper to add text with styling
    const addText = (text: string, style?: any) => {
        requests.push({
            insertText: {
                location: { index: currentIndex },
                text: text
            }
        });
        if (style) {
            requests.push({
                updateTextStyle: {
                    range: {
                        startIndex: currentIndex,
                        endIndex: currentIndex + text.length
                    },
                    textStyle: style,
                    fields: Object.keys(style).join(',')
                }
            });
        }
        currentIndex += text.length;
    };

    // Helper to add paragraph style
    const addParagraphStyle = (startIdx: number, endIdx: number, style: any) => {
        requests.push({
            updateParagraphStyle: {
                range: { startIndex: startIdx, endIndex: endIdx },
                paragraphStyle: style,
                fields: Object.keys(style).join(',')
            }
        });
    };

    // Logo placeholder (company name in color)
    const logoStart = currentIndex;
    addText(`${settings.name}\n`, {
        bold: true,
        fontSize: { magnitude: 14, unit: 'PT' },
        foregroundColor: { color: { rgbColor: primaryRGB } }
    });
    addParagraphStyle(logoStart, currentIndex, { alignment: 'START' });

    // Title - "COTIZACIÓN"
    const titleStart = currentIndex;
    addText('COTIZACIÓN\n', {
        bold: true,
        fontSize: { magnitude: 28, unit: 'PT' },
        foregroundColor: { color: { rgbColor: accentRGB } }
    });
    addParagraphStyle(titleStart, currentIndex, { alignment: 'END' });

    // Quote Number
    const numberStart = currentIndex;
    addText(`Nº: ${quote.number}\n\n`, {
        fontSize: { magnitude: 12, unit: 'PT' }
    });
    addParagraphStyle(numberStart, currentIndex, { alignment: 'END' });

    // Client and Company Info
    addText('FACTURAR A (CLIENTE):\n', {
        bold: true,
        fontSize: { magnitude: 10, unit: 'PT' },
        foregroundColor: { color: { rgbColor: { red: 0.4, green: 0.4, blue: 0.4 } } }
    });
    addText(`${quote.client.name}\n`, { bold: true, fontSize: { magnitude: 11, unit: 'PT' } });
    addText(`RUC/CI: ${quote.client.ruc}\n`, { fontSize: { magnitude: 10, unit: 'PT' } });
    if (quote.client.address) addText(`Dir: ${quote.client.address}\n`, { fontSize: { magnitude: 10, unit: 'PT' } });
    if (quote.client.phone) addText(`Tel: ${quote.client.phone}\n`, { fontSize: { magnitude: 10, unit: 'PT' } });
    if (quote.client.contact) addText(`Email: ${quote.client.contact}\n`, { fontSize: { magnitude: 10, unit: 'PT' } });
    addText('\n');

    addText('DE (EMISOR):\n', {
        bold: true,
        fontSize: { magnitude: 10, unit: 'PT' },
        foregroundColor: { color: { rgbColor: { red: 0.4, green: 0.4, blue: 0.4 } } }
    });
    addText(`${settings.name}\n`, { bold: true, fontSize: { magnitude: 11, unit: 'PT' } });
    addText(`${settings.ruc}\n${settings.address}\n${settings.contact}\n\n`, { fontSize: { magnitude: 10, unit: 'PT' } });

    // Dates section
    const datesStart = currentIndex;
    addText(`FECHA DE EMISIÓN: ${quote.issueDate}     VÁLIDA HASTA: ${quote.validityDate}\n\n`, {
        fontSize: { magnitude: 10, unit: 'PT' },
        bold: true
    });
    addParagraphStyle(datesStart, currentIndex, { alignment: 'CENTER' });

    // Table header
    const tableHeaderStart = currentIndex;
    addText('DESCRIPCIÓN\tCANT.\tPRECIO UNIT.\tTOTAL\n', {
        bold: true,
        fontSize: { magnitude: 11, unit: 'PT' },
        foregroundColor: { color: { rgbColor: { red: 1, green: 1, blue: 1 } } }
    });
    requests.push({
        updateParagraphStyle: {
            range: { startIndex: tableHeaderStart, endIndex: currentIndex },
            paragraphStyle: {
                shading: {
                    backgroundColor: { color: { rgbColor: primaryRGB } }
                }
            },
            fields: 'shading'
        }
    });

    // Items
    quote.items.forEach((item, idx) => {
        const itemStart = currentIndex;
        addText(`${item.name} (${item.code})\t${item.quantity}\t$${item.price.toFixed(2)}\t$${(item.price * item.quantity).toFixed(2)}\n`, {
            fontSize: { magnitude: 10, unit: 'PT' }
        });
        if (item.description) {
            addText(`${item.description}\n`, {
                fontSize: { magnitude: 9, unit: 'PT' },
                foregroundColor: { color: { rgbColor: { red: 0.4, green: 0.4, blue: 0.4 } } }
            });
        }

        if (idx % 2 === 0) {
            requests.push({
                updateParagraphStyle: {
                    range: { startIndex: itemStart, endIndex: currentIndex },
                    paragraphStyle: {
                        shading: {
                            backgroundColor: { color: { rgbColor: { red: 0.97, green: 0.97, blue: 0.97 } } }
                        }
                    },
                    fields: 'shading'
                }
            });
        }
    });

    addText('\n');

    // Totals
    const totalsStart = currentIndex;
    addText(`Subtotal: $${quote.subtotal.toFixed(2)}\n`, { fontSize: { magnitude: 11, unit: 'PT' } });
    addText(`IVA (15%): $${quote.iva.toFixed(2)}\n`, { fontSize: { magnitude: 11, unit: 'PT' } });
    addParagraphStyle(totalsStart, currentIndex, { alignment: 'END' });

    const totalStart = currentIndex;
    addText(`TOTAL: $${quote.total.toFixed(2)}\n\n`, {
        bold: true,
        fontSize: { magnitude: 16, unit: 'PT' },
        foregroundColor: { color: { rgbColor: accentRGB } }
    });
    addParagraphStyle(totalStart, currentIndex, { alignment: 'END' });

    // Notes
    if (quote.notes) {
        addText('TÉRMINOS Y CONDICIONES / NOTAS:\n', {
            bold: true,
            fontSize: { magnitude: 10, unit: 'PT' }
        });
        addText(`${quote.notes}\n\n`, { fontSize: { magnitude: 9, unit: 'PT' } });
    }

    // Footer
    const footerStart = currentIndex;
    let footerText = '';
    if (settings.website) footerText += settings.website;
    if (settings.contact) footerText += (footerText ? '  •  ' : '') + settings.contact;
    if (settings.whatsapp) footerText += (footerText ? '  •  ' : '') + `WhatsApp: ${settings.whatsapp}`;
    footerText += '\nGracias por su preferencia.\n';
    addText(footerText, {
        fontSize: { magnitude: 9, unit: 'PT' },
        foregroundColor: { color: { rgbColor: { red: 0.5, green: 0.5, blue: 0.5 } } }
    });
    addParagraphStyle(footerStart, currentIndex, { alignment: 'CENTER' });

    // Apply all requests
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

// --- SETTINGS METHODS ---

export const fetchCompanySettings = async (spreadsheetId: string): Promise<any> => {
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Configuracion!A2:B',
        });

        const rows = response.result.values || [];
        const settings: any = {};

        rows.forEach((row: any[]) => {
            if (row[0] && row[1]) {
                try {
                    settings[row[0]] = JSON.parse(row[1]);
                } catch {
                    settings[row[0]] = row[1];
                }
            }
        });

        return settings;
    } catch (error) {
        console.warn('Error fetching settings from Google Sheets', error);
        return {};
    }
};

export const saveCompanySettings = async (spreadsheetId: string, settings: any) => {
    const rows = Object.entries(settings).map(([key, value]) => [
        key,
        JSON.stringify(value)
    ]);

    // First clear existing settings
    await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: 'Configuracion!A2:B',
    });

    if (rows.length > 0) {
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Configuracion!A2',
            valueInputOption: 'USER_ENTERED',
            resource: { values: rows }
        });
    }
};
