// Theme Types
export type ThemeMode = 'light' | 'dark' | 'midnight' | 'high-contrast';

export interface ThemePreferences {
  mode: ThemeMode;
  accentColor: string;
  fontFamily: string;
}

export type AuthMode = 'firebase' | 'local' | null;

export interface DataService {
  fetchClients: () => Promise<Client[]>;
  saveClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  fetchServices: () => Promise<Service[]>;
  saveService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  fetchQuotes: () => Promise<Quote[]>;
  saveQuote: (quote: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  updateQuoteStatus: (id: string, status: string) => Promise<void>;

  fetchContracts: () => Promise<RecurringContract[]>;
  saveContract: (contract: RecurringContract) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  ruc: string;
  contact: string;
  phone: string;
  address: string;
  city: string;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  category: string;
  cost: number;
}

export interface QuoteItem {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  cost: number;
}

export interface Quote {
  id: string;
  number: string;
  issueDate: string;
  validityDate: string;
  client: Client;
  items: QuoteItem[];
  subtotal: number;
  iva: number;
  total: number;
  notes: string;
  status: 'Pendiente' | 'Aceptada' | 'Rechazada';
  pdfUrl?: string | null;
  companySettings: CompanySettings;
}

export interface CompanySettings {
  name: string;
  address: string;
  contact: string;
  ruc: string;
  repName: string;
  repTitle: string;
  logo: string;
  primaryColor: string;
  accentColor: string;
  website: string;
  whatsapp: string;
  typography: string;
  themePreferences?: ThemePreferences;
}

export interface Contract {
  quoteId: string;
  text: string;
  config: any;
}

// Recurring Contract Management
export type ContractType = 'hosting' | 'domain' | 'maintenance' | 'other';
export type ContractPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export interface RecurringContract {
  id: string;
  clientId: string;
  clientName: string;
  serviceType: ContractType;
  serviceName: string;
  description: string;
  provider: string;
  amount: number;
  period: ContractPeriod;
  startDate: string; // DD/MM/YYYY
  nextRenewalDate: string; // DD/MM/YYYY
  status: 'active' | 'paused' | 'cancelled';
  autoRenew: boolean;
  notes: string;
}
