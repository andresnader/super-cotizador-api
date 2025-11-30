
import { AuthMode, Client, Service, Quote, DataService, RecurringContract } from '../types';
import * as googleService from './google';
import * as storageService from './storage';
import { sessionService } from './sessionService';

class DataManager implements DataService {
    private mode: AuthMode = 'local';

    setMode(mode: AuthMode) {
        this.mode = mode;
    }

    getMode(): AuthMode {
        return this.mode;
    }

    private getSpreadsheetId(): string {
        if (this.mode !== 'google') {
            throw new Error('Spreadsheet ID only available in Google mode');
        }
        const id = sessionService.getSpreadsheetId();
        if (!id) {
            throw new Error('No spreadsheet ID found. Please initialize database first.');
        }
        return id;
    }

    async fetchClients(): Promise<Client[]> {
        return this.mode === 'google'
            ? googleService.fetchClients(this.getSpreadsheetId())
            : storageService.fetchClients();
    }

    async saveClient(client: Client): Promise<void> {
        return this.mode === 'google'
            ? googleService.saveClient(this.getSpreadsheetId(), client)
            : storageService.saveClient(client);
    }

    async deleteClient(rowId: any): Promise<void> {
        return this.mode === 'google'
            ? googleService.deleteClient(this.getSpreadsheetId(), rowId)
            : storageService.deleteClient(rowId);
    }

    async fetchServices(): Promise<Service[]> {
        return this.mode === 'google'
            ? googleService.fetchServices(this.getSpreadsheetId())
            : storageService.fetchServices();
    }

    async saveService(service: Service): Promise<void> {
        return this.mode === 'google'
            ? googleService.saveService(this.getSpreadsheetId(), service)
            : storageService.saveService(service);
    }

    async deleteService(rowId: any): Promise<void> {
        return this.mode === 'google'
            ? googleService.deleteService(this.getSpreadsheetId(), rowId)
            : storageService.deleteService(rowId);
    }

    async fetchQuotes(): Promise<Quote[]> {
        return this.mode === 'google'
            ? googleService.fetchQuotes(this.getSpreadsheetId())
            : storageService.fetchQuotes();
    }

    async saveQuote(quote: Quote): Promise<void> {
        return this.mode === 'google'
            ? googleService.saveQuote(this.getSpreadsheetId(), quote)
            : storageService.saveQuote(quote);
    }

    async deleteQuote(rowId: any): Promise<void> {
        return this.mode === 'google'
            ? googleService.deleteQuote(this.getSpreadsheetId(), rowId)
            : storageService.deleteQuote(rowId);
    }

    async updateQuoteStatus(rowId: any, status: string): Promise<void> {
        return this.mode === 'google'
            ? googleService.updateQuoteStatus(this.getSpreadsheetId(), rowId, status)
            : storageService.updateQuoteStatus(rowId, status);
    }

    async createQuoteDoc(quote: Quote): Promise<string> {
        if (this.mode === 'google') {
            return googleService.createQuoteDoc(quote);
        } else {
            throw new Error("La generación de Google Docs no está disponible en modo local.");
        }
    }

    async fetchContracts(): Promise<RecurringContract[]> {
        return this.mode === 'google'
            ? googleService.fetchContracts(this.getSpreadsheetId())
            : storageService.fetchContracts();
    }

    async saveContract(contract: RecurringContract): Promise<void> {
        return this.mode === 'google'
            ? googleService.saveContract(this.getSpreadsheetId(), contract)
            : storageService.saveContract(contract);
    }

    async deleteContract(rowId: any): Promise<void> {
        return this.mode === 'google'
            ? googleService.deleteContract(this.getSpreadsheetId(), rowId)
            : storageService.deleteContract(rowId);
    }

    async fetchCompanySettings(): Promise<any> {
        if (this.mode === 'google') {
            try {
                const settings = await googleService.fetchCompanySettings(this.getSpreadsheetId());
                // Merge with default settings to ensure all fields exist
                return { ...storageService.getCompanySettings(), ...settings };
            } catch (e) {
                console.warn("Error fetching settings from Google, falling back to local", e);
                return storageService.getCompanySettings();
            }
        }
        return storageService.getCompanySettings();
    }

    async saveCompanySettings(settings: any): Promise<void> {
        // Always save to local storage as backup/cache
        storageService.saveCompanySettings(settings);

        if (this.mode === 'google') {
            await googleService.saveCompanySettings(this.getSpreadsheetId(), settings);
        }
    }
}

export const dataManager = new DataManager();
