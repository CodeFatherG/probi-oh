const key = 'settings';

export interface Settings {
    simulationIterations: number;
    simulationHandSize: number;
    statisticMaxPrecision: number;
}

function defaultSettings(): Settings {
    return {
        simulationIterations: 10000,
        simulationHandSize: 5,
        statisticMaxPrecision: 5,
    };
}

function loadSettings(): Settings {
    const defaultSettingsObj = defaultSettings();
    const storedSettings = localStorage.getItem(key);
    
    if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings) as Partial<Settings>;
        return {
            ...defaultSettingsObj,
            ...parsedSettings
        };
    }
    
    return defaultSettingsObj;
}

let _settings: Settings = loadSettings();

export function getSettings(): Settings {
    return _settings;
}

export function saveSettings(settings: Settings) {
    _settings = settings;
    localStorage.setItem(key, JSON.stringify(_settings));
}
