import React, { useState } from 'react';
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

const App: React.FC = () => {
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<string | null>(null);
    const [reportData, setReportData] = useState<Report[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isReportVisible, setIsReportVisible] = useState<boolean>(false);
    const [cardData, setCardData] = useLocalStorage<Map<string, CardDetails>>("cardDataStore", new Map<string, CardDetails>());
    const [conditionData, setConditionData] = useLocalStorage<string[]>("conditionDataStore", []);

    const handleYamlUpload = async (file: File) => {
        try {
            const input = await loadFromYamlFile(file);
            setCardData(input.deck);
            setConditionData(input.conditions);
            setError(null);
            console.log('File loaded successfully:', input);
        } catch (err) {
            setError(`Error loading file: ${(err as Error).message}`);
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
        setError(null);

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
            setError(`Error running simulation: ${(err as Error).message}`);
            console.error('Error running simulation:', err);
        } finally {
            setIsSimulationRunning(false);
        }
    };

    const toggleReportVisibility = () => {
        setIsReportVisible(!isReportVisible);
    };

    return (
        <div className="App">
            <h1>Probi-oh: Yu-Gi-Oh! Probability Simulator</h1>
            <FileInput onFileUpload={handleYamlUpload} acceptedExtensions={[".yaml", ".yml"]} importPrompt="Import Yaml" />
            {error && <p className="error-message">{error}</p>}
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
        </div>
    );
};

export default App;