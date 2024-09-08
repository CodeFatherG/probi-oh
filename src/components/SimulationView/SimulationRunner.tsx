import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { CardDetails } from '../../utils/card-details';
import { BaseCondition } from '../../utils/condition';
import { Settings } from '../Settings/SettingsDialog';
import { Simulation } from '../../utils/simulation';
import { buildDeck, Deck } from '../../utils/deck';
import { GameState } from '../../utils/game-state';
import ResultDisplay from './ResultDisplay';
import { Report } from '../../utils/report';
import { Box, LinearProgress, Stack } from '@mui/material';

interface SimulationRunnerProps {
    disabled: boolean;
    cards: Map<string, CardDetails>;
    conditions: BaseCondition[];
    settings: Settings;
}

export default function SimulationRunner({ disabled, 
                                           cards, 
                                           conditions, 
                                           settings }: SimulationRunnerProps) {
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [reportData, setReportData] = useState<Report | null>(null);

    const simulateDraw = async (deck: Deck, 
                                conditions: BaseCondition[], 
                                handSize: number, 
                                trials: number): Promise<Simulation[]> => {
        const simulations: Simulation[] = [];

        for (let i = 0; i < trials; i++) {
            // Create the game state for this trial
            const gamestate = new GameState(deck.deepCopy());

            // draw the hand for this trial so it is common to all conditions   
            gamestate.drawHand(handSize);

            const simulation = new Simulation(gamestate.deepCopy(), conditions);
            simulations.push(simulation);

            // Run the simulation
            simulation.iterate();

            if (i % 100 === 0 || i === trials - 1) {
                const progress = Math.round(((i + 1) / trials) * 100);
                setProgress(progress);

                // Yield to the event loop to keep UI responsive
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        return simulations
    }

    const runSimulation = async () => {
        setProgress(0);
        setIsSimulationRunning(true);
        setReportData(null);

        try {
            console.log(`Cards: ${Array.from(cards, ([card, details]) => `${card}: ${details.qty || 1}`).join(', ')}`);
            const deck = buildDeck(cards);

            const sims = await simulateDraw(deck, conditions, settings.simulationHandSize, settings.simulationIterations);
            const report = Report.generateReports(sims);

            setReportData(report);
        } catch (err) {
            console.error('Error running simulation:', err);
        } finally {
            setIsSimulationRunning(false);
        }
    };

    return (
        <Stack spacing={2} sx={{ width: '100%' }}>
            <Button 
                variant="contained" 
                onClick={() => runSimulation()} 
                disabled={disabled || isSimulationRunning}
                fullWidth
            >
                Run Simulation
            </Button>
            
            {isSimulationRunning && (
                <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ height: '10px' }}
                />
            )}
            
            {reportData && (
                <Box sx={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center' 
                }}>
                    <ResultDisplay report={reportData} />
                </Box>
            )}
        </Stack>
    );
}
