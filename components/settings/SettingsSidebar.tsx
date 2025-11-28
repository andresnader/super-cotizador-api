import React from 'react';

interface SettingsSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeSection, onSectionChange }) => {
    const sections = [
        { id: 'company', label: 'Perfil de empresa', icon: 'fa-building' },
        { id: 'brand', label: 'Kit de Marca', icon: 'fa-palette' },
        { id: 'customize', label: 'Personalizar', icon: 'fa-paint-brush' },
        { id: 'data', label: 'Administrador de datos', icon: 'fa-database' }
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-2">
            {sections.map((section) => (
                <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={`
                        w-full text-left px-4 py-3 rounded-lg mb-1 transition-all duration-200
                        flex items-center space-x-3
                        ${activeSection === section.id
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
                    `}
                >
                    <i className={`fas ${section.icon} w-5 text-center`}></i>
                    <span>{section.label}</span>
                </button>
            ))}
        </div>
    );
};

export default SettingsSidebar;
