import React from 'react';
import { CardStatistics, ConditionStatistics, FreeCardStatistics, Report } from '../../core/sim/report';
import { Collapse, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { BaseCondition } from '../../core/sim/condition';

interface ReportDisplayProps {
    report: Report;
}

interface ConditionDisplayProps {
    conditionStatistics: Map<BaseCondition, ConditionStatistics>;
}

interface ConditionReportProps {
    stats: ConditionStatistics;
}

interface CardReportProps {
    title: string;
    stats: Map<string, CardStatistics>;
    simCount: number;
}

interface FreeCardReportProps {
    stats: Map<string, FreeCardStatistics>;
    simCount: number;
}

function ConditionReport({ stats }: ConditionReportProps) {
    const [open, setOpen] = React.useState(false);

    const hasSubConditions = stats.subConditionStats.size > 0;

    return (
        <>
            <ListItemButton onClick={() => hasSubConditions && setOpen(!open)}>
                <ListItemText 
                    primary={stats.condition.toString()} 
                    secondary={`${((stats.condition.successes / stats.totalEvaluations) * 100).toFixed(2)}%`} 
                />
                {hasSubConditions && (open ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
            {stats.subConditionStats.size > 0 && (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" sx={{ pl: 4 }}>
                        {Array.from(stats.subConditionStats.entries()).map(([, stats], index) => (
                            <ConditionReport key={index} stats={stats} />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
}

function ConditionDisplay({ conditionStatistics }: ConditionDisplayProps) {
    return (
        <>
            <Typography variant="h4">Condition Statistics:</Typography>
            <List>
                {Array.from(conditionStatistics.entries()).map(([, stats], index) => (
                    <ConditionReport key={index} stats={stats} />
                ))}
            </List>
        </>
    );
}

function CardReport({title, stats, simCount}: CardReportProps) {
    return (
        <>
            <Typography variant="h4">{title}</Typography>
            <List component="div" sx={{ pl: 4 }}>
                {Array.from(stats.entries()).map(([name, stats]) => (
                    <ListItemText key={name}>
                        {name}: Seen {((stats.cardSeenCount / simCount) * 100).toFixed(2)}% of the time
                        {stats.cardDrawnCount > 0 && (
                            <> and drawn {((stats.cardDrawnCount / stats.cardSeenCount) * 100).toFixed(2)}%</>
                        )}
                    </ListItemText>
                ))}
            </List>
        </>
    );
}

function FreeCardReport({ stats, simCount }: FreeCardReportProps) {
    return (
        <>
            <Typography variant="h4">Free Card Statistics:</Typography>
            <List component='div' sx={{ pl: 4 }}>
                {Array.from(stats.entries()).map(([name, stats]) => (
                    <ListItemText key={name}>
                        {name}: Seen {((stats.cardSeenCount / simCount) * 100).toFixed(2)}% of the time.
                        <> {(stats.usedToWinRate * 100).toFixed(2)}% of the time it helped you to win</>
                        <> and {(stats.unusedRate * 100).toFixed(2)}% of the time you won without using it.</>
                    </ListItemText>
                ))}
            </List>
        </>
    );
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
    return (
        <>
            <CardReport title="Card Statistics:" stats={report.cardNameStats} simCount={report.simulations.length} />
            
            {report.cardTagStats.size > 0 && (
                <CardReport title="Tag Statistics:" stats={report.cardTagStats} simCount={report.simulations.length} />
            )}

            {report.banishedCardNameStats.size > 0 && (
                <CardReport title="Banished Card Statistics:" stats={report.banishedCardNameStats} simCount={report.simulations.length} />
            )}

            {report.banishedCardTagStats.size > 0 && (
                <CardReport title="Banished Tag Statistics:" stats={report.banishedCardTagStats} simCount={report.simulations.length} />
            )}

            {report.discardedCardNameStats.size > 0 && (
                <CardReport title="Discarded Card Statistics:" stats={report.discardedCardNameStats} simCount={report.simulations.length} />
            )}

            {report.discardedCardTagStats.size > 0 && (
                <CardReport title="Discarded Tag Statistics:" stats={report.discardedCardTagStats} simCount={report.simulations.length} />
            )}

            {report.freeCardStats.size > 0 && (
                <FreeCardReport stats={report.freeCardStats} simCount={report.simulations.length} />
            )}
            
            <ConditionDisplay conditionStatistics={report.conditionStats} />
        </>
    );
}
