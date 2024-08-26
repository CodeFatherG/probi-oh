import React, { useState } from 'react';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { Report } from '../utils/report';
import ReportDisplay from './ReportDisplay';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

interface ResultDisplayProps {
    report: Report;
}

export default function ResultDisplay ({ report }: ResultDisplayProps) {
    const [isReportVisible, setIsReportVisible] = useState<boolean>(false);

    return (
        <Stack spacing={2} sx={{ width: '100%' }}>
            <Button onClick={() => setIsReportVisible(!isReportVisible)}>
                {(isReportVisible ? <ExpandLess /> : <ExpandMore />)}
                <Typography variant="subtitle1">
                    Probability of success: {(report.successRate * 100).toFixed(2)}%
                </Typography>
            </Button>
            {isReportVisible && (
                <Paper elevation={3} sx={{ p: 2 }}>
                    <ReportDisplay report={report} />
                </Paper>
            )}
        </Stack>
    );
}
