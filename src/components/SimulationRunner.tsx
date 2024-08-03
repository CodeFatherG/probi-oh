import React from 'react';
import Button from '@mui/material/Button';

interface SimulationRunnerProps {
    onRun: () => void;
    disabled: boolean;
}

const SimulationRunner = ({ onRun, disabled }: SimulationRunnerProps) => {
    return (
        <Button onClick={onRun} disabled={disabled}>
            Run Simulation
        </Button>
    );
};

export default SimulationRunner;