
import React, { useState, useEffect } from 'react';
import { Client, Service, QuoteItem, Quote, CompanySettings } from '../types';
import { dataManager } from '../services/dataManager';
import Modal from './Modal';
import Clients from './Clients';
import Services from './Services';

interface QuoteBuilderProps {
  settings: CompanySettings;
  onPrint: (quote: Quote) => void;
  editQuoteId?: string | null;
  onQuoteSaved?: () => void;
}

const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ settings, onPrint, editQuoteId, onQuoteSaved }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [historyCount, setHistoryCount] = useState(0);

  const [selectedClient, setSelectedClient] = useState<string>('');
  const [quoteDate, setQuoteDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteNotes, setQuoteNotes] = useState('');

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
      const [c, s, h] = await Promise.all([dataManager.fetchClients(), dataManager.fetchServices(), dataManager.fetchQuotes()]);
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

  // Load quote for editing
  useEffect(() => {
    const loadQuoteForEdit = async () => {
      if (editQuoteId) {
        try {
          const quotes = await dataManager.fetchQuotes();
          const quoteToEdit = quotes.find(q => q.id === editQuoteId);
          if (quoteToEdit) {
            setSelectedClient(quoteToEdit.client.id);
            setClientSearch(quoteToEdit.client.name);
            setQuoteItems(quoteToEdit.items);
            setQuoteNotes(quoteToEdit.notes);
            // Ensure validity date is correctly formatted for the input
            try {
              // The date might be in dd/mm/yyyy format from toLocaleDateString('es-EC')
              const parts = quoteToEdit.validityDate.split('/');
              if (parts.length === 3) {
                const formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                setQuoteDate(formattedDate);
              } else {
                setQuoteDate(new Date(quoteToEdit.validityDate).toISOString().slice(0, 10));
              }
            } catch (e) {
              console.warn("Date parsing fallback", e);
            }
          }
        } catch (e) {
          console.error('Error loading quote for edit', e);
        }
      } else {
        // Reset form for new quote
        setSelectedClient('');
        setClientSearch('');
        setQuoteItems([]);
        setQuoteNotes('');
        setQuoteDate(new Date().toISOString().slice(0, 10));
      }
    };
    loadQuoteForEdit();
  }, [editQuoteId]);

  const refreshData = () => {
    loadData();
  };

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

  const handleGenerate = async () => {
    if (!selectedClient) { setValidationError("Seleccione un cliente"); return; }
    if (quoteItems.length === 0) { setValidationError("Agregue items"); return; }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const clientObj = clients.find(c => c.id === selectedClient);
      if (!clientObj) throw new Error("Cliente invalido");

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      const seq = (historyCount + 1).toString().padStart(4, '0');
      const number = `${clientObj.code}-${dateStr}${timeStr}-${seq}`;

      const newQuote: Quote = {
        id: editQuoteId || `quote_${now.getTime()}`, // Use existing ID if editing
        number: editQuoteId ? (await dataManager.fetchQuotes()).find(q => q.id === editQuoteId)?.number || number : number, // Keep number if editing
        issueDate: (() => {
          const [y, m, d] = quoteDate.split('-');
          return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('es-EC');
        })(),
        validityDate: (() => {
          const [y, m, d] = quoteDate.split('-');
          const vDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
          vDate.setDate(vDate.getDate() + 30);
          return vDate.toLocaleDateString('es-EC');
        })(),
        client: clientObj,
        items: quoteItems,
        subtotal,
        iva,
        total,
        notes: quoteNotes,
        status: 'Pendiente',
        companySettings: settings
      };

      await dataManager.saveQuote(newQuote);

      setHistoryCount(prev => prev + 1);

      setQuoteItems([]);
      setQuoteNotes('');
      setClientSearch('');
      setSelectedClient('');

      if (onQuoteSaved) onQuoteSaved();

      // Always open print preview
      onPrint(newQuote);

    } catch (e: any) {
      console.error(e);
      setValidationError("Error al generar: " + (e.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentClient = clients.find(c => c.id === selectedClient);
  const onClientBlur = () => setTimeout(() => setShowClientDropdown(false), 200);
  const onServiceBlur = () => setTimeout(() => setShowServiceDropdown(false), 200);

  return (
    <div className="relative flex flex-col lg:flex-row w-full gap-6 p-2 md:p-6 bg-gradient-to-br from-indigo-50/30 via-white/30 to-emerald-50/30 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50 rounded-3xl pb-24 lg:pb-6">

      {/* LEFT COLUMN: Form Areas */}
      <div className="flex-1 flex flex-col gap-6 w-full max-w-full pb-64 lg:pb-0">

        {/* Client Section */}
        <section className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-3xl p-5 md:p-6 shadow-xl shadow-slate-200/20 dark:shadow-black/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <i className="fas fa-user-circle text-indigo-500"></i>
              Información del Cliente
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-1 mb-1">Cliente</label>
              <div className="flex space-x-2 relative">
                <div className="w-full relative">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    className={`w-full bg-white/50 dark:bg-black/20 border ${validationError && !selectedClient ? 'border-red-400' : 'border-white/40 dark:border-gray-600'} backdrop-blur-md rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-gray-100 transition-all`}
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={handleClientSearch}
                    onFocus={() => setShowClientDropdown(true)}
                    onBlur={onClientBlur}
                  />
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 mt-2 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {filteredClients.map(c => (
                        <div key={c.id} className="p-3 hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors" onClick={() => selectClient(c)}>
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{c.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{c.ruc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowClientModal(true)}
                  className="bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-400 px-4 py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center min-w-[56px]"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-1">RUC / C.I.</label>
              <input
                type="text"
                readOnly
                className="w-full bg-white/30 dark:bg-black/30 border border-white/20 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                value={currentClient?.ruc || ''}
                placeholder="---"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-1">Validez</label>
              <input
                type="date"
                className="w-full bg-white/50 dark:bg-black/20 border border-white/40 dark:border-gray-600 backdrop-blur-md rounded-xl py-3 px-4 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Add Service Section */}
        <section className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-indigo-200/50 dark:border-indigo-500/30 rounded-3xl p-5 md:p-6 shadow-xl shadow-indigo-100/20 dark:shadow-black/20 relative overflow-hidden">
          {/* Subtle decorative gradient */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-5">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
              <i className="fas fa-box-open text-lg"></i>
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Añadir Servicio</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="w-full relative flex-1">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  className="w-full bg-white/70 dark:bg-black/30 border border-white/50 dark:border-gray-600 backdrop-blur-md rounded-2xl py-3.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-gray-100 transition-all"
                  placeholder="Buscar servicio..."
                  value={serviceSearch}
                  onChange={handleServiceSearch}
                  onFocus={() => setShowServiceDropdown(true)}
                  onBlur={onServiceBlur}
                />
                {showServiceDropdown && (
                  <div className="absolute z-50 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 mt-2 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredServices.map(s => (
                      <div key={s.id} className="p-3 hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors" onClick={() => selectService(s)}>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{s.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mt-1">
                          <span>{s.code}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">${s.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-400 px-4 py-3.5 rounded-2xl transition-all shadow-sm flex items-center justify-center min-w-[56px]"
                  title="Nuevo Servicio Maestro"
                >
                  <i className="fas fa-plus"></i>
                </button>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white/70 dark:bg-black/30 border border-white/50 dark:border-gray-600 backdrop-blur-md rounded-2xl py-3.5 pl-8 pr-3 focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-gray-100 transition-all font-semibold"
                    placeholder="Precio"
                    value={previewService.price || ''}
                    onChange={(e) => setPreviewService({ ...previewService, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div>
              <textarea
                className="w-full bg-white/50 dark:bg-black/20 border border-white/40 dark:border-gray-600 backdrop-blur-md rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-gray-100 transition-all text-sm resize-y"
                rows={2}
                placeholder="Detalle adicional opcional..."
                value={customDetail}
                onChange={(e) => setCustomDetail(e.target.value)}
              />
            </div>

            <button
              onClick={addService}
              className="w-full py-4 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <i className="fas fa-check-circle"></i>
              AÑADIR AL RESUMEN
            </button>
          </div>
        </section>

        {/* Added Items (Mobile Cards + Grid) */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 px-2">Servicios Agregados</h2>

          {quoteItems.length === 0 ? (
            <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm border border-dashed border-gray-300 dark:border-gray-700 rounded-3xl p-8 text-center text-gray-500 py-12">
              <i className="fas fa-receipt text-4xl mb-3 text-gray-300 dark:text-gray-600"></i>
              <p>No hay servicios agregados aún.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quoteItems.map((item, idx) => (
                <div key={idx} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-3xl p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-4">
                      <input
                        type="text"
                        className="w-full font-bold text-base md:text-lg border-none bg-transparent focus:ring-2 focus:ring-indigo-500/30 rounded px-1 -ml-1 text-gray-800 dark:text-gray-100 placeholder-gray-400"
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        placeholder="Nombre del servicio"
                      />
                      <textarea
                        className="w-full text-sm text-gray-500 dark:text-gray-400 border-none bg-transparent focus:ring-2 focus:ring-indigo-500/30 rounded px-1 -ml-1 mt-1 resize-y min-h-[40px]"
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Descripción detallada..."
                        rows={2}
                      />
                    </div>
                    <button
                      onClick={() => removeService(idx)}
                      className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2 rounded-full transition-colors flex-shrink-0"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 px-1">Cantidad</label>
                      <div className="flex items-center bg-white/50 dark:bg-black/20 rounded-xl p-1 border border-white/30 dark:border-gray-700">
                        <button
                          onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                        >
                          <i className="fas fa-minus text-xs"></i>
                        </button>
                        <input
                          type="number"
                          min="1"
                          className="w-full text-center bg-transparent border-none focus:ring-0 font-semibold text-gray-800 dark:text-gray-200"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />
                        <button
                          onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                        >
                          <i className="fas fa-plus text-xs"></i>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 px-1">Precio Unitario</label>
                      <div className="flex items-center bg-white/50 dark:bg-black/20 rounded-xl px-3 border border-white/30 dark:border-gray-700 h-[48px]">
                        <span className="text-sm font-semibold text-gray-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-transparent border-none focus:ring-0 font-semibold text-right text-gray-800 dark:text-gray-200"
                          value={item.price}
                          onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center px-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">Subtotal Item</span>
                    <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notes Section */}
        <section className="mt-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 px-2">Notas / Términos</h2>
          <textarea
            className="w-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-3xl p-5 min-h-[120px] focus:ring-2 focus:ring-indigo-500/50 text-sm resize-y text-gray-800 dark:text-gray-200 shadow-inner"
            placeholder="Escribe términos de pago, tiempo de entrega, o notas especiales para el cliente..."
            value={quoteNotes}
            onChange={(e) => setQuoteNotes(e.target.value)}
          />
        </section>

      </div>

      {/* RIGHT COLUMN / BOTTOM STICKY: Summary Sidebar */}
      <div className="w-full lg:w-96 flex-shrink-0 z-40 fixed lg:sticky bottom-24 left-0 right-0 lg:top-4 lg:bottom-auto p-4 lg:p-0 pointer-events-none lg:pointer-events-auto">
        <div className="bg-white/85 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/60 dark:border-gray-700 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] lg:shadow-2xl rounded-3xl p-5 lg:p-8 pointer-events-auto transform transition-transform">

          <h2 className="hidden lg:block text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Resumen Cotización</h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm md:text-base">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm md:text-base">
              <span className="text-gray-500 font-medium">IVA (15%)</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">${iva.toFixed(2)}</span>
            </div>
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100">Total Final</span>
              <span
                className="text-2xl md:text-3xl font-black"
                style={{ color: settings.accentColor || '#4f46e5' }}
              >
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {validationError && (
            <div className="mb-5 p-4 bg-rose-50/80 dark:bg-rose-900/30 backdrop-blur border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm font-medium flex items-start gap-2">
              <i className="fas fa-exclamation-circle mt-0.5"></i>
              <span>{validationError}</span>
            </div>
          )}

          <button
            onClick={() => handleGenerate()}
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-lg"
          >
            {isSubmitting ? (
              <i className="fas fa-circle-notch fa-spin text-xl"></i>
            ) : (
              <>
                <span>{editQuoteId ? 'Actualizar Cotización' : 'Generar PDF'}</span>
                <i className="fas fa-paper-plane text-xl group-hover:translate-x-1 transition-transform"></i>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modals outside styling context */}
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
