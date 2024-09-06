import React, { useCallback, useMemo, useState } from 'react';
import './styles/App.css';
import FileInput from './components/FileInput';
import SimulationRunner from './components/SimulationRunner';
import { loadFromYamlFile, serialiseSimulationInputToYaml } from './utils/yaml-manager';
import { CardDetails } from './utils/card-details';
import useLocalStorage from './components/LocalStorage';
import { parseCondition } from './utils/parser';
import useLocalStorageMap from './components/MapStorage';
import CardTable from './components/CardTable';
import { getCardByName } from './utils/card-api';
import ErrorSnackbar from './components/ErrorSnackbar';
import { getCardDetails } from './utils/details-provider';
import { loadFromYdkFile } from './utils/ydk-manager';
import SaveFileComponent from './components/SaveFile';
import { Box, Grid, IconButton, Link } from '@mui/material';
import ConditionList from './components/ConditionList';
import LoadingOverlay from './components/LoadingOverlay';
import SettingsDialog, { Settings } from './components/SettingsDialog';
import SettingsIcon from '@mui/icons-material/Settings';
import CopyButton from './components/CopyButton';
import { SimulationInput } from './utils/simulation-input';

export default function App() {
    const [cardData, setCardData, clearCardData] = useLocalStorageMap<string, CardDetails>("cardDataStore", new Map<string, CardDetails>());
    const [conditionData, setConditionData, clearConditionData] = useLocalStorage<string[]>("conditionDataStore", []);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings, clearSettings] = useLocalStorage<Settings>("settings", { 
        simulationIterations: 10000, 
        simulationHandSize: 5, 
        clearCache: false 
    });
    const [settingsOpen, setSettingsOpen] = useState(false);

    const autocompleteOptions = useMemo(() => {
        const options = new Set<string>();
        cardData.forEach((details, name) => {
            options.add(name);
            details.tags?.forEach(tag => options.add(tag));
        });
        return Array.from(options);
    }, [cardData]);

    const handleFileUpload = async (file: File) => {
        setIsLoading(true);
        try {
            if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
                const input = await loadFromYamlFile(file);
                setCardData(input.deck);
                setConditionData(input.conditions);
            }
            else if (file.name.endsWith('.ydk')) {
                setCardData(await loadFromYdkFile(file));
            }
            
            console.log('File loaded successfully:', file.name);
        } catch (err) {
            console.error('Error loading file:', err);
        }
        setIsLoading(false);
    };

    // CardTable callback hooks
    const handleUpdateCard = useCallback((name: string, details: CardDetails) => {
        setCardData(prevData => {
            const newData = new Map(prevData);
            newData.set(name, details);
            return newData;
        });
    }, [setCardData]);

    const handleCreateCard = useCallback(async (name: string) => {
        if (cardData.has(name)) {
            console.warn(`Card "${name}" already exists`);
            return;
        }

        let cardInfo = null;
        let cardDetails: CardDetails = {qty: 1};
        try {
            cardInfo = await getCardByName(name);

            if (cardInfo === null) {
                setErrorMessage(`Failed to fetch card information for "${name}"`);
            }
            else {
                // We have Card Info, lets make some populated data
                cardDetails = await getCardDetails(cardInfo);
                cardDetails.qty = 1;
            }
        } catch {
            setErrorMessage(`Failed to fetch card information for "${name}"`);
        }

        setCardData(prevData => {
            const newData = new Map(prevData);
            newData.set(name, cardDetails);
            return newData;
        });
    }, [cardData, setCardData]);

    const handleDeleteCards = useCallback((names: string[]) => {
        setCardData(prevData => {
            const newData = new Map(prevData);
            names.forEach(name => newData.delete(name));
            return newData;
        });
    }, [setCardData]);

    const handleReorderCards = useCallback((reorderedCards: Map<string, CardDetails>) => {
        setCardData(reorderedCards);
    }, [setCardData]);

    const handleConditionsChange = useCallback((newConditions: string[]) => {
        const conditions: string[] = [];
        for (const condition of newConditions) {
            if (condition.trim() !== '') {
                try {
                    // Will throw if fatal error
                    parseCondition(condition);

                    // If we made it here then valid condition
                    conditions.push(condition);
                }
                catch (e) {
                    console.error(`Invalid condition: ${condition}\n${e}`);
                    setErrorMessage(`Invalid condition: ${condition}\t${e}`);
                }
            }
        }

        setConditionData(conditions);
    }, [setConditionData]);

    const handleOpenSettings = useCallback(() => {
        setSettingsOpen(true);
    }, [setSettingsOpen]);

    const handleCloseSettings = useCallback(() => {
        setSettingsOpen(false);
    }, [setSettingsOpen]);

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

    return (
        <>
            <Box className="app">
                <LoadingOverlay isLoading={isLoading} />
                <h1 className="heading" style={{paddingTop: "20px"}}>Probi-oh</h1>
                <h3 className="heading">Yu-Gi-Oh! Probability Simulator</h3>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" gap={2}>
                                <FileInput 
                                    onFileUpload={handleFileUpload} 
                                    acceptedExtensions={[".yaml", ".yml", ".ydk"]} 
                                    importPrompt="Import File" 
                                />
                                <SaveFileComponent 
                                    cardData={cardData} 
                                    conditionData={conditionData} 
                                />
                            </Box>
                            <CopyButton 
                                getText={() => {
                                    const input: SimulationInput = {
                                        deck: cardData,
                                        conditions: conditionData,
                                    };
                    
                                    return serialiseSimulationInputToYaml(input);
                                }}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <CardTable
                            cards={cardData}
                            onUpdateCard={handleUpdateCard}
                            onCreateCard={handleCreateCard}
                            onDeleteCards={handleDeleteCards}
                            onReorderCards={handleReorderCards}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <ConditionList 
                            conditions={conditionData} 
                            onConditionsChange={handleConditionsChange}
                            autocompleteOptions={autocompleteOptions}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <SimulationRunner
                            disabled={(cardData.size ?? 0) === 0 || conditionData.length === 0}
                            cards={cardData}
                            conditions={conditionData.map(parseCondition)}
                            settings={settings}
                        />

                    </Grid>
                </Grid>
                <IconButton
                    onClick={handleOpenSettings}
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
                    onClose={handleCloseSettings}
                    onSave={handleSaveSettings}
                />
                <ErrorSnackbar message={errorMessage}/>
            </Box>
        </>
    );
}
