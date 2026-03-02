// Firestore Data Service
// Replaces Google Sheets API CRUD operations

import { db } from './firebase';
import { getCurrentUserId } from './firebaseAuth';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { Client, Service, Quote, RecurringContract, CompanySettings } from '../types';

// Helper: get user-scoped collection reference
function userCollection(collectionName: string) {
    const userId = getCurrentUserId();
    return collection(db, 'users', userId, collectionName);
}

// Helper: get user-scoped document reference
function userDoc(collectionName: string, docId: string) {
    const userId = getCurrentUserId();
    return doc(db, 'users', userId, collectionName, docId);
}

// --- CLIENTS ---

export async function fetchClients(): Promise<Client[]> {
    const snapshot = await getDocs(query(userCollection('clients'), orderBy('name')));
    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
    } as Client));
}

export async function saveClient(client: Client): Promise<void> {
    const docRef = client.id
        ? userDoc('clients', client.id)
        : doc(userCollection('clients'));

    const { id, rowId, ...data } = client as any;
    await setDoc(docRef, {
        ...data,
        id: docRef.id,
        updatedAt: Timestamp.now()
    });
}

export async function deleteClient(clientId: string): Promise<void> {
    await deleteDoc(userDoc('clients', clientId));
}

// --- SERVICES ---

export async function fetchServices(): Promise<Service[]> {
    const snapshot = await getDocs(query(userCollection('services'), orderBy('name')));
    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
    } as Service));
}

export async function saveService(service: Service): Promise<void> {
    const docRef = service.id
        ? userDoc('services', service.id)
        : doc(userCollection('services'));

    const { id, rowId, ...data } = service as any;
    await setDoc(docRef, {
        ...data,
        id: docRef.id,
        updatedAt: Timestamp.now()
    });
}

export async function deleteService(serviceId: string): Promise<void> {
    await deleteDoc(userDoc('services', serviceId));
}

// --- QUOTES ---

export async function fetchQuotes(): Promise<Quote[]> {
    const snapshot = await getDocs(query(userCollection('quotes')));
    return snapshot.docs.map(d => {
        const data = d.data();
        return {
            ...data,
            id: d.id,
            subtotal: Number(data.subtotal) || 0,
            iva: Number(data.iva) || 0,
            total: Number(data.total) || 0,
            items: (data.items || []).map((item: any) => ({
                ...item,
                price: Number(item.price) || 0,
                quantity: Number(item.quantity) || 1,
                cost: Number(item.cost) || 0
            }))
        } as Quote;
    });
}

export async function saveQuote(quote: Quote): Promise<void> {
    const docRef = quote.id
        ? userDoc('quotes', quote.id)
        : doc(userCollection('quotes'));

    const { id, rowId, ...data } = quote as any;
    await setDoc(docRef, {
        ...data,
        id: docRef.id,
        updatedAt: Timestamp.now()
    });
}

export async function updateQuoteStatus(quoteId: string, status: string): Promise<void> {
    const docRef = userDoc('quotes', quoteId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        await setDoc(docRef, { ...snap.data(), status, updatedAt: Timestamp.now() });
    }
}

export async function deleteQuote(quoteId: string): Promise<void> {
    await deleteDoc(userDoc('quotes', quoteId));
}

// --- CONTRACTS ---

export async function fetchContracts(): Promise<RecurringContract[]> {
    const snapshot = await getDocs(query(userCollection('contracts')));
    return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        amount: Number(d.data().amount) || 0
    } as RecurringContract));
}

export async function saveContract(contract: RecurringContract): Promise<void> {
    const docRef = contract.id
        ? userDoc('contracts', contract.id)
        : doc(userCollection('contracts'));

    const { id, rowId, ...data } = contract as any;
    await setDoc(docRef, {
        ...data,
        id: docRef.id,
        updatedAt: Timestamp.now()
    });
}

export async function deleteContract(contractId: string): Promise<void> {
    await deleteDoc(userDoc('contracts', contractId));
}

// --- COMPANY SETTINGS ---

export async function fetchCompanySettings(): Promise<CompanySettings | null> {
    const docRef = userDoc('settings', 'company');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return snap.data() as CompanySettings;
    }
    return null;
}

export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
    const docRef = userDoc('settings', 'company');
    await setDoc(docRef, { ...settings, updatedAt: Timestamp.now() });
}

// --- BATCH IMPORT FROM JSON BACKUP ---

export interface ImportResult {
    clients: number;
    services: number;
    quotes: number;
    contracts: number;
    settings: boolean;
}

export async function importAllToFirestore(data: any): Promise<ImportResult> {
    const result: ImportResult = {
        clients: 0,
        services: 0,
        quotes: 0,
        contracts: 0,
        settings: false
    };

    // Import clients
    if (Array.isArray(data.clients)) {
        for (const client of data.clients) {
            const docId = client.id || `client_${Date.now()}_${result.clients}`;
            const { id, rowId, ...rest } = client;
            const docRef = userDoc('clients', docId);
            await setDoc(docRef, {
                ...rest,
                id: docId,
                updatedAt: Timestamp.now()
            });
            result.clients++;
        }
    }

    // Import services
    if (Array.isArray(data.services)) {
        for (const service of data.services) {
            const docId = service.id || `service_${Date.now()}_${result.services}`;
            const { id, rowId, ...rest } = service;
            const docRef = userDoc('services', docId);
            await setDoc(docRef, {
                ...rest,
                id: docId,
                price: Number(service.price) || 0,
                updatedAt: Timestamp.now()
            });
            result.services++;
        }
    }

    // Import quotes
    if (Array.isArray(data.quotes)) {
        for (const quote of data.quotes) {
            const docId = quote.id || `quote_${Date.now()}_${result.quotes}`;
            const { id, rowId, googleDocId, ...rest } = quote;
            const docRef = userDoc('quotes', docId);
            await setDoc(docRef, {
                ...rest,
                id: docId,
                subtotal: Number(quote.subtotal) || 0,
                iva: Number(quote.iva) || 0,
                total: Number(quote.total) || 0,
                updatedAt: Timestamp.now()
            });
            result.quotes++;
        }
    }

    // Import contracts
    if (Array.isArray(data.contracts)) {
        for (const contract of data.contracts) {
            const docId = contract.id || `contract_${Date.now()}_${result.contracts}`;
            const { id, rowId, ...rest } = contract;
            const docRef = userDoc('contracts', docId);
            await setDoc(docRef, {
                ...rest,
                id: docId,
                amount: Number(contract.amount) || 0,
                updatedAt: Timestamp.now()
            });
            result.contracts++;
        }
    }

    // Import settings
    if (data.settings && typeof data.settings === 'object') {
        const settingsRef = userDoc('settings', 'company');
        await setDoc(settingsRef, {
            ...data.settings,
            updatedAt: Timestamp.now()
        });
        result.settings = true;
    }

    return result;
}

