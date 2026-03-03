
import React, { useState, useEffect } from 'react';
import { Service } from '../types';
import { dataManager } from '../services/dataManager';
import Modal from './Modal';

interface ServicesProps {
    isModal?: boolean;
}

// Extracted ServiceForm to prevent re-renders during typing
interface ServiceFormProps {
    form: Partial<Service>;
    isEditing: boolean;


    onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ form, isEditing, onFormChange, onSubmit, onCancel }) => (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
                <input name="code" value={form.code || ''} onChange={onFormChange} placeholder="Código *" required className="w-full bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm" />
            </div>
            <div className="relative">
                <input name="name" value={form.name || ''} onChange={onFormChange} placeholder="Nombre del Servicio *" required className="w-full bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm" />
            </div>
        </div>
        <div className="relative">
            <textarea name="description" value={form.description || ''} onChange={onFormChange} placeholder="Descripción" className="w-full bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm" rows={3} />
        </div>
        <div className="relative">
            <input name="price" type="number" step="0.01" value={form.price || ''} onChange={onFormChange} placeholder="Precio ($) *" required className="w-full bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm" />
        </div>
        <div className="flex gap-4 mt-2">
            <button type="button" onClick={onCancel} className="flex-1 bg-white/50 backdrop-blur-sm border border-white/50 text-slate-700 p-4 rounded-full font-semibold hover:bg-white/70 transition-all shadow-sm active:scale-[0.98]">Cancelar</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-full font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {isEditing ? 'Actualizar' : 'Guardar'}
            </button>
        </div>
    </form>
);

const Services: React.FC<ServicesProps> = ({ isModal }) => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<Partial<Service>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');




    const loadData = async () => {
        setLoading(true);
        try {
            const data = await dataManager.fetchServices();
            setServices(data);
        } catch (e) {
            console.error(e);
            alert("Error cargando servicios");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredServices = services.filter(s => {
        const term = searchTerm.toLowerCase();
        return (
            (s.name || '').toLowerCase().includes(term) ||
            (s.code || '').toLowerCase().includes(term)
        );
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setForm({ ...form, [e.target.name]: val });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newService = { ...form } as Service;
            await dataManager.saveService(newService);
            await loadData();
            setForm({});
            setIsEditing(false);
            setShowFormModal(false);
        } catch (e) {
            console.error(e);
            alert("Error guardando servicio");
        }
    };

    const handleEdit = (s: Service) => {
        setForm(s);
        setIsEditing(true);
        setShowFormModal(true);
    };

    const openCreateModal = () => {
        setForm({});
        setIsEditing(false);
        setShowFormModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!id) return;
        if (confirm(`¿Eliminar servicio? Esta acción es permanente.`)) {
            try {
                await dataManager.deleteService(id);
                await loadData();
            } catch (e) {
                console.error(e);
                alert("Error eliminando servicio");
            }
        }
    };

    if (isModal) {
        return (
            <div className="p-2">
                <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800">Nuevo Servicio</h2>
                <ServiceForm
                    form={form}
                    isEditing={isEditing}
                    onFormChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowFormModal(false)}
                />
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-7xl mx-auto">
            {/* Background elements for Liquid Glass */}
            <div className="absolute top-0 -left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-10 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="relative bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2rem] p-6 md:p-8 overflow-hidden mb-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800">
                        Servicios
                    </h2>
                    <button onClick={openCreateModal} className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold flex items-center justify-center">
                        <i className="fas fa-plus mr-2"></i> Nuevo Servicio
                    </button>
                </div>

                <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}>
                    <div className="p-6 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60">
                        <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-800">{isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                        <ServiceForm
                            form={form}
                            isEditing={isEditing}
                            onFormChange={handleChange}
                            onSubmit={handleSubmit}
                            onCancel={() => setShowFormModal(false)}
                        />
                    </div>
                </Modal>

                <div className="mb-8 relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-search text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar servicio por código o nombre..."
                        className="w-full pl-12 pr-4 py-4 bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
                        {filteredServices.length === 0 ? (
                            <div className="col-span-full py-12 text-center bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl">
                                <i className="fas fa-box-open text-5xl text-slate-300 mb-4 inline-block"></i>
                                <p className="text-slate-500 font-medium">No se encontraron servicios.</p>
                            </div>
                        ) : (
                            filteredServices.map(s => (
                                <div key={s.id} className="group bg-white/50 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:bg-white/60 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="inline-block px-3 py-1 bg-indigo-50/50 border border-indigo-100/50 text-indigo-700 text-xs font-bold rounded-full mb-2 backdrop-blur-sm">
                                                {s.code}
                                            </span>
                                            <h3 className="text-xl font-bold text-slate-800 line-clamp-2">{s.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white/40 backdrop-blur-sm px-1 py-1 rounded-2xl border border-white/50 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(s)} className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors" aria-label="Editar"><i className="fas fa-edit"></i></button>
                                            <button onClick={() => handleDelete(s.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" aria-label="Eliminar"><i className="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-sm mb-6 flex-grow line-clamp-3 leading-relaxed">
                                        {s.description || 'Sin descripción...'}
                                    </p>
                                    <div className="pt-4 border-t border-white/40 flex justify-between items-end mt-auto">
                                        <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Precio Unitario</span>
                                        <span className="text-2xl font-extrabold text-indigo-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                            ${s.price.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Services;
