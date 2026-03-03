import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { dataManager } from '../services/dataManager';
import SettingsSidebar from './settings/SettingsSidebar';
import CompanyProfile from './settings/CompanyProfile';
import ThemeCustomization from './settings/ThemeCustomization';
import DataManager from './settings/DataManager';

interface SettingsProps {
    settings: CompanySettings;
    onUpdate: (settings: CompanySettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
    const [activeSection, setActiveSection] = useState('company');

    const handleSettingsUpdate = async (newSettings: CompanySettings) => {
        try {
            await dataManager.saveCompanySettings(newSettings);
            onUpdate(newSettings);
            alert('✓ Cambios guardados exitosamente');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('Error al guardar los cambios');
        }
    };

    return (
        <div className="relative w-full max-w-7xl mx-auto">
            {/* Background elements for Liquid Glass */}
            <div className="absolute top-0 -left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none"></div>
            <div className="absolute top-0 -right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
            <div className="absolute -bottom-10 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 pointer-events-none"></div>

            <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-6 z-10 mb-12">
                {/* Sidebar - 1 columna */}
                <div className="lg:col-span-1">
                    <SettingsSidebar
                        activeSection={activeSection}
                        onSectionChange={setActiveSection}
                    />
                </div>

                {/* Content - 3 columnas */}
                <div className="lg:col-span-3">
                    {activeSection === 'company' && (
                        <CompanyProfile
                            settings={settings}
                            onUpdate={handleSettingsUpdate}
                        />
                    )}
                    {activeSection === 'customize' && (
                        <ThemeCustomization
                            settings={settings}
                            onUpdate={handleSettingsUpdate}
                        />
                    )}
                    {activeSection === 'data' && (
                        <DataManager />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
