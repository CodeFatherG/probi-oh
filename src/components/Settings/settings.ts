const key = 'settings';

export interface Settings {
    simulationIterations: number;
    simulationHandSize: number;
}

function defaultSettings(): Settings {
    return {
        simulationIterations: 10000,
        simulationHandSize: 5
    };
}

function loadSettings(): Settings {
    const settings = localStorage.getItem(key);
    if (settings) {
        return JSON.parse(settings);
    }
    return defaultSettings();
}

let _settings: Settings = loadSettings();

export function getSettings(): Settings {
    return _settings;
}

export function saveSettings(settings: Settings) {
    _settings = settings;
    localStorage.setItem(key, JSON.stringify(_settings));
}
