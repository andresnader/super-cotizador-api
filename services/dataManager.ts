import { AuthMode, Client, Service, Quote, DataService, RecurringContract, CompanySettings } from '../types';
import { apiService } from './api';

class DataManager implements DataService {
  private mode: AuthMode = 'local';

  setMode(mode: AuthMode) {
    this.mode = mode;
  }

  getMode(): AuthMode {
    return this.mode;
  }

  private isApi(): boolean {
    return this.mode === 'api';
  }

  async fetchClients(): Promise<Client[]> {
    if (this.isApi()) return apiService.fetchClients();
    const { fetchClients } = await import('./storage');
    return fetchClients();
  }

  async saveClient(client: Client): Promise<void> {
    if (this.isApi()) { await apiService.saveClient(client); return; }
    const { saveClient } = await import('./storage');
    return saveClient(client);
  }

  async deleteClient(id: string): Promise<void> {
    if (this.isApi()) { await apiService.deleteClient(id); return; }
    const { deleteClient } = await import('./storage');
    return deleteClient(id);
  }

  async fetchServices(): Promise<Service[]> {
    if (this.isApi()) return apiService.fetchServices();
    const { fetchServices } = await import('./storage');
    return fetchServices();
  }

  async saveService(service: Service): Promise<void> {
    if (this.isApi()) { await apiService.saveService(service); return; }
    const { saveService } = await import('./storage');
    return saveService(service);
  }

  async deleteService(id: string): Promise<void> {
    if (this.isApi()) { await apiService.deleteService(id); return; }
    const { deleteService } = await import('./storage');
    return deleteService(id);
  }

  async fetchQuotes(): Promise<Quote[]> {
    if (this.isApi()) return apiService.fetchQuotes();
    const { fetchQuotes } = await import('./storage');
    return fetchQuotes();
  }

  async saveQuote(quote: Quote): Promise<void> {
    if (this.isApi()) { await apiService.saveQuote(quote); return; }
    const { saveQuote } = await import('./storage');
    return saveQuote(quote);
  }

  async deleteQuote(id: string): Promise<void> {
    if (this.isApi()) { await apiService.deleteQuote(id); return; }
    const { deleteQuote } = await import('./storage');
    return deleteQuote(id);
  }

  async updateQuoteStatus(id: string, status: string): Promise<void> {
    if (this.isApi()) { await apiService.updateQuoteStatus(id, status); return; }
    const { updateQuoteStatus } = await import('./storage');
    return updateQuoteStatus(id, status);
  }

  async fetchContracts(): Promise<RecurringContract[]> {
    if (this.isApi()) return apiService.fetchContracts();
    const { fetchContracts } = await import('./storage');
    return fetchContracts();
  }

  async saveContract(contract: RecurringContract): Promise<void> {
    if (this.isApi()) { await apiService.saveContract(contract); return; }
    const { saveContract } = await import('./storage');
    return saveContract(contract);
  }

  async deleteContract(id: string): Promise<void> {
    if (this.isApi()) { await apiService.deleteContract(id); return; }
    const { deleteContract } = await import('./storage');
    return deleteContract(id);
  }

  async fetchCompanySettings(): Promise<CompanySettings> {
    if (this.isApi()) {
      const settings = await apiService.fetchSettings();
      return settings || this.getDefaultSettings();
    }
    const { getCompanySettings } = await import('./storage');
    return getCompanySettings();
  }

  async saveCompanySettings(settings: CompanySettings): Promise<void> {
    if (this.isApi()) { await apiService.saveSettings(settings); return; }
    const { saveCompanySettings } = await import('./storage');
    return saveCompanySettings(settings);
  }

  private getDefaultSettings(): CompanySettings {
    return {
      name: 'Tu Empresa S.A.',
      address: 'Tu Dirección, Guayaquil',
      contact: 'tuemail@empresa.com',
      ruc: '1234567890001',
      repName: 'Andrés Nader',
      repTitle: 'Gerente General',
      logo: '/cotizador/ameizin-img.png',
      primaryColor: '#1a202c',
      accentColor: '#4f46e5',
      website: '',
      whatsapp: '',
      typography: 'Inter, sans-serif',
    };
  }
}

export const dataManager = new DataManager();