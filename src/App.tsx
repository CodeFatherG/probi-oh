import React, { useCallback, useState } from 'react';
import './styles/App.css';
import SimulationRunner from './components/SimulationView/SimulationRunner';
import { CardDetails } from './utils/card-details';
import useLocalStorage from './components/Storage/LocalStorage';
import useLocalStorageMap from './components/Storage/MapStorage';
import ErrorBoundary from './components/ErrorBoundary';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import SettingsDialog, { Settings } from './components/Settings/SettingsDialog';
import SettingsIcon from '@mui/icons-material/Settings';
import GitLink from './components/GitLink';
import ConfigBuilder from './components/ConfigurationView/ConfigView';
import MobileDialog from './components/MobileDialog';

export default function App() {
    const [cardData, setCardData, clearCardData] = useLocalStorageMap<string, CardDetails>("cardDataStore", new Map<string, CardDetails>());
    const [conditionData, setConditionData, clearConditionData] = useLocalStorage<string[]>("conditionDataStore", []);
    const [settings, setSettings, clearSettings] = useLocalStorage<Settings>("settings", { 
        simulationIterations: 10000, 
        simulationHandSize: 5, 
        clearCache: false 
    });
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleSaveSettings = useCallback((newSettings: Settings) => {
        setSettingsOpen(false);

        if (newSettings.clearCache) {
            console.log('Clearing cache...');
            clearCardData();
            clearConditionData();
            clearSettings();
            return;
        }

        setSettings(newSettings);
        console.log('New settings:', newSettings);

    }, [setSettings]);

    const handleCardsUpdate = useCallback((cards: Map<string, CardDetails>): void => {
        setCardData(cards);
    }, [setCardData]);

    const handleConditionsUpdate = useCallback((conditions: string[]): void => {
        setConditionData(conditions);
    }, [setConditionData]);

    return (
        <ErrorBoundary>
            <Box className="app">
                <Typography className="heading" variant='h1' style={{paddingTop: "20px"}}>Probi-oh</Typography>
                <Typography className="heading" variant='h4'>Yu-Gi-Oh! Probability Simulator</Typography>
                <Stack spacing={2}>
                    <ConfigBuilder 
                        cardData={cardData}
                        conditionData={conditionData}
                        onCardsUpdate={handleCardsUpdate}
                        onConditionsUpdate={handleConditionsUpdate}
                    />
                    <SimulationRunner
                        disabled={(cardData.size ?? 0) === 0 || conditionData.length === 0}
                        cards={cardData}
                        conditions={conditionData}
                        settings={settings}
                    />
                </Stack>
                <IconButton
                    onClick={() => setSettingsOpen(true)}
                    sx={{
                        position: 'fixed',
                        top: 16,
                        right: 16,
                        bgcolor: 'background.paper',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                    }}
                    aria-label="settings"
                >
                    <SettingsIcon />
                </IconButton>
                <SettingsDialog
                    open={settingsOpen}
                    settings={settings}
                    onClose={() => setSettingsOpen(false)}
                    onSave={handleSaveSettings}
                />
            </Box>
            <GitLink link="https://github.com/CodeFatherG/probi-oh" text="Visit us on Github!" />
            <MobileDialog />
        </ErrorBoundary>
    );
}
