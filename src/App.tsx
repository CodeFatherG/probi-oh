import React, { useCallback, useMemo, useState } from 'react';
import FileInput from './components/FileInput';
import SimulationRunner from './components/SimulationRunner';
import ResultDisplay from './components/ResultDisplay';
import { buildDeck, Deck } from './utils/deck';
import { BaseCondition } from './utils/condition';
import { Simulation } from './utils/simulation';
import { GameState } from './utils/game-state';
import { Report } from './utils/report';
import { loadFromYamlFile } from './utils/yaml-manager';
import ReportDisplay from './components/ReportDisplay';
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
import { Box, Grid, IconButton, LinearProgress } from '@mui/material';
import ConditionList from './components/ConditionList';
import LoadingOverlay from './components/LoadingOverlay';
import SettingsDialog, { Settings } from './components/SettingsDialog';
import SettingsIcon from '@mui/icons-material/Settings';

const App = () => {
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<string | null>(null);
    const [reportData, setReportData] = useState<Report[]>([]);
    const [isReportVisible, setIsReportVisible] = useState<boolean>(false);
    const [cardData, setCardData] = useLocalStorageMap<string, CardDetails>("cardDataStore", new Map<string, CardDetails>());
    const [conditionData, setConditionData] = useLocalStorage<string[]>("conditionDataStore", []);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useLocalStorage<Settings>("settings", { simulationIterations: 10000 });
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

    const simulateDraw = async (deck: Deck, 
                        conditions: (BaseCondition)[], 
                        handSize: number, 
                        trials: number): Promise<Report[]> => {
        const simulations: Simulation[][] = Array(conditions.length).fill([]).map(() => []);
    
        for (let i = 0; i < trials; i++) {
            // Create the game state for this trial
            const gamestate = new GameState(deck.deepCopy());

            // draw the hand for this trial so it is common to all conditions   
            gamestate.drawHand(handSize);

            conditions.forEach((condition, index) => {
                // Create the simulation for this condition
                const simulation = new Simulation(gamestate.deepCopy(), condition);
                simulations[index].push(simulation);
                simulation.iterate();
            });
            
            if (i % 100 === 0 || i === trials - 1) {
                const progress = Math.round(((i + 1) / trials) * 100);
                setProgress(progress);

                // Yield to the event loop to keep UI responsive
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    
        return simulations.flatMap(simulationSet => Report.generateReports(simulationSet));
    }

    const runSimulation = async () => {
        setProgress(0);
        setResult(null);
        setIsSimulationRunning(true);

        try {
            console.log(`Cards: ${Array.from(cardData, ([card, details]) => `${card}: ${details.qty || 1}`).join(', ')}`);
            const deck = buildDeck(cardData);
            const conditions = conditionData.map(condition => parseCondition(condition));
            console.log('Starting simulation...');
            console.log(`Deck size: ${deck.deckCount}`);
            console.log(`Cards in deck: ${deck.deckList.map(card => card.name).join(', ')}`);
            
            const reports = await simulateDraw(deck, conditions, 5, settings.simulationIterations);
            
            // Find maximum probability
            const maxProbability = Math.max(...reports.map(report => report.successRate));
            
            setResult(`Maximum probability of success: ${(maxProbability * 100).toFixed(2)}%`);
            
            setReportData(reports);
            
            console.log(`Simulation complete. Maximum success probability: ${(maxProbability * 100).toFixed(2)}%`);
        } catch (err) {
            console.error('Error running simulation:', err);
        } finally {
            setIsSimulationRunning(false);
        }
    };

    const toggleReportVisibility = () => {
        setIsReportVisible(!isReportVisible);
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

    const handleMoveCard = useCallback((name: string, direction: 'up' | 'down') => {
        setCardData(prevData => {
            const entries: [string, CardDetails][] = Array.from(prevData.entries());
            const index = entries.findIndex(([key]) => key === name);
            if (index === -1) return prevData; // Card not found
    
            const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(entries.length - 1, index + 1);
            if (newIndex === index) return prevData; // No change needed
    
            const [movedEntry] = entries.splice(index, 1);
            entries.splice(newIndex, 0, movedEntry);
    
            return new Map(entries);
        });
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
        setSettings(newSettings);
        console.log('New settings:', newSettings);

    }, [setSettings]);

    return (
        <div className="App">
            <LoadingOverlay isLoading={isLoading} />
            <h1 style={{
                display: 'flex',
                justifyContent: 'center',
            }}>
                Probi-oh: Yu-Gi-Oh! Probability Simulator
            </h1>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Box display="flex" flexDirection="row" gap={2}>
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
                </Grid>
                <Grid item xs={12}>
                    <CardTable
                        cards={cardData}
                        onUpdateCard={handleUpdateCard}
                        onCreateCard={handleCreateCard}
                        onDeleteCards={handleDeleteCards}
                        onMoveCard={handleMoveCard}
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
                    <SimulationRunner onRun={runSimulation} disabled={(cardData.size ?? 0) === 0 || conditionData.length === 0 || isSimulationRunning} />
                </Grid>
            </Grid>
            
            {isSimulationRunning && <LinearProgress variant="determinate" value={progress} />}
            {result && <ResultDisplay result={result} />}
            {reportData.length > 0 && (
                <div>
                <button onClick={toggleReportVisibility}>
                    {isReportVisible ? 'Hide Report' : 'Show Report'}
                </button>
                {isReportVisible && <ReportDisplay reports={reportData} />}
            </div>
            )}
            <ErrorSnackbar 
                message={errorMessage} 
                onClose={() => setErrorMessage('')}
            />
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
        </div>
    );
};

export default App;