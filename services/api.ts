const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RequestOptions {
  method?: string;
  body?: any;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      this.token = null;
      localStorage.removeItem('authToken');
      window.location.reload();
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: { id: string; email: string; name: string } }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async register(email: string, password: string, name?: string) {
    return this.request<{ token: string; user: { id: string; email: string; name: string } }>('/api/auth/register', {
      method: 'POST',
      body: { email, password, name },
    });
  }

  async getMe() {
    return this.request<{ id: string; email: string; name: string }>('/api/auth/me');
  }

  // Clients
  async fetchClients() {
    return this.request<any[]>('/api/clients');
  }

  async saveClient(client: any) {
    if (client.id) {
      return this.request<any>(`/api/clients/${client.id}`, { method: 'PUT', body: client });
    }
    return this.request<any>('/api/clients', { method: 'POST', body: client });
  }

  async deleteClient(id: string) {
    return this.request<{ success: boolean }>(`/api/clients/${id}`, { method: 'DELETE' });
  }

  // Services
  async fetchServices() {
    return this.request<any[]>('/api/services');
  }

  async saveService(service: any) {
    if (service.id) {
      return this.request<any>(`/api/services/${service.id}`, { method: 'PUT', body: service });
    }
    return this.request<any>('/api/services', { method: 'POST', body: service });
  }

  async deleteService(id: string) {
    return this.request<{ success: boolean }>(`/api/services/${id}`, { method: 'DELETE' });
  }

  // Quotes
  async fetchQuotes() {
    return this.request<any[]>('/api/quotes');
  }

  async getQuote(id: string) {
    return this.request<any>(`/api/quotes/${id}`);
  }

  async saveQuote(quote: any) {
    if (quote.id) {
      return this.request<any>(`/api/quotes/${quote.id}`, { method: 'PUT', body: quote });
    }
    return this.request<any>('/api/quotes', { method: 'POST', body: quote });
  }

  async updateQuoteStatus(id: string, status: string) {
    return this.request<any>(`/api/quotes/${id}/status`, { method: 'PATCH', body: { status } });
  }

  async deleteQuote(id: string) {
    return this.request<{ success: boolean }>(`/api/quotes/${id}`, { method: 'DELETE' });
  }

  // Contracts
  async fetchContracts() {
    return this.request<any[]>('/api/contracts');
  }

  async saveContract(contract: any) {
    if (contract.id) {
      return this.request<any>(`/api/contracts/${contract.id}`, { method: 'PUT', body: contract });
    }
    return this.request<any>('/api/contracts', { method: 'POST', body: contract });
  }

  async deleteContract(id: string) {
    return this.request<{ success: boolean }>(`/api/contracts/${id}`, { method: 'DELETE' });
  }

  // Settings
  async fetchSettings() {
    return this.request<any>('/api/settings');
  }

  async saveSettings(settings: any) {
    return this.request<any>('/api/settings', { method: 'PUT', body: settings });
  }
}

export const apiService = new ApiService();
export default apiService;