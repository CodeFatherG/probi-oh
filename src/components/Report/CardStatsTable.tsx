import React, { useState } from 'react';
import { Box, Collapse, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { CardStats, FreeCardStats, Report } from '../../core/sim/report';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

const getTotalDrawnCount = (stats: Record<string, CardStats>) => Object.values(stats).reduce((acc, stats) => acc + (stats.drawnCount || 0), 0);
const getTotalSeenCount = (stats: CardStats) => Object.entries(stats.seenCount).reduce((acc, [copies, count]) => acc + (Number(copies) * count), 0);
const getTotalHandsSeen = (stats: CardStats) => Object.values(stats.seenCount).reduce((acc, count) => acc + count, 0);
const getOverallSeenCount = (stats: Record<string, CardStats>) => Object.values(stats).reduce((acc, stats) => acc + getTotalSeenCount(stats), 0);

interface CardStatsTableProps {
    report: Report;
}

interface CardStatsRowProps {
    id: string;
}

export default function CardStatsTable({ report }: CardStatsTableProps) {
    const drawnSupported: boolean = getTotalDrawnCount(report.cardNameStats) > 0;
    const banishedSupported: boolean = report.banishedCardNameStats ? getOverallSeenCount(report.banishedCardNameStats) > 0 : false;
    const discardedSupported: boolean = report.discardedCardNameStats ? getOverallSeenCount(report.discardedCardNameStats) > 0 : false;
    const freeCardSupported: boolean = report.freeCardStats ? Object.keys(report.freeCardStats).length > 0 : false;

    const totalDrawnCount: number = drawnSupported ? getTotalDrawnCount(report.cardNameStats) : 0;
    const totalBanishedCount: number = banishedSupported ? getOverallSeenCount(report.banishedCardNameStats || {}) : 0;
    const totalDiscardedCount: number = discardedSupported ? getOverallSeenCount(report.discardedCardNameStats || {}) : 0;

    const cardSeenCounts = new Set<number>();
    for (const count of Object.values(report.cardNameStats).flatMap(stats => Object.keys(stats.seenCount))) {
        cardSeenCounts.add(Number(count));
    }

    const CardStatsRow = ({id}: CardStatsRowProps) => {
        const FreeCardSummary = ({cardStats, freeStats, open}: {cardStats: CardStats, freeStats: FreeCardStats, open: boolean}) => {
            const usedToWinCount = freeStats.overall.usedToWinCount || 0;
            const unusedCount = freeStats.overall.unusedCount || 0;
            const seenCount = getTotalHandsSeen(cardStats);
            const lostCount = seenCount - usedToWinCount - unusedCount;

            return (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 3 }}>
                        <Typography variant="h6" gutterBottom component="div">
                            Draw Statistics
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Helped win</TableCell>
                                    <TableCell>Couldn't win</TableCell>
                                    <TableCell>Unneeded</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell component="th" scope="row">
                                        {((usedToWinCount / seenCount) * 100).toFixed(1)}%
                                    </TableCell>
                                    <TableCell>{((lostCount / seenCount) * 100).toFixed(1)}%</TableCell>
                                    <TableCell>{((unusedCount / seenCount) * 100).toFixed(1)}%</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Box>
                </Collapse>
            );
        }

        const stats = report.cardNameStats[id];
        const banishedStats = report.banishedCardNameStats ? report.banishedCardNameStats[id] : undefined;
        const discardedStats = report.discardedCardNameStats ? report.discardedCardNameStats[id] : undefined;
        const freeStats = report.freeCardStats ? report.freeCardStats[id] : undefined;

        const iterations: number = report.iterations;
        
        const drawnCount: number = stats.drawnCount || 0;
        const banishedCount: number = banishedStats ? getTotalSeenCount(banishedStats) : 0;
        const discardedCount: number = discardedStats ? getTotalSeenCount(discardedStats) : 0;
    
        const collapsible = freeStats != undefined;
        const [openCollapsible, setOpenCollapsible] = useState(false);

        return (
            <>
                <TableRow
                    onClick={() => freeStats ? setOpenCollapsible(!openCollapsible) : undefined}
                >
                    {freeCardSupported && 
                        <TableCell
                            sx={{
                                width: 'fit-content',
                                padding: 0,
                                textAlign: 'center',
                            }}
                        >
                            {collapsible ? (openCollapsible ? <KeyboardArrowDown/> : <KeyboardArrowUp/>) : <></>}
                        </TableCell>
                    }
                    <TableCell>{id}</TableCell>
                    <TableCell>{((getTotalHandsSeen(stats) / iterations) * 100).toFixed(1)}%</TableCell>
                    <TableCell>{(getTotalSeenCount(stats) / getTotalHandsSeen(stats)).toFixed(1)}</TableCell>
                    {Array.from(cardSeenCounts).map(count => (
                        <TableCell key={count}>{(((stats.seenCount[count] || 0) / getTotalHandsSeen(stats)) * 100).toFixed(1)}%</TableCell>
                    ))}
                    {drawnSupported && <TableCell>{((drawnCount / totalDrawnCount) * 100).toFixed(1)}%</TableCell>}
                    {banishedSupported && <TableCell>{((banishedCount / totalBanishedCount) * 100).toFixed(1)}%</TableCell>}
                    {discardedSupported && <TableCell>{((discardedCount / totalDiscardedCount) * 100).toFixed(1)}%</TableCell>}
                </TableRow>
                {freeStats && (
                    <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7 + cardSeenCounts.size}>
                            <FreeCardSummary cardStats={stats} freeStats={freeStats} open={openCollapsible} />
                        </TableCell>
                    </TableRow>
                )}
            </>
        )
    };

    return (
        <TableContainer
            sx={{
                overflowX: 'scroll',
            }}
        >
            <Table>
                <TableHead>
                    <TableRow>
                        {freeCardSupported && (
                            <TableCell
                                sx={{
                                    width: 'fit-content',
                                    padding: 0,
                                    textAlign: 'center',
                                }}
                            >
                                {/* Empty to contain a collapsible icon */}
                            </TableCell>
                        )}
                        <TableCell>Card</TableCell>
                        <TableCell>Opened</TableCell>
                        <TableCell>Average Opened</TableCell>
                        {Array.from(cardSeenCounts).map(count => (
                            <TableCell key={count}>Opened {count}</TableCell>
                        ))}
                        {drawnSupported && <TableCell>Drawn</TableCell>}
                        {banishedSupported && <TableCell>Banished</TableCell>}
                        {discardedSupported && <TableCell>Discarded</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.entries(report.cardNameStats).map(([id, ]) => (
                        <CardStatsRow 
                            key={id}
                            id={id}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
