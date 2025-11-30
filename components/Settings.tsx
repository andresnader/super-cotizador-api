import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { dataManager } from '../services/dataManager';
import SettingsSidebar from './settings/SettingsSidebar';
import CompanyProfile from './settings/CompanyProfile';
import BrandKit from './settings/BrandKit';
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                {activeSection === 'brand' && (
                    <BrandKit
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
    );
};

export default Settings;
