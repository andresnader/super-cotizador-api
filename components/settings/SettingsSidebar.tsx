import React from 'react';

interface SettingsSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeSection, onSectionChange }) => {
    const sections = [
        { id: 'company', label: 'Perfil de empresa', icon: 'fa-building' },
        { id: 'customize', label: 'Apariencia y Marca', icon: 'fa-paint-brush' },
        { id: 'data', label: 'Administrador de datos', icon: 'fa-database' }
    ];

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-lg rounded-[2rem] p-3">
            {sections.map((section) => (
                <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={`
                        w-full text-left px-5 py-4 rounded-2xl mb-2 transition-all duration-300
                        flex items-center space-x-4
                        ${activeSection === section.id
                            ? 'bg-white/80 text-indigo-800 font-bold shadow-sm border border-white/50 ring-1 ring-indigo-500/20'
                            : 'text-slate-600 hover:bg-white/50 hover:text-indigo-700'
                        }
                    `}
                >
                    <i className={`fas ${section.icon} w-6 text-center text-lg`}></i>
                    <span className="text-base">{section.label}</span>
                </button>
            ))}
        </div>
    );
};

export default SettingsSidebar;
