
export interface Client {
  id: string;
  rowId?: number; // For Google Sheets updates
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
  rowId?: number; // For Google Sheets updates
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
  rowId?: number; // For Google Sheets updates
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
  googleDocId?: string | null; // Link to Google Doc
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

<<<<<<< HEAD

=======
export interface Contract {
  quoteId: string;
  text: string;
  config: any;
}
>>>>>>> 7b1acce5b3bf139c54b3f0694a52a3715f24cecd
