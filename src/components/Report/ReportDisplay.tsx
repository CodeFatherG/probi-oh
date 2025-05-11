import React from 'react';
import { SimulationOutput } from '@probi-oh/types';
import CardStatsTable from './CardStatsTable';
import ConditionDisplay from './ConditionReport';

interface ReportDisplayProps {
    report: SimulationOutput;
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
    return (
        <>
            <CardStatsTable report={report} />
            <ConditionDisplay report={report} />
        </>
    );
}
