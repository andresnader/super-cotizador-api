import React, { useState, useEffect } from 'react';
import { Service } from '../types';
import { getServices, saveServices } from '../services/storage';
import Modal from './Modal';

interface ServicesProps {
    isModal?: boolean;
}

const Services: React.FC<ServicesProps> = ({ isModal }) => {
    const [services, setServices] = useState<Service[]>([]);
    const [form, setForm] = useState<Partial<Service>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    // UI State
    const [showFormModal, setShowFormModal] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Sort State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Service; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        const loadServices = async () => {
            try {
                setLoading(true);
                const data = await getServices();
                setServices(data);
            } catch (error) {
                console.error('Error loading services:', error);
            } finally {
                setLoading(false);
            }
        };
        loadServices();
    }, []);

    // Filtered Services based on Search
    const filteredServices = services.filter(s => {
        const term = searchTerm.toLowerCase();
        return (
            s.name.toLowerCase().includes(term) ||
            s.code.toLowerCase().includes(term) ||
            (s.category && s.category.toLowerCase().includes(term))
        );
    });

    // Sort Logic
    const handleSort = (key: keyof Service) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedServices = [...filteredServices].sort((a, b) => {
        if (!sortConfig) return 0;
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;

        // Handle nulls/undefined safely
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (sortConfig.direction === 'asc') {
            return aValue < bValue ? -1 : 1;
        } else {
            return aValue > bValue ? -1 : 1;
        }
    });

    const getSortIcon = (key: keyof Service) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <i className="fas fa-sort text-gray-300 ml-1"></i>;
        }
        return sortConfig.direction === 'asc'
            ? <i className="fas fa-sort-up text-indigo-600 ml-1"></i>
            : <i className="fas fa-sort-down text-indigo-600 ml-1"></i>;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setForm({ ...form, [e.target.name]: val });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let newServices = [...services];
            if (isEditing && form.id) {
                newServices = newServices.map(s => s.id === form.id ? form as Service : s);
            } else {
                const newService = { ...form, id: `service_${Date.now()}` } as Service;
                newServices.push(newService);
            }
            setServices(newServices);
            await saveServices(newServices);
            setForm({});
            setIsEditing(false);
            setShowFormModal(false);
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Error al guardar el servicio');
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
        if (confirm("¿Eliminar servicio?")) {
            try {
                const newServices = services.filter(s => s.id !== id);
                setServices(newServices);
                await saveServices(newServices);
            } catch (error) {
                console.error('Error deleting service:', error);
                alert('Error al eliminar el servicio');
            }
        }
    };

    const ServiceForm = () => (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                    <input name="code" value={form.code || ''} onChange={handleChange} placeholder="Código *" required className="p-3 border rounded-lg w-full" />
                </div>
                <div className="col-span-2">
                    <input name="name" value={form.name || ''} onChange={handleChange} placeholder="Nombre del Servicio *" required className="p-3 border rounded-lg w-full" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <input name="price" type="number" step="0.01" value={form.price || ''} onChange={handleChange} placeholder="Precio ($) *" required className="p-3 border rounded-lg w-full" />
                <input name="category" value={form.category || ''} onChange={handleChange} placeholder="Categoría (Ej: Hosting)" className="p-3 border rounded-lg w-full" />
            </div>

            <textarea name="description" value={form.description || ''} onChange={handleChange} placeholder="Descripción detallada del servicio..." className="p-3 border rounded-lg w-full" rows={3} />

            <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => { setShowFormModal(false); if (isModal) window.location.reload(); }} className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition font-semibold">
                    {isEditing ? 'Actualizar Servicio' : 'Guardar Servicio'}
                </button>
            </div>
        </form>
    );

    if (isModal) {
        return (
            <div className="bg-white p-4">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Nuevo Servicio</h2>
                <ServiceForm />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Cargando servicios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Servicios</h2>
                <button
                    onClick={openCreateModal}
                    className="w-full md:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md flex items-center justify-center"
                >
                    <i className="fas fa-plus mr-2"></i> Agregar Nuevo Servicio
                </button>
            </div>

            {/* Form Modal */}
            <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-6 text-gray-800">{isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                    <ServiceForm />
                </div>
            </Modal>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                    type="text"
                    placeholder="Buscar servicio por Nombre, Código o Categoría..."
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto mb-8 border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th
                                className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                onClick={() => handleSort('code')}
                            >
                                Código {getSortIcon('code')}
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                onClick={() => handleSort('name')}
                            >
                                Nombre / Categoría {getSortIcon('name')}
                            </th>
                            <th
                                className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500 tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                onClick={() => handleSort('price')}
                            >
                                Precio {getSortIcon('price')}
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500 tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedServices.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No se encontraron servicios.</td></tr>
                        ) : (
                            sortedServices.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50 transition group">
                                    <td className="px-6 py-4 font-mono text-sm font-semibold text-indigo-600">{s.code}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{s.name}</div>
                                        <div className="text-xs text-gray-500 bg-gray-100 border border-gray-200 inline-block px-2 py-0.5 rounded mt-1">{s.category || 'General'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-800">${s.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEdit(s)} className="text-blue-600 hover:text-blue-800 mr-3 transition p-2 hover:bg-blue-50 rounded" title="Editar"><i className="fas fa-edit"></i></button>
                                        <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 transition p-2 hover:bg-red-50 rounded" title="Eliminar"><i className="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Services;
