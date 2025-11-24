import React, { useState, useEffect } from 'react';
import { Client, Service, QuoteItem, Quote, CompanySettings } from '../types';
import { getClients, getServices, getQuoteCounter, incrementQuoteCounter, saveQuotes, getQuotes } from '../services/storage';
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
  
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [quoteDate, setQuoteDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteNotes, setQuoteNotes] = useState('');
  
  // Selection State
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [previewService, setPreviewService] = useState<Partial<Service>>({});
  const [customDetail, setCustomDetail] = useState('');

  // Modals
  const [showClientModal, setShowClientModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    setClients(getClients());
    setServices(getServices());
  }, []);

  // Update client list when modal closes
  const refreshData = () => {
    setClients(getClients());
    setServices(getServices());
  };

  const handleServiceSelect = (id: string) => {
    setSelectedServiceId(id);
    const s = services.find(srv => srv.id === id);
    if (s) {
      setPreviewService({ ...s });
    } else {
      setPreviewService({});
    }
    setCustomDetail('');
  };

  const addService = () => {
    if (!selectedServiceId && !previewService.price) return;
    
    // Find master service to get category/cost defaults if available
    const master = services.find(s => s.id === selectedServiceId);

    const baseDesc = previewService.description || '';
    const finalDesc = customDetail ? `${baseDesc}\n\nDETALLE ADICIONAL: ${customDetail}` : baseDesc;

    const newItem: QuoteItem = {
      id: selectedServiceId || `custom_${Date.now()}`,
      name: previewService.name || 'Servicio Personalizado',
      code: previewService.code || 'CUSTOM',
      description: finalDesc,
      price: previewService.price || 0,
      quantity: 1,
      category: master?.category || '',
      cost: master?.cost || 0
    };

    setQuoteItems([...quoteItems, newItem]);
    
    // Reset selection
    setSelectedServiceId('');
    setPreviewService({});
    setCustomDetail('');
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

  const calculateTotals = () => {
    const subtotal = quoteItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const iva = subtotal * 0.15;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const { subtotal, iva, total } = calculateTotals();

  const handleSaveAndPrint = () => {
    if (!selectedClient) {
      alert("Seleccione un cliente");
      return;
    }
    if (quoteItems.length === 0) {
      alert("Agregue al menos un ítem");
      return;
    }

    const clientObj = clients.find(c => c.id === selectedClient);
    if (!clientObj) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const seq = incrementQuoteCounter().toString().padStart(4, '0');
    const number = `${clientObj.code}-${dateStr}${timeStr}-${seq}`;

    const newQuote: Quote = {
      id: `quote_${Date.now()}`,
      number,
      issueDate: new Date().toLocaleDateString('es-EC'),
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

    const history = getQuotes();
    saveQuotes([...history, newQuote]);
    
    // Reset form
    setQuoteItems([]);
    setQuoteNotes('');
    
    onPrint(newQuote);
  };

  const currentClient = clients.find(c => c.id === selectedClient);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Form */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">Crear Nueva Cotización</h2>
        
        {/* Client Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente</label>
            <div className="flex space-x-2">
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">-- Seleccionar --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button 
                onClick={() => setShowClientModal(true)} 
                className="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition"
              >
                <i className="fas fa-user-plus"></i>
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RUC / C.I.</label>
            <input 
              type="text" 
              readOnly 
              className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg"
              value={currentClient?.ruc || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Validez</label>
            <input 
              type="date" 
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={quoteDate}
              onChange={(e) => setQuoteDate(e.target.value)}
            />
          </div>
        </div>

        {/* Service Selection */}
        <div className="flex flex-col gap-4 mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Servicio</label>
                <div className="flex space-x-2">
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={selectedServiceId}
                    onChange={(e) => handleServiceSelect(e.target.value)}
                  >
                    <option value="">-- Seleccionar --</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
                  </select>
                  <button 
                    onClick={() => setShowServiceModal(true)}
                    className="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
               <input 
                 type="number" 
                 step="0.01"
                 className="w-full p-2 border border-gray-300 rounded-lg text-right"
                 value={previewService.price || ''}
                 onChange={(e) => setPreviewService({...previewService, price: parseFloat(e.target.value)})}
                 placeholder="0.00"
               />
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Base</label>
             <textarea 
               className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm" 
               rows={2}
               readOnly
               value={previewService.description || ''}
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Detalle Adicional (Opcional)</label>
             <textarea 
               className="w-full p-2 border border-gray-300 rounded-lg text-sm" 
               rows={2}
               placeholder="Ej: Licencia por 1 año..."
               value={customDetail}
               onChange={(e) => setCustomDetail(e.target.value)}
             />
           </div>

           <button 
             onClick={addService}
             className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm font-semibold"
           >
             <i className="fas fa-plus mr-2"></i> Añadir a Cotización
           </button>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cant</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quoteItems.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-gray-500">Añada servicios...</td></tr>
              ) : (
                quoteItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-500 whitespace-pre-wrap">{item.description}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        min="1" 
                        className="w-16 text-center border rounded p-1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                       <input 
                        type="number" 
                        step="0.01"
                        className="w-20 text-right border rounded p-1"
                        value={item.price}
                        onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeService(idx)} className="text-red-500 hover:text-red-700">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Notes */}
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
           <textarea 
             className="w-full p-2 border border-gray-300 rounded-lg shadow-sm h-24"
             placeholder="Términos y condiciones, etc."
             value={quoteNotes}
             onChange={(e) => setQuoteNotes(e.target.value)}
           />
        </div>
      </div>

      {/* Right Column: Summary */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit sticky top-4">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">Resumen</h2>
        <div className="space-y-4 mb-8">
           <div className="flex justify-between items-center text-lg">
             <span className="font-medium text-gray-600">Subtotal:</span>
             <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
           </div>
           <div className="flex justify-between items-center text-lg">
             <span className="font-medium text-gray-600">IVA (15%):</span>
             <span className="font-semibold text-gray-900">${iva.toFixed(2)}</span>
           </div>
           <hr />
           <div className="flex justify-between items-center text-2xl font-bold" style={{ color: settings.accentColor }}>
             <span>TOTAL:</span>
             <span>${total.toFixed(2)}</span>
           </div>
        </div>
        
        <button 
          onClick={handleSaveAndPrint}
          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition shadow-lg text-lg font-semibold flex items-center justify-center"
        >
          <i className="fas fa-print mr-2"></i> Generar e Imprimir
        </button>
      </div>

      {/* Modals for Quick Add */}
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