
import { AuthMode, Client, Service, Quote, DataService, RecurringContract, CompanySettings } from '../types';
import * as firestoreService from './firestore';
import * as storageService from './storage';

class DataManager implements DataService {
    private mode: AuthMode = 'local';

    setMode(mode: AuthMode) {
        this.mode = mode;
    }

    getMode(): AuthMode {
        return this.mode;
    }

    private isFirebase(): boolean {
        return this.mode === 'firebase';
    }

    async fetchClients(): Promise<Client[]> {
        return this.isFirebase()
            ? firestoreService.fetchClients()
            : storageService.fetchClients();
    }

    async saveClient(client: Client): Promise<void> {
        return this.isFirebase()
            ? firestoreService.saveClient(client)
            : storageService.saveClient(client);
    }

    async deleteClient(id: string): Promise<void> {
        return this.isFirebase()
            ? firestoreService.deleteClient(id)
            : storageService.deleteClient(id);
    }

    async fetchServices(): Promise<Service[]> {
        return this.isFirebase()
            ? firestoreService.fetchServices()
            : storageService.fetchServices();
    }

    async saveService(service: Service): Promise<void> {
        return this.isFirebase()
            ? firestoreService.saveService(service)
            : storageService.saveService(service);
    }

    async deleteService(id: string): Promise<void> {
        return this.isFirebase()
            ? firestoreService.deleteService(id)
            : storageService.deleteService(id);
    }

    async fetchQuotes(): Promise<Quote[]> {
        return this.isFirebase()
            ? firestoreService.fetchQuotes()
            : storageService.fetchQuotes();
    }

    async saveQuote(quote: Quote): Promise<void> {
        return this.isFirebase()
            ? firestoreService.saveQuote(quote)
            : storageService.saveQuote(quote);
    }

    async deleteQuote(id: string): Promise<void> {
        return this.isFirebase()
            ? firestoreService.deleteQuote(id)
            : storageService.deleteQuote(id);
    }

    async updateQuoteStatus(id: string, status: string): Promise<void> {
        return this.isFirebase()
            ? firestoreService.updateQuoteStatus(id, status)
            : storageService.updateQuoteStatus(id, status);
    }

    async fetchContracts(): Promise<RecurringContract[]> {
        return this.isFirebase()
            ? firestoreService.fetchContracts()
            : storageService.fetchContracts();
    }

    async saveContract(contract: RecurringContract): Promise<void> {
        return this.isFirebase()
            ? firestoreService.saveContract(contract)
            : storageService.saveContract(contract);
    }

    async deleteContract(id: string): Promise<void> {
        return this.isFirebase()
            ? firestoreService.deleteContract(id)
            : storageService.deleteContract(id);
    }

    async fetchCompanySettings(): Promise<CompanySettings> {
        if (this.isFirebase()) {
            try {
                const settings = await firestoreService.fetchCompanySettings();
                // Merge with default settings to ensure all fields exist
                return { ...storageService.getCompanySettings(), ...settings };
            } catch (e) {
                console.warn("Error fetching settings from Firestore, falling back to local", e);
                return storageService.getCompanySettings();
            }
        }
        return storageService.getCompanySettings();
    }

    async saveCompanySettings(settings: CompanySettings): Promise<void> {
        // Always save to local storage as backup/cache
        storageService.saveCompanySettings(settings);

        if (this.isFirebase()) {
            await firestoreService.saveCompanySettings(settings);
        }
    }
}

export const dataManager = new DataManager();
