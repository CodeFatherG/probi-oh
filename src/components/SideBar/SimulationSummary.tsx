import React from "react";
import { SimulationRecord } from './../../core/data/simulation-record';

interface SimulationSummaryProps {
    record: SimulationRecord;
}

export default function SimulationSummary({ record }: SimulationSummaryProps): JSX.Element {
    return (
        <div>
            <h3>Simulation ID: {record.id}</h3>
            <p>Result: {record.result}</p>
        </div>
    );
}