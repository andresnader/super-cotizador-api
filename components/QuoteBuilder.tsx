
import React, { useState, useEffect } from 'react';
import { Client, Service, QuoteItem, Quote, CompanySettings } from '../types';
import { fetchClients, fetchServices, fetchQuotes, saveQuote, createQuoteDoc } from '../services/google';
import Modal from './Modal';
import Clients from './Clients';
import Services from './Services';

interface QuoteBuilderProps {
  settings: CompanySettings;
  onPrint: (quote: Quote) => void;
}

const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ settings, onPrint }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [quoteDate, setQuoteDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteNotes, setQuoteNotes] = useState('');
  
  // Loading state for submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [previewService, setPreviewService] = useState<Partial<Service>>({});
  const [customDetail, setCustomDetail] = useState('');

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  const [showClientModal, setShowClientModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadData = async () => {
      try {
          const [c, s, h] = await Promise.all([fetchClients(), fetchServices(), fetchQuotes()]);
          setClients(c);
          setServices(s);
          setHistoryCount(h.length);
      } catch (e) {
          console.error("Error loading quote builder data", e);
      }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = () => {
    loadData();
  };

  // --- Logic ---
  // (Reuse filter/search logic from previous version, updated for async data flow)
  const handleClientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientSearch(e.target.value);
    setSelectedClient('');
    setShowClientDropdown(true);
    if (validationError) setValidationError(null);
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client.id);
    setClientSearch(client.name);
    setShowClientDropdown(false);
    if (validationError) setValidationError(null);
  };

  const filteredClients = clients.filter(c => 
    (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.ruc || '').includes(clientSearch)
  );

  const handleServiceSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServiceSearch(e.target.value);
    setSelectedServiceId('');
    setPreviewService({});
    setCustomDetail('');
    setShowServiceDropdown(true);
  };

  const selectService = (service: Service) => {
    setSelectedServiceId(service.id);
    setPreviewService({ ...service });
    setServiceSearch(service.name);
    setCustomDetail('');
    setShowServiceDropdown(false);
  };

  const filteredServices = services.filter(s => 
    (s.name || '').toLowerCase().includes(serviceSearch.toLowerCase()) ||
    (s.code || '').toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const addService = () => {
    if (!selectedServiceId && !previewService.price && !serviceSearch) return;
    
    const master = services.find(s => s.id === selectedServiceId);
    const baseDesc = previewService.description || '';
    const finalDesc = customDetail ? `${baseDesc}\n\n${customDetail}` : baseDesc;
    const name = master ? master.name : (serviceSearch || 'Servicio');
    const code = master ? master.code : 'CUSTOM';

    const newItem: QuoteItem = {
      id: selectedServiceId || `custom_${Date.now()}`,
      name: name,
      code: code,
      description: finalDesc,
      price: previewService.price || 0,
      quantity: 1,
      category: master?.category || '',
      cost: master?.cost || 0
    };

    setQuoteItems([...quoteItems, newItem]);
    if (validationError) setValidationError(null);
    
    setSelectedServiceId('');
    setPreviewService({});
    setCustomDetail('');
    setServiceSearch('');
  };

  const removeService = (index: number) => {
    const newItems = [...quoteItems];
    newItems.splice(index, 1);
    setQuoteItems(newItems);
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...quoteItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setQuoteItems(newItems);
  };

  const { subtotal, iva, total } = (() => {
    const sub = quoteItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const i = sub * 0.15;
    return { subtotal: sub, iva: i, total: sub + i };
  })();

  const handleGenerate = async (saveToDrive: boolean) => {
    if (!selectedClient) { setValidationError("Seleccione un cliente"); return; }
    if (quoteItems.length === 0) { setValidationError("Agregue items"); return; }
    
    setIsSubmitting(true);
    setValidationError(null);

    try {
        const clientObj = clients.find(c => c.id === selectedClient);
        if (!clientObj) throw new Error("Cliente invalido");

        const now = new Date();
        const dateStr = now.toISOString().slice(0,10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0,5).replace(':', '');
        const seq = (historyCount + 1).toString().padStart(4, '0');
        const number = `${clientObj.code}-${dateStr}${timeStr}-${seq}`;

        const newQuote: Quote = {
            id: `quote_${now.getTime()}`,
            number,
            issueDate: now.toLocaleDateString('es-EC'),
            validityDate: new Date(quoteDate).toLocaleDateString('es-EC'),
            client: clientObj,
            items: quoteItems,
            subtotal,
            iva,
            total,
            notes: quoteNotes,
            status: 'Pendiente',
            companySettings: settings
        };

        if (saveToDrive) {
            // Create Doc
            const docId = await createQuoteDoc(newQuote);
            newQuote.googleDocId = docId;
        }

        // Save to Sheet
        await saveQuote(newQuote);
        
        // Update local count
        setHistoryCount(prev => prev + 1);
        
        // Reset
        setQuoteItems([]);
        setQuoteNotes('');
        setClientSearch('');
        setSelectedClient('');

        // If saved to drive, maybe show link or success. If not, print.
        if (saveToDrive) {
            alert(`Cotización guardada en Drive y Sheets.\nID Doc: ${newQuote.googleDocId}`);
        } else {
            onPrint(newQuote);
        }

    } catch (e: any) {
        console.error(e);
        setValidationError("Error al generar: " + (e.message || e.result?.error?.message));
    } finally {
        setIsSubmitting(false);
    }
  };

  const currentClient = clients.find(c => c.id === selectedClient);
  const onClientBlur = () => setTimeout(() => setShowClientDropdown(false), 200);
  const onServiceBlur = () => setTimeout(() => setShowServiceDropdown(false), 200);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">Crear Cotización</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <div className="flex space-x-2 relative">
              <div className="w-full relative">
                  <input 
                    type="text"
                    className={`w-full p-2 border rounded-lg shadow-sm ${validationError && !selectedClient ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={handleClientSearch}
                    onFocus={() => setShowClientDropdown(true)}
                    onBlur={onClientBlur}
                  />
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full bg-white border border-gray-300 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredClients.map(c => (
                            <div key={c.id} className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100" onClick={() => selectClient(c)}>
                                <div className="font-medium">{c.name}</div>
                                <div className="text-xs text-gray-500">{c.ruc}</div>
                            </div>
                        ))}
                    </div>
                  )}
              </div>
              <button onClick={() => setShowClientModal(true)} className="bg-indigo-500 text-white px-3 py-2 rounded-lg"><i className="fas fa-user-plus"></i></button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RUC / C.I.</label>
            <input type="text" readOnly className="w-full p-2 bg-gray-100 border rounded-lg" value={currentClient?.ruc || ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validez</label>
            <input type="date" className="w-full p-2 border rounded-lg" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
          </div>
        </div>

        {/* Service Selection */}
        <div className="flex flex-col gap-4 mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                <div className="flex space-x-2 relative">
                  <div className="w-full relative">
                      <input 
                        type="text"
                        className="w-full p-2 border rounded-lg shadow-sm"
                        placeholder="Buscar servicio..."
                        value={serviceSearch}
                        onChange={handleServiceSearch}
                        onFocus={() => setShowServiceDropdown(true)}
                        onBlur={onServiceBlur}
                      />
                      {showServiceDropdown && (
                        <div className="absolute z-50 w-full bg-white border mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredServices.map(s => (
                                <div key={s.id} className="p-2 hover:bg-gray-100 cursor-pointer border-b" onClick={() => selectService(s)}>
                                    <div className="font-medium">{s.name}</div>
                                    <div className="text-xs flex justify-between"><span>{s.code}</span><span className="font-bold">${s.price}</span></div>
                                </div>
                            ))}
                        </div>
                      )}
                  </div>
                  <button onClick={() => setShowServiceModal(true)} className="bg-indigo-500 text-white px-3 py-2 rounded-lg"><i className="fas fa-plus"></i></button>
                </div>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
               <input type="number" step="0.01" className="w-full p-2 border rounded-lg text-right" value={previewService.price || ''} onChange={(e) => setPreviewService({...previewService, price: parseFloat(e.target.value)})} />
             </div>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Detalle Adicional</label>
             <textarea className="w-full p-2 border rounded-lg text-sm" rows={2} value={customDetail} onChange={(e) => setCustomDetail(e.target.value)} />
           </div>
           <button onClick={addService} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg">Añadir a Cotización</button>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-6">
          <table className={`min-w-full divide-y divide-gray-200 border rounded-lg ${validationError && quoteItems.length === 0 ? 'border-red-300' : ''}`}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Servicio</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase">Cant</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase">Precio</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quoteItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3"><div className="font-medium">{item.name}</div><div className="text-xs text-gray-500">{item.description}</div></td>
                    <td className="px-4 py-3 text-center"><input type="number" min="1" className="w-12 text-center border rounded" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value)||1)} /></td>
                    <td className="px-4 py-3 text-right">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">${(item.price * item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => removeService(idx)} className="text-red-500"><i className="fas fa-trash"></i></button></td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
           <textarea className="w-full p-2 border rounded-lg h-24" value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit sticky top-4">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">Resumen</h2>
        <div className="space-y-4 mb-8">
           <div className="flex justify-between"><span>Subtotal:</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
           <div className="flex justify-between"><span>IVA (15%):</span><span className="font-semibold">${iva.toFixed(2)}</span></div>
           <hr />
           <div className="flex justify-between text-2xl font-bold" style={{ color: settings.accentColor }}><span>TOTAL:</span><span>${total.toFixed(2)}</span></div>
        </div>
        
        {validationError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{validationError}</div>}

        <button onClick={() => handleGenerate(false)} disabled={isSubmitting} className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 mb-3 font-semibold disabled:opacity-50">
          <i className="fas fa-print mr-2"></i> Generar e Imprimir
        </button>
        <button onClick={() => handleGenerate(true)} disabled={isSubmitting} className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50">
          <i className="fab fa-google-drive mr-2"></i> Generar y Guardar (Drive)
        </button>
      </div>

      <Modal isOpen={showClientModal} onClose={() => { setShowClientModal(false); refreshData(); }}>
        <Clients isModal={true} />
      </Modal>
      <Modal isOpen={showServiceModal} onClose={() => { setShowServiceModal(false); refreshData(); }}>
        <Services isModal={true} />
      </Modal>
    </div>
  );
};

export default QuoteBuilder;
