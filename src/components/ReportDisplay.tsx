import React from 'react';
import { ConditionStatistics, Report } from '../utils/report';
import { Box, Collapse, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

interface ReportDisplayProps {
    report: Report;
}

interface ConditionReportProps {
    stats: ConditionStatistics;
}

function ConditionReport({ stats }: ConditionReportProps) {
    const [open, setOpen] = React.useState(false);

    const renderCondition = (condition: string, successRate: number, hasSubConditions: boolean) => (
        <ListItemButton onClick={() => hasSubConditions && setOpen(!open)}>
            <ListItemText 
                primary={condition} 
                secondary={`${(successRate * 100).toFixed(2)}%`} 
            />
            {hasSubConditions && (open ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
    );

    return (
        <Box>
            {renderCondition(
                stats.condition.toString(), 
                stats.successRate, 
                stats.subConditionStats.size > 0
            )}
            {stats.subConditionStats.size > 0 && (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" sx={{ pl: 4 }}>
                        {Array.from(stats.subConditionStats.entries()).map(([key, subStats], index) => (
                            <Box key={index}>
                                {renderCondition(
                                    key.toString(), 
                                    subStats.successRate, 
                                    false
                                )}
                            </Box>
                        ))}
                    </List>
                </Collapse>
            )}
        </Box>
    );
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
    return (
        <>
            <Typography variant="h4">Card Statistics:</Typography>
            <List>
                {Array.from(report.cardNameStats.entries()).map(([name, stats]) => (
                    <ListItemText key={name}>
                        {name}: Seen {((stats.cardSeenCount / report.simulations.length) * 100).toFixed(2)}% of the time
                        {stats.cardDrawnCount > 0 && (
                            <> and drawn {((stats.cardDrawnCount / stats.cardSeenCount) * 100).toFixed(2)}%</>
                        )}
                  </ListItemText>
                ))}
            </List>
            
            {report.freeCardStats.size > 0 && (
                <>
                    <Typography variant="h4">Free Card Statistics:</Typography>
                    <List>
                        {Array.from(report.freeCardStats.entries()).map(([name, stats]) => (
                            <ListItemText key={name}>
                                {name}: Seen {((stats.cardSeenCount / report.simulations.length) * 100).toFixed(2)}% of the time. 
                                Used {(stats.activationRate * 100).toFixed(2)}% of the time 
                                and wasted {(stats.unusedRate * 100).toFixed(2)}%
                            </ListItemText>
                        ))}
                    </List>
                </>
            )};
            
            <Typography variant="h4">Condition Statistics:</Typography>
            <List>
                {Array.from(report.conditionStats.entries()).map(([, stats], index) => (
                    <ConditionReport key={index} stats={stats} />
                ))}
            </List>
        </>
    );
}
