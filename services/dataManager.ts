
import { AuthMode, Client, Service, Quote, DataService } from '../types';
import * as googleService from './google';
import * as storageService from './storage';

class DataManager implements DataService {
    private mode: AuthMode = 'local';

    setMode(mode: AuthMode) {
        this.mode = mode;
    }

    getMode(): AuthMode {
        return this.mode;
    }

    async fetchClients(): Promise<Client[]> {
        return this.mode === 'google' ? googleService.fetchClients() : storageService.fetchClients();
    }

    async saveClient(client: Client): Promise<void> {
        return this.mode === 'google' ? googleService.saveClient(client) : storageService.saveClient(client);
    }

    async deleteClient(rowId: any): Promise<void> {
        return this.mode === 'google' ? googleService.deleteClient(rowId) : storageService.deleteClient(rowId);
    }

    async fetchServices(): Promise<Service[]> {
        return this.mode === 'google' ? googleService.fetchServices() : storageService.fetchServices();
    }

    async saveService(service: Service): Promise<void> {
        return this.mode === 'google' ? googleService.saveService(service) : storageService.saveService(service);
    }

    async deleteService(rowId: any): Promise<void> {
        return this.mode === 'google' ? googleService.deleteService(rowId) : storageService.deleteService(rowId);
    }

    async fetchQuotes(): Promise<Quote[]> {
        return this.mode === 'google' ? googleService.fetchQuotes() : storageService.fetchQuotes();
    }

    async saveQuote(quote: Quote): Promise<void> {
        return this.mode === 'google' ? googleService.saveQuote(quote) : storageService.saveQuote(quote);
    }

    async updateQuoteStatus(rowId: any, status: string): Promise<void> {
        return this.mode === 'google' ? googleService.updateQuoteStatus(rowId, status) : storageService.updateQuoteStatus(rowId, status);
    }

    async createQuoteDoc(quote: Quote): Promise<string> {
        if (this.mode === 'google') {
            return googleService.createQuoteDoc(quote);
        } else {
            throw new Error("La generación de Google Docs no está disponible en modo local.");
        }
    }
}

export const dataManager = new DataManager();
