
export type AuthMode = 'google' | 'local' | null;

export interface DataService {
  fetchClients: () => Promise<Client[]>;
  saveClient: (client: Client) => Promise<void>;
  deleteClient: (rowId: any) => Promise<void>; // rowId can be string (ID) for local or number for sheets
  
  fetchServices: () => Promise<Service[]>;
  saveService: (service: Service) => Promise<void>;
  deleteService: (rowId: any) => Promise<void>;

  fetchQuotes: () => Promise<Quote[]>;
  saveQuote: (quote: Quote) => Promise<void>;
  updateQuoteStatus: (rowId: any, status: string) => Promise<void>;
  
  createQuoteDoc?: (quote: Quote) => Promise<string>; // Optional for local
}

export interface Client {
  id: string;
  rowId?: any; // number for sheets, string/undefined for local
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
  rowId?: any;
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
  rowId?: any;
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
  googleDocId?: string | null;
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
}

export interface Contract {
  quoteId: string;
  text: string;
  config: any;
}
