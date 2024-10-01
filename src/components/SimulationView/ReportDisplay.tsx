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
}

interface FreeCardReportProps {
    cardStats: Record<string, CardStats>;
    freeStats: Record<string, FreeCardStats>;
}

const getTotalSeenCount = (stats: CardStats) => Object.values(stats.seenCount).reduce((acc, copies, count) => acc + (copies * count), 0);
const getTotalHandsSeen = (stats: CardStats) => Object.values(stats.seenCount).reduce((acc, count) => acc + count, 0);
const getTotalDrawnCount = (report: Report) => Object.values(report.cardNameStats).reduce((acc, stats) => acc + stats.drawnCount, 0);

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
    
    function CardReport({title, stats}: CardReportProps) {
        const listItem = (name: string, stats: CardStats) => {
            return (
                <ListItemText>
                    {name} Seen in {((getTotalSeenCount(stats) / report.iterations) * 100).toFixed(1)}% of all hands. 
                    On average, there are {(getTotalSeenCount(stats) / getTotalHandsSeen(stats)).toFixed(1)} copies per hand.
                    {stats.drawnCount > 0 && (
                        <> You drew this card {((stats.drawnCount / getTotalDrawnCount(report)) * 100).toFixed(1)}% of the time.</>
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
            return (
                <ListItemText>
                    In {(freeStat.usedToWinCount / getTotalHandsSeen(cardStat) * 100).toFixed(1)}% of hands where you drew {name}, 
                    it let you play when you otherwise couldn't. In {(freeStat.unusedCount / getTotalHandsSeen(cardStat) * 100).toFixed(1)}% 
                    of hands where you drew {name}, you won without playing it.
                    {(100 - (freeStat.usedToWinCount + freeStat.unusedCount) / getTotalHandsSeen(cardStat) * 100).toFixed(1)}% of the time you played {name}, you lost.
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
            <CardReport title="Card Statistics:" stats={report.cardNameStats} />
            
            {recordLength(report.cardTagStats) > 0 && (
                <CardReport title="Tag Statistics:" stats={report.cardTagStats} />
            )}

            {recordLength(report.banishedCardNameStats) > 0 && (
                <CardReport title="Banished Card Statistics:" stats={report.banishedCardNameStats} />
            )}

            {recordLength(report.banishedCardTagStats) > 0 && (
                <CardReport title="Banished Tag Statistics:" stats={report.banishedCardTagStats} />
            )}

            {recordLength(report.discardedCardNameStats) > 0 && (
                <CardReport title="Discarded Card Statistics:" stats={report.discardedCardNameStats} />
            )}

            {recordLength(report.discardedCardTagStats) > 0 && (
                <CardReport title="Discarded Tag Statistics:" stats={report.discardedCardTagStats} />
            )}

            {recordLength(report.freeCardStats) > 0 && (
                <FreeCardReport cardStats={report.cardNameStats} freeStats={report.freeCardStats} />
            )}
            
            <ConditionDisplay conditionStatistics={report.conditionStats} />
        </>
    );
}
