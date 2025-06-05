import React, { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import { CardDetails, Condition } from '@probi-oh/types';
import ResultDisplay from './ResultDisplay';
import { SimulationOutput } from '@probi-oh/types';
import { Box, LinearProgress, Stack } from '@mui/material';
import { recordSimulation } from '@database/simulations/POST-simulations';
import { getSettings } from '@services/settings';

interface SimulationRunnerProps {
    disabled: boolean;
    cards: Record<string, CardDetails>;
    conditions: Condition[];
}

export default function SimulationRunner({ disabled, 
                                           cards, 
                                           conditions}: SimulationRunnerProps) {
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [reportData, setReportData] = useState<SimulationOutput | null>(null);
    const [successRate, setSuccessRate] = useState(0);
    const settings = getSettings();

    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize worker once
        if (!workerRef.current) {
            console.log('Initializing worker');
            workerRef.current = new Worker(
                new URL('@services/workers/simulation.worker.ts', import.meta.url)
            );
        }

        const handleMessage = (event: MessageEvent) => {
            const post = event.data;

            console.log('worker message:', post);

            // we got a message so the worker is running
            setIsSimulationRunning(true);

            if (post.type === 'progress') {
                setProgress(post.progress);
            } else if (post.type === 'result') {
                setReportData(post.simulations);
            } else if (post.type === 'error') {
                console.error(post.message);
            }
        };

        const handleError = (error: ErrorEvent) => {
            console.error('Worker error:', error);
            setIsSimulationRunning(false);
            setProgress(0);
            setReportData(null);
        };

        const worker = workerRef.current;
        worker.onmessage = handleMessage;
        worker.onerror = handleError;

        return () => {
            console.log('Terminating worker');
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!reportData) return;

        // report data is set so we have completed the simulation
        setIsSimulationRunning(false);

        recordSimulation({deck: cards, conditions: conditions}, reportData);
        setSuccessRate(reportData.successfulSimulations / settings.simulationIterations);
    }, [reportData]);

    const runSimulation = () => {
        setProgress(0);
        setIsSimulationRunning(true);
        setReportData(null);

        try {
            console.log(`Cards: ${Array.from(Object.entries(cards), ([card, details]) => `${card}: ${details.qty || 1}`).join(', ')}`);

            const worker = workerRef.current;
            if (!worker) return;

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
