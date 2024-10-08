import React from 'react';
import { Report } from '@server/report';
import CardStatsTable from './CardStatsTable';
import ConditionDisplay from './ConditionReport';

interface ReportDisplayProps {
    report: Report;
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
    return (
        <>
            <CardStatsTable report={report} />
            <ConditionDisplay report={report} />
        </>
    );
}
