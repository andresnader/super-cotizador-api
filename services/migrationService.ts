// Migration Service - Migración automática de datos desde archivos antiguos

import { Client, Service, Quote } from '../types';

// IDs de los archivos antiguos (hardcodeados)
const OLD_CLIENTS_SHEET_ID = '1JnowPVvio2tSjNSmQH6z8drqejmiwwVthmkFj2eGf2g';
const OLD_SERVICES_SHEET_ID = '19FdGfh7wtznlOHsnp5Ntd9ZF2fSZLd11yUD40VP0VNI';
const OLD_QUOTES_SHEET_ID = '153s8Lhum68zConWSbbFQtbR3dYzkafHy-4YQJ1HpvLk';

interface MigrationProgress {
    stage: 'detecting' | 'clients' | 'services' | 'quotes' | 'complete' | 'error';
    message: string;
    current: number;
    total: number;
}

interface MigrationResult {
    success: boolean;
    clientsCount: number;
    servicesCount: number;
    quotesCount: number;
    error?: string;
}

export const migrationService = {
    /**
     * Detecta si el usuario tiene acceso a los archivos antiguos
     */
    async detectOldFiles(): Promise<boolean> {
        try {
            // Intentar leer un registro de cada archivo
            const promises = [
                window.gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: OLD_CLIENTS_SHEET_ID,
                    range: 'Hoja 1!A1:A1'
                }),
                window.gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: OLD_SERVICES_SHEET_ID,
                    range: 'Hoja 1!A1:A1'
                }),
                window.gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: OLD_QUOTES_SHEET_ID,
                    range: 'Hoja 1!A1:A1'
                })
            ];

            await Promise.all(promises);
            return true; // Tiene acceso a todos los archivos
        } catch (error: any) {
            console.log('No se detectaron archivos antiguos o no hay acceso:', error);
            return false;
        }
    },

    /**
     * Migra todos los datos desde los archivos antiguos al nuevo archivo
     */
    async migrateData(
        newSpreadsheetId: string,
        onProgress: (progress: MigrationProgress) => void
    ): Promise<MigrationResult> {
        const result: MigrationResult = {
            success: false,
            clientsCount: 0,
            servicesCount: 0,
            quotesCount: 0
        };

        try {
            // Etapa 1: Detectar archivos
            onProgress({
                stage: 'detecting',
                message: 'Verificando archivos antiguos...',
                current: 0,
                total: 3
            });

            const hasOldFiles = await this.detectOldFiles();
            if (!hasOldFiles) {
                throw new Error('No se encontraron archivos antiguos para migrar');
            }

            // Etapa 2: Migrar Clientes
            onProgress({
                stage: 'clients',
                message: 'Migrando clientes...',
                current: 0,
                total: 0
            });

            const clients = await this.fetchOldClients();
            result.clientsCount = clients.length;

            if (clients.length > 0) {
                await this.writeClientsToNewFile(newSpreadsheetId, clients, (current, total) => {
                    onProgress({
                        stage: 'clients',
                        message: `Migrando clientes... ${current}/${total}`,
                        current,
                        total
                    });
                });
            }

            // Etapa 3: Migrar Servicios
            onProgress({
                stage: 'services',
                message: 'Migrando servicios...',
                current: 0,
                total: 0
            });

            const services = await this.fetchOldServices();
            result.servicesCount = services.length;

            if (services.length > 0) {
                await this.writeServicesToNewFile(newSpreadsheetId, services, (current, total) => {
                    onProgress({
                        stage: 'services',
                        message: `Migrando servicios... ${current}/${total}`,
                        current,
                        total
                    });
                });
            }

            // Etapa 4: Migrar Cotizaciones
            onProgress({
                stage: 'quotes',
                message: 'Migrando cotizaciones...',
                current: 0,
                total: 0
            });

            const quotes = await this.fetchOldQuotes();
            result.quotesCount = quotes.length;

            if (quotes.length > 0) {
                await this.writeQuotesToNewFile(newSpreadsheetId, quotes, (current, total) => {
                    onProgress({
                        stage: 'quotes',
                        message: `Migrando cotizaciones... ${current}/${total}`,
                        current,
                        total
                    });
                });
            }

            // Migración completada
            result.success = true;
            onProgress({
                stage: 'complete',
                message: 'Migración completada exitosamente',
                current: 3,
                total: 3
            });

            return result;

        } catch (error: any) {
            console.error('Error durante la migración:', error);
            result.error = error.message || 'Error desconocido durante la migración';
            onProgress({
                stage: 'error',
                message: result.error || 'Error desconocido',
                current: 0,
                total: 0
            });
            return result;
        }
    },

    /**
     * Lee clientes del archivo antiguo
     */
    async fetchOldClients(): Promise<Client[]> {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: OLD_CLIENTS_SHEET_ID,
            range: 'Hoja 1!A2:F'
        });

        return (response.result.values || []).map((row: any[], index: number) => {
            const ruc = row[0] || '';
            const name = row[1] || '';
            const contact = row[5] || row[4] || '';
            return {
                id: ruc || `client_${index}`,
                code: ruc,
                name: name,
                ruc: ruc,
                contact: contact,
                phone: row[4] || '',
                address: '',
                city: ''
            };
        }).filter((c: Client) => c.ruc || c.name);
    },

    /**
     * Lee servicios del archivo antiguo
     */
    async fetchOldServices(): Promise<Service[]> {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: OLD_SERVICES_SHEET_ID,
            range: 'Hoja 1!A2:F'
        });

        return (response.result.values || []).map((row: any[], index: number) => {
            const id = row[0] || `service_${index}`;
            const code = row[1] || id;
            const name = row[2] || '';
            const price = parseFloat(String(row[3] || '0').replace(/[^0-9.-]+/g, "")) || 0;
            const description = row[5] || name;

            return {
                id,
                code,
                name,
                description,
                price,
                category: 'General',
                cost: 0
            };
        }).filter((s: Service) => s.id || s.name);
    },

    /**
     * Lee cotizaciones del archivo antiguo
     */
    async fetchOldQuotes(): Promise<Quote[]> {
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: OLD_QUOTES_SHEET_ID,
            range: 'Hoja 1!A2:J'
        });

        return (response.result.values || []).map((row: any[]) => {
            if (row.length < 8) return null;
            try {
                const client = JSON.parse(row[4] || '{}');
                const items = JSON.parse(row[5] || '[]');
                return {
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
    },

    /**
     * Escribe clientes en el nuevo archivo
     */
    async writeClientsToNewFile(
        spreadsheetId: string,
        clients: Client[],
        onProgress: (current: number, total: number) => void
    ): Promise<void> {
        const rows = clients.map(c => [
            c.id,
            c.ruc,
            c.name,
            c.contact,
            c.phone,
            c.contact,
            c.address,
            c.city
        ]);

        onProgress(0, rows.length);

        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Clientes!A2',
            valueInputOption: 'USER_ENTERED',
            resource: { values: rows }
        });

        onProgress(rows.length, rows.length);
    },

    /**
     * Escribe servicios en el nuevo archivo
     */
    async writeServicesToNewFile(
        spreadsheetId: string,
        services: Service[],
        onProgress: (current: number, total: number) => void
    ): Promise<void> {
        const rows = services.map(s => [
            s.id,
            s.code,
            s.name,
            s.price,
            s.description,
            s.category
        ]);

        onProgress(0, rows.length);

        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Servicios!A2',
            valueInputOption: 'USER_ENTERED',
            resource: { values: rows }
        });

        onProgress(rows.length, rows.length);
    },

    /**
     * Escribe cotizaciones en el nuevo archivo
     */
    async writeQuotesToNewFile(
        spreadsheetId: string,
        quotes: Quote[],
        onProgress: (current: number, total: number) => void
    ): Promise<void> {
        const rows = quotes.map(q => [
            q.id,
            q.number,
            q.issueDate,
            q.validityDate,
            JSON.stringify(q.client),
            JSON.stringify(q.items),
            q.total,
            q.status,
            q.notes,
            q.googleDocId || ''
        ]);

        onProgress(0, rows.length);

        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Cotizaciones!A2',
            valueInputOption: 'USER_ENTERED',
            resource: { values: rows }
        });

        onProgress(rows.length, rows.length);
    }
};

export type { MigrationProgress, MigrationResult };
