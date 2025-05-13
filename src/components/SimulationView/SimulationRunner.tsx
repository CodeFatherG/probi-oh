import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { CardDetails } from '@probi-oh/types';
import ResultDisplay from './ResultDisplay';
import { SimulationOutput } from '@probi-oh/types';
import { Box, LinearProgress, Stack } from '@mui/material';
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
    const [reportData, setReportData] = useState<SimulationOutput | null>(null);
    const [successRate, setSuccessRate] = useState(0);
    const [worker, ] = useState(new Worker(new URL('@/workers/simulation.worker.ts', import.meta.url)));
    const settings = getSettings();

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const post = JSON.parse(event.data);

            console.log('worker message:', post);

            // we got a message so the worker is running
            setIsSimulationRunning(true);

            if (post.progress) {
                setProgress(post.progress);
            } else if (post.simulations) {
                setReportData(post.simulations);
            }
        };

        worker.onmessage = handleMessage;

        // Cleanup function to reset the listener
        return () => {
            worker.onmessage = null;
        };
    }, []);

    useEffect(() => {
        // report data is set so we have completed the simulation
        setIsSimulationRunning(false);

        if (!reportData) return;

        recordSimulation({deck: cards, conditions: conditions}, reportData);
        setSuccessRate(reportData.successfulSimulations / settings.simulationIterations);
    }, [reportData]);

    const runSimulation = () => {
        setProgress(0);
        setIsSimulationRunning(true);
        setReportData(null);

        try {
            console.log(`Cards: ${Array.from(cards, ([card, details]) => `${card}: ${details.qty || 1}`).join(', ')}`);

            worker.postMessage({
                input: {
                    deck: cards,
                    conditions: conditions,
                },
                handSize: settings.simulationHandSize,
                iterations: settings.simulationIterations,
            });
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

