import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { CardDetails } from '../../../core/data/card-details';
import { BaseCondition } from '../../../core/sim/condition';
import { Simulation } from '../../../core/sim/simulation';
import { buildDeck, Deck } from '../../../core/data/deck';
import { GameState } from '../../../core/data/game-state';
import ResultDisplay from './ResultDisplay';
import { Report, generateReport } from '../../../core/sim/report';
import { Box, LinearProgress, Stack } from '@mui/material';
import { parseCondition } from '../../../core/data/parser';
import { recordSimulation } from '../../db/simulations/post';
import { getSettings } from '../Settings/settings';

interface SimulationRunnerProps {
    disabled: boolean;
    cards: Map<string, CardDetails>;
    conditions: string[];
}

export default function SimulationRunner({ disabled, 
                                           cards, 
                                           conditions}: SimulationRunnerProps) {
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [reportData, setReportData] = useState<Report | null>(null);
    const [successRate, setSuccessRate] = useState(0);

    const settings = getSettings();

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

            const sims = await simulateDraw(deck, conditions.map(parseCondition), settings.simulationHandSize, settings.simulationIterations);
            const report = generateReport(sims);

            recordSimulation({deck: cards, conditions: conditions}, report);

            setReportData(report);
            setSuccessRate(report.successfulSimulations / settings.simulationIterations);
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
                    <ResultDisplay successRate={successRate} report={reportData} />
                </Box>
            )}
        </Stack>
    );
}

