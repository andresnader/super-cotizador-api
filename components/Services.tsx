
import React, { useState, useEffect } from 'react';
import { Service } from '../types';
import { dataManager } from '../services/dataManager';
import Modal from './Modal';

interface ServicesProps {
    isModal?: boolean;
}

const Services: React.FC<ServicesProps> = ({ isModal }) => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<Partial<Service>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const mode = dataManager.getMode();
    const sourceLabel = mode === 'google' ? 'Drive' : 'Local';

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleDelete = async (rowId?: any) => {
        if (!rowId) return;
        if (confirm(`¿Eliminar servicio? Esta acción es permanente en ${sourceLabel}.`)) {
            try {
                await dataManager.deleteService(rowId);
                await loadData();
            } catch (e) {
                console.error(e);
                alert("Error eliminando servicio");
            }
        }
    };

    const ServiceForm = () => (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4">
                 <input name="name" value={form.name || ''} onChange={handleChange} placeholder="Nombre del Servicio *" required className="p-3 border rounded-lg w-full" />
            </div>
            <div className="grid grid-cols-1 gap-4">
                <input name="price" type="number" step="0.01" value={form.price || ''} onChange={handleChange} placeholder="Precio ($) *" required className="p-3 border rounded-lg w-full" />
            </div>
            <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition font-semibold">
                    {isEditing ? `Actualizar (${sourceLabel})` : `Guardar (${sourceLabel})`}
                </button>
            </div>
        </form>
    );

    if (isModal) {
        return <div className="bg-white p-4"><h2 className="text-xl font-bold mb-6 text-gray-800">Nuevo Servicio</h2><ServiceForm /></div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Servicios ({sourceLabel})</h2>
                <button onClick={openCreateModal} className="w-full md:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md flex items-center justify-center">
                    <i className="fas fa-plus mr-2"></i> Agregar Nuevo
                </button>
            </div>
            <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-6 text-gray-800">{isEditing ? 'Editar' : 'Nuevo'}</h2>
                    <ServiceForm />
                </div>
            </Modal>
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i className="fas fa-search text-gray-400"></i></div>
                <input type="text" placeholder="Buscar servicio..." className="w-full pl-10 p-3 border border-gray-300 rounded-lg shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            {loading ? <p className="text-center text-gray-500">Cargando...</p> : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto mb-8 border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-500">Nombre</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500">Precio</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredServices.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No se encontraron servicios.</td></tr>
                            ) : (
                                filteredServices.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 text-gray-900 font-medium">{s.name}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800">${s.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEdit(s)} className="text-blue-600 hover:text-blue-800 mr-3"><i className="fas fa-edit"></i></button>
                                            <button onClick={() => handleDelete(s.rowId)} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Services;
