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
  config: any; // Flexible config for the contract fields
}
