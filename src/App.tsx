import React, { useCallback, useState } from 'react';
import FileInput from './components/FileInput';
import SimulationRunner from './components/SimulationRunner';
import ProgressBar from './components/ProgressBar';
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

const App = () => {
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<string | null>(null);
    const [reportData, setReportData] = useState<Report[]>([]);
    const [isReportVisible, setIsReportVisible] = useState<boolean>(false);
    const [cardData, setCardData] = useLocalStorageMap<string, CardDetails>("cardDataStore", new Map<string, CardDetails>());
    const [conditionData, setConditionData] = useLocalStorage<string[]>("conditionDataStore", []);
    const [errorMessage, setErrorMessage] = useState('');

    const handleFileUpload = async (file: File) => {
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
    };

    const simulateDraw = async (deck: Deck, 
                        conditions: (BaseCondition)[], 
                        handSize: number, 
                        trials: number): Promise<Report[]> => {
        const simulations: Simulation[][] = Array(conditions.length).fill([]).map(() => []);
    
        for (let i = 0; i < trials; i++) {
            conditions.forEach((condition, index) => {
                const simulation = new Simulation(new GameState(deck.deepCopy()), condition);
                simulation.gameState.drawHand(handSize);
                simulations[index].push(simulation);
                simulation.iterate();
            });
            
            if (i % 100 === 0 || i === trials - 1) {
                const progress = ((i + 1) / trials) * 100;
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
            
            const reports = await simulateDraw(deck, conditions, 5, 10000);
            
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

    return (
        <div className="App">
            <h1 style={{
                display: 'flex',
                justifyContent: 'center',
            }}>
                Probi-oh: Yu-Gi-Oh! Probability Simulator
            </h1>

            
            <FileInput onFileUpload={handleFileUpload} acceptedExtensions={[".yaml", ".yml", ".ydk"]} importPrompt="Import File" />
            <CardTable
                cards={cardData}
                onUpdateCard={handleUpdateCard}
                onCreateCard={handleCreateCard}
                onDeleteCards={handleDeleteCards}
                onMoveCard={handleMoveCard}
            />
            <SimulationRunner onRun={runSimulation} disabled={(cardData.size ?? 0) === 0 || conditionData.length === 0 || isSimulationRunning} />
            {isSimulationRunning && <ProgressBar progress={progress} />}
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
        </div>
    );
};

export default App;