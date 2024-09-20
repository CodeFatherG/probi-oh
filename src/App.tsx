import React, { useCallback, useEffect, useState } from 'react';
import './styles/App.css';
import SimulationRunner from './components/SimulationView/SimulationRunner';
import { CardDetails } from './core/data/card-details';
import useLocalStorage from './hooks/useLocalStorage';
import useLocalStorageMap from './hooks/useLocalStorageMap';
import ErrorBoundary from './components/ErrorBoundary';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import SettingsDialog, { Settings } from './components/Settings/SettingsDialog';
import SettingsIcon from '@mui/icons-material/Settings';
import GitLink from './components/GitLink';
import ConfigBuilder from './components/ConfigurationView/ConfigView';
import MobileDialog from './components/MobileDialog';
import SimulationDrawer from './components/SimulationDrawer/SimulationDrawer';
import { simulationRepository } from './core/data/simulation-repository';
import { loadFromYamlString } from './core/data/yaml-manager';

export default function App() {
    const [cardData, setCardData] = useLocalStorageMap<string, CardDetails>("cardDataStore", new Map<string, CardDetails>());
    const [conditionData, setConditionData] = useLocalStorage<string[]>("conditionDataStore", []);
    const [settings, setSettings] = useLocalStorage<Settings>("settings", { 
        simulationIterations: 10000, 
        simulationHandSize: 5, 
        clearCache: false 
    });
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        console.log('Starting App...');
    }, []);

    const handleSaveSettings = useCallback((newSettings: Settings) => {
        setSettingsOpen(false);

        if (newSettings.clearCache) {
            console.log('Clearing cache...');
            localStorage.clear();
            window.location.reload();
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

    const handleApplySimulation = (simulationId: string) => {
        console.log('Applying simulation:', simulationId);
        const record = simulationRepository.getRecord(simulationId);
        if (record) {
            try {
                const input = loadFromYamlString(record.yaml);
                setCardData(input.deck);
                setConditionData(input.conditions);
            } catch (error) {
                console.error("Error applying simulation:", error);
            }
        } else {
            throw new Error(`Simulation not found ${simulationId}`);
        }
    };

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
            <SimulationDrawer onApply={handleApplySimulation}/>
        </ErrorBoundary>
    );
}
