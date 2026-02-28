import { useState, useEffect } from 'react';

export interface UserSettings {
    birthDate: string;
    gender: 'male' | 'female';
    artStyle: 'modern' | 'buddhist' | 'modern_buddhist';
}

const DEFAULT_SETTINGS: UserSettings = {
    birthDate: '',
    gender: 'male',
    artStyle: 'modern'
};

export function useUserSettings() {
    const [settings, setSettings] = useState<UserSettings>(() => {
        if (typeof window === 'undefined') return DEFAULT_SETTINGS;

        try {
            const saved = localStorage.getItem('pungsoo_user_settings');
            if (saved) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Failed to load user settings:', error);
        }

        return DEFAULT_SETTINGS;
    });

    const updateSettings = (newSettings: Partial<UserSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            try {
                localStorage.setItem('pungsoo_user_settings', JSON.stringify(updated));
            } catch (error) {
                console.error('Failed to save user settings:', error);
            }
            return updated;
        });
    };

    return { settings, updateSettings };
}
