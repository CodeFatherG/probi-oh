import React, { useState } from 'react';
import { Button, Paper, Stack, Typography } from '@mui/material';
import ReportDisplay from '@features/report/components/ReportDisplay';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { SimulationOutput } from '@probi-oh/types';

interface ResultDisplayProps {
    successRate: number;
    report: SimulationOutput | null;
}

export default function ResultDisplay ({ successRate, report }: ResultDisplayProps) {
    const [isReportVisible, setIsReportVisible] = useState<boolean>(false);

    return (
        <Stack spacing={2} sx={{ width: '100%' }}>
            <Button onClick={() => setIsReportVisible(!isReportVisible)}>
                {(report && isReportVisible ? <ExpandLess /> : <ExpandMore />)}
                <Typography variant="subtitle1">
                    Probability of success: {(successRate * 100).toFixed(2)}%
                </Typography>
            </Button>
            {report && isReportVisible && (
                <Paper elevation={3} sx={{ p: 2 }}>
                    <ReportDisplay report={report} />
                </Paper>
            )}
        </Stack>
    );
}
