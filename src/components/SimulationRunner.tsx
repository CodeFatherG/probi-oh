import React, { useState, useCallback, useEffect } from 'react';
import Button from '@mui/material/Button';
import { CardDetails } from '../utils/card-details';
import { Settings } from './SettingsDialog';
import { Simulation } from '../utils/simulation';
import ResultDisplay from './ResultDisplay';
import { Report } from '../utils/report';
import { Box, LinearProgress, Stack } from '@mui/material';

interface SimulationRunnerProps {
    disabled: boolean;
    cards: Map<string, CardDetails>;
    conditions: string[];
    settings: Settings;
}

const NUM_WORKERS = navigator.hardwareConcurrency || 4; // Use available cores or default to 4

export default function SimulationRunner({
    disabled,
    cards,
    conditions,
    settings
}: SimulationRunnerProps) {
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [reportData, setReportData] = useState<Report | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);

    useEffect(() => {
        setWorkers(Array.from({ length: NUM_WORKERS }).map(() => new Worker(new URL('../workers/simulation.worker.ts', import.meta.url))));
        console.log(`Running simulations with ${NUM_WORKERS} workers`);
    }, []);

    const runSimulation = useCallback(async () => {
        setProgress(0);
        setIsSimulationRunning(true);
        setReportData(null);

        try {
            const results: Simulation[][] = [];
            const batchesPerWorker = Math.ceil(settings.simulationIterations / (settings.batchSize * NUM_WORKERS));

            for (const worker of workers) {
                worker.onmessage = (event) => {
                    const sims = JSON.parse(event.data).map(Simulation.deserialise);
                    results.push(sims);
                    setProgress((prevProgress) => {
                        const newProgress = prevProgress + (100 / NUM_WORKERS / batchesPerWorker);
                        return Math.min(newProgress, 100);
                    });

                    if (results.length === NUM_WORKERS * batchesPerWorker) {
                        const allSimulations = results.flat();
                        const report = Report.generateReports(allSimulations);
                        setReportData(report);
                        setIsSimulationRunning(false);
                    }
                };

                for (let j = 0; j < batchesPerWorker; j++) {
                    worker.postMessage({
                        cards: Array.from(cards.entries()),
                        conditions: JSON.stringify(conditions),
                        handSize: settings.simulationHandSize,
                        batchSize: settings.batchSize,
                    });
                }
            }
        } catch (err) {
            console.error('Error running simulation:', err);
            setIsSimulationRunning(false);
        }
    }, [cards, conditions, settings]);

    return (
        <Stack spacing={2} sx={{ width: '100%' }}>
            <Button
                variant="contained"
                onClick={runSimulation}
                disabled={disabled || isSimulationRunning}
                fullWidth
            >
                Run Simulation
            </Button>
           
            {isSimulationRunning && (
                <LinearProgress variant="determinate" value={progress} />
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