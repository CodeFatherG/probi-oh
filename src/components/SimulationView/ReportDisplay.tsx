import React from 'react';
import { CardStats, ConditionStats, FreeCardStats, Report } from '../../core/sim/report';
import { Collapse, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

interface ReportDisplayProps {
    report: Report;
}

interface ConditionDisplayProps {
    conditionStatistics: Record<string, ConditionStats>;
}

interface ConditionReportProps {
    stats: ConditionStats;
}

interface CardReportProps {
    title: string;
    stats: Record<string, CardStats>;
    simCount: number;
}

interface FreeCardReportProps {
    cardStats: Record<string, CardStats>;
    freeStats: Record<string, FreeCardStats>;
}

export default function ReportDisplay({ report }: ReportDisplayProps) {

    const recordLength = (record: Record<never, never>) => Object.keys(record).length;

    function ConditionReport({ stats }: ConditionReportProps) {
        const [open, setOpen] = React.useState(false);
    
        const subConditionLength = Object.keys(stats.subConditionStats).length;
        const hasSubConditions = subConditionLength > 0;
    
        return (
            <>
                <ListItemButton onClick={() => hasSubConditions && setOpen(!open)}>
                    <ListItemText 
                        primary={stats.conditionId} 
                        secondary={`${((stats.successCount / report.iterations) * 100).toFixed(2)}%`} 
                    />
                    {hasSubConditions && (open ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
                {hasSubConditions && (
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <List component="div" sx={{ pl: 4 }}>
                            {Array.from(Object.entries(stats.subConditionStats)).map(([, stats], index) => (
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
                    {Array.from(Object.entries(conditionStatistics)).map(([, stats], index) => (
                        <ConditionReport key={index} stats={stats} />
                    ))}
                </List>
            </>
        );
    }
    
    function CardReport({title, stats, simCount}: CardReportProps) {
        const listItem = (name: string, stats: CardStats) => {
            const totalCount = Object.values(stats.seenCount).reduce((acc, count) => acc + count, 0);
    
            return (
                <ListItemText>
                    {name}: Seen {((totalCount / simCount) * 100).toFixed(2)}% of the time
                    {stats.drawnCount > 0 && (
                        <> and drawn {((stats.drawnCount / totalCount) * 100).toFixed(2)}%</>
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
    
    function FreeCardReport({ cardStats, freeStats }: FreeCardReportProps) {
        const listItem = (name: string, cardStat: CardStats, freeStat: FreeCardStats) => {
            const totalSeenCount = Object.values(cardStat.seenCount).reduce((acc, count) => acc + count, 0);

            return (
                <ListItemText>
                    {name}: Seen {((totalSeenCount / report.iterations) * 100).toFixed(2)}% of the time.
                    <> {((freeStat.usedToWinCount / totalSeenCount) * 100).toFixed(2)}% of the time it helped you to win</>
                    <> and {((freeStat.unusedCount / totalSeenCount) * 100).toFixed(2)}% of the time you won without using it.</>
                </ListItemText>
            );
        }
    
        return (
            <>
                <Typography variant="h4">Free Card Statistics:</Typography>
                <List component='div' sx={{ pl: 4 }}>
                    {Object.entries(freeStats).map(([name, stats]) => {
                        cardStats[name] = cardStats[name] || { seenCount: {}, drawnCount: 0 };
                        return listItem(name, cardStats[name], stats)
                    })}
                </List>
            </>
        );
    }

    return (
        <>
            <CardReport title="Card Statistics:" stats={report.cardNameStats} simCount={report.iterations} />
            
            {recordLength(report.cardTagStats) > 0 && (
                <CardReport title="Tag Statistics:" stats={report.cardTagStats} simCount={report.iterations} />
            )}

            {recordLength(report.banishedCardNameStats) > 0 && (
                <CardReport title="Banished Card Statistics:" stats={report.banishedCardNameStats} simCount={report.iterations} />
            )}

            {recordLength(report.banishedCardTagStats) > 0 && (
                <CardReport title="Banished Tag Statistics:" stats={report.banishedCardTagStats} simCount={report.iterations} />
            )}

            {recordLength(report.discardedCardNameStats) > 0 && (
                <CardReport title="Discarded Card Statistics:" stats={report.discardedCardNameStats} simCount={report.iterations} />
            )}

            {recordLength(report.discardedCardTagStats) > 0 && (
                <CardReport title="Discarded Tag Statistics:" stats={report.discardedCardTagStats} simCount={report.iterations} />
            )}

            {recordLength(report.freeCardStats) > 0 && (
                <FreeCardReport cardStats={report.cardNameStats} freeStats={report.freeCardStats} />
            )}
            
            <ConditionDisplay conditionStatistics={report.conditionStats} />
        </>
    );
}
