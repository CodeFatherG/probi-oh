import React from 'react';
import { CardStats, ConditionStats, FreeCardStats, Report } from '../../core/sim/report';
import { Collapse, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import CardStatsTable from './CardStatsTable';

interface ReportDisplayProps {
    report: Report;
}

interface ConditionDisplayProps {
    conditionStatistics: Record<string, ConditionStats>;
}

interface ConditionReportProps {
    id: string;
    stats: ConditionStats;
}

interface CardReportProps {
    title: string;
    stats: Record<string, CardStats>;
}

interface PileReportProps {
    title: string;
    type: 'banish' | 'grave';
    stats: Record<string, CardStats>;
}

interface FreeCardReportProps {
    freeStats: Record<string, FreeCardStats>;
}

const getTotalSeenCount = (stats: CardStats) => Object.values(stats.seenCount).reduce((acc, copies, count) => acc + (copies * count), 0);
const getTotalHandsSeen = (stats: CardStats) => Object.values(stats.seenCount).reduce((acc, count) => acc + count, 0);
const getTotalDrawnCount = (report: Report) => Object.values(report.cardNameStats).reduce((acc, stats) => acc + (stats.drawnCount || 0), 0);
const getOverallSeenCount = (stats: Record<string, CardStats>) => Object.values(stats).reduce((acc, stats) => acc + getTotalSeenCount(stats), 0);

export default function ReportDisplay({ report }: ReportDisplayProps) {

    const recordLength = (record: Record<never, never>) => Object.keys(record).length;

    function ConditionReport({ id, stats }: ConditionReportProps) {
        const [open, setOpen] = React.useState(false);
    
        const subConditionLength = Object.keys(stats.subConditionStats || {}).length;
        const hasSubConditions = subConditionLength > 0;
    
        return (
            <>
                <ListItemButton onClick={() => hasSubConditions && setOpen(!open)}>
                    <ListItemText 
                        primary={id} 
                        secondary={`${((stats.successCount || 0 / report.iterations) * 100).toFixed(2)}%`} 
                    />
                    {hasSubConditions && (open ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
                {hasSubConditions && (
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <List component="div" sx={{ pl: 4 }}>
                            {stats.subConditionStats && Array.from(Object.entries(stats.subConditionStats)).map(([id, stats], index) => (
                                <ConditionReport key={index} id={id} stats={stats} />
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
                    {Array.from(Object.entries(conditionStatistics)).map(([id, stats], index) => (
                        <ConditionReport key={index} id={id} stats={stats} />
                    ))}
                </List>
            </>
        );
    }
    
    function CardReport({title, stats}: CardReportProps) {
        const listItem = (name: string, stats: CardStats) => {
            return (
                <ListItemText>
                    {name} Seen in {((getTotalHandsSeen(stats) / report.iterations) * 100).toFixed(1)}% of all hands. 
                    On average, there are {(getTotalSeenCount(stats) / getTotalHandsSeen(stats)).toFixed(1)} copies per hand.
                    {(stats.drawnCount || 0) > 0 && (
                        <> You drew this card {(((stats.drawnCount || 0) / getTotalDrawnCount(report)) * 100).toFixed(1)}% of the time.</>
                    )}
                </ListItemText>
            );
        }
    
        return (
            <>
                <Typography variant="h4">{title}</Typography>
                <List component="div" sx={{ pl: 4 }}>
                    {Array.from(Object.entries(stats)).map(([name, stats]) => listItem(name, stats))}
                </List>
            </>
        );
    }

    function PileReport({title, type, stats}: PileReportProps) {
        const listItem = (name: string, cardStats: CardStats) => {
            return (
                <ListItemText>
                    {name} was {type === 'banish' ? 'banished' : 'discarded'} {((getTotalSeenCount(cardStats) / getOverallSeenCount(stats)) * 100).toFixed(1)}% of all banished cards.
                </ListItemText>
            );
        }
    
        return (
            <>
                <Typography variant="h4">{title}</Typography>
                <List component="div" sx={{ pl: 4 }}>
                    {Array.from(Object.entries(stats)).map(([name, stats]) => listItem(name, stats))}
                </List>
            </>
        );
    }
    
    function FreeCardReport({ freeStats }: FreeCardReportProps) {
        const listItem = (name: string, freeStat: FreeCardStats) => {
            const used = freeStat.overall.usedToWinCount || 0;
            const unused = freeStat.overall.unusedCount || 0;

            return (
                <ListItemText>
                    In {((used / report.iterations) * 100).toFixed(1)}% of hands where you drew {name},
                     it let you play when you otherwise couldn't. In {((unused / report.iterations) * 100).toFixed(1)}%
                     of hands where you drew {name}, you won without playing it. {((1 - ((used + unused) 
                    / report.iterations)) * 100).toFixed(1)}% of the time you played {name}, you lost.
                </ListItemText>
            );
        }
    
        return (
            <>
                <Typography variant="h4">Free Card Statistics:</Typography>
                <List component='div' sx={{ pl: 4 }}>
                    {Object.entries(freeStats).map(([name, stats]) => {
                        return listItem(name, stats)
                    })}
                </List>
            </>
        );
    }

    return (
        <>
            <CardStatsTable report={report} />
        </>
    );
}
