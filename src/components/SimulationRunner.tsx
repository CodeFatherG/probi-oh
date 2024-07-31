import React from 'react';

interface SimulationRunnerProps {
    onRun: () => void;
    disabled: boolean;
}

const SimulationRunner: React.FC<SimulationRunnerProps> = ({ onRun, disabled }) => {
    return (
        <button onClick={onRun} disabled={disabled}>
            Run Simulation
        </button>
    );
};

export default SimulationRunner;