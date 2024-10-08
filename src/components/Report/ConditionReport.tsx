import React from 'react';
import { Report, ConditionStats } from '@server/report';
import { Collapse, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

interface ConditionDisplayProps {
    report: Report;
}

interface ConditionReportProps {
    id: string;
    iterations: number;
    stats: ConditionStats;
}

const ConditionReport = ({ id, iterations, stats }: ConditionReportProps) => {
    const [open, setOpen] = React.useState(false);

    const subConditionLength = Object.keys(stats.subConditionStats || {}).length;
    const hasSubConditions = subConditionLength > 0;

    return (
        <>
            <ListItemButton onClick={() => hasSubConditions && setOpen(!open)}>
                <ListItemText 
                    primary={id} 
                    secondary={`${(((stats.successCount || 0) / iterations) * 100).toFixed(2)}%`} 
                />
                {hasSubConditions && (open ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
            {hasSubConditions && (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" sx={{ pl: 4 }}>
                        {stats.subConditionStats && Array.from(Object.entries(stats.subConditionStats)).map(([id, stats], index) => (
                            <ConditionReport key={index} id={id} iterations={iterations} stats={stats} />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
}

export default function ConditionDisplay({ report }: ConditionDisplayProps) {
    return (
        <>
            <Typography variant="h4">Condition Statistics:</Typography>
            <List>
                {Array.from(Object.entries(report.conditionStats)).map(([id, stats], index) => (
                    <ConditionReport key={index} id={id} iterations={report.iterations} stats={stats} />
                ))}
            </List>
        </>
    );
}