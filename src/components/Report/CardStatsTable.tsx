import React, { useMemo, useState } from 'react';
import { Box, Checkbox, Collapse, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Toolbar, Typography } from '@mui/material';
import { CardStats, Report } from '../../core/sim/report';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { getSettings } from '../Settings/settings';

const getTotalDrawnCount = (stats: Record<string, CardStats>) => Object.values(stats).reduce((acc, stats) => acc + (stats.drawnCount || 0), 0);
const getTotalSeenCount = (stats: CardStats) => Object.entries(stats.seenCount).reduce((acc, [copies, count]) => acc + (Number(copies) * count), 0);
const getTotalHandsSeen = (stats: CardStats) => Object.values(stats.seenCount).reduce((acc, count) => acc + count, 0);
const getOverallSeenCount = (stats: Record<string, CardStats>) => Object.values(stats).reduce((acc, stats) => acc + getTotalSeenCount(stats), 0);

interface CardStatsTableProps {
    report: Report;
}

interface CardStatsRowProps {
    data: CardRowData;
}

type Order = 'asc' | 'desc';

interface SortableHeaderCell {
    id: string;
    label: string;
    numeric: boolean;
}

interface CardRowData {
    id: string;
    opened: number;
    averageOpened: number;
    openedCounts: [number, number][];
    drawn?: number;
    banished?: number;
    discarded?: number;
    free?: {
        usedToWin: number;
        unused: number;
        lost: number;
    }
}

function descendingComparator(a: CardRowData, b: CardRowData, orderBy: string): number {
    if (orderBy.startsWith('opened-')) {
        const count = parseInt(orderBy.split('-')[1]);
        const aValue = a.openedCounts.find(([c]) => c === count)?.[1] || 0;
        const bValue = b.openedCounts.find(([c]) => c === count)?.[1] || 0;
        return bValue - aValue;
    }

    if (orderBy === 'id') {
        return b.id.localeCompare(a.id);
    }

    const aValue = a[orderBy as keyof CardRowData];
    const bValue = b[orderBy as keyof CardRowData];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
        return bValue - aValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
        return bValue.localeCompare(aValue);
    }

    // Handle undefined or other types
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;

    // Fallback for any other case
    return 0;
}

function getComparator(order: Order, orderBy: string): (a: CardRowData, b: CardRowData) => number {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array: readonly CardRowData[], comparator: (a: CardRowData, b: CardRowData) => number): CardRowData[] {
    const stabilizedThis = array.map((el, index) => [el, index] as [CardRowData, number]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

export default function CardStatsTable({ report }: CardStatsTableProps) {
    const drawnSupported: boolean = getTotalDrawnCount(report.cardNameStats) > 0;
    const banishedSupported: boolean = report.banishedCardNameStats ? getOverallSeenCount(report.banishedCardNameStats) > 0 : false;
    const discardedSupported: boolean = report.discardedCardNameStats ? getOverallSeenCount(report.discardedCardNameStats) > 0 : false;
    const freeCardSupported: boolean = report.freeCardStats ? Object.keys(report.freeCardStats).length > 0 : false;

    const totalDrawnCount: number = drawnSupported ? getTotalDrawnCount(report.cardNameStats) : 0;
    const totalBanishedCount: number = banishedSupported ? getOverallSeenCount(report.banishedCardNameStats || {}) : 0;
    const totalDiscardedCount: number = discardedSupported ? getOverallSeenCount(report.discardedCardNameStats || {}) : 0;

    const cardSeenCounts = useMemo(() => {
        const counts = new Set<number>();
        for (const count of Object.values(report.cardNameStats).flatMap(stats => Object.keys(stats.seenCount))) {
            counts.add(Number(count));
        }
        return Array.from(counts).sort((a, b) => a - b);
    }, [report.cardNameStats]);

    const settings = getSettings();

    const headers: SortableHeaderCell[] = useMemo(() => [
        { id: 'id', label: 'Card Name', numeric: false },
        { id: 'opened', label: 'Opened', numeric: true },
        { id: 'averageOpened', label: 'Average Opened', numeric: true },
        ...Array.from(cardSeenCounts).map(count => ({ id: `opened-${count}`, label: `Opened ${count}`, numeric: true })),
        ...(drawnSupported ? [{ id: 'drawn', label: 'Drawn', numeric: true }] : []),
        ...(banishedSupported ? [{ id: 'banished', label: 'Banished', numeric: true }] : []),
        ...(discardedSupported ? [{ id: 'discarded', label: 'Discarded', numeric: true }] : []),
    ], [cardSeenCounts, drawnSupported, banishedSupported, discardedSupported]);

    const [order, setOrder] = useState<Order>('asc');
    const [orderBy, setOrderBy] = useState<string>('id');
    const [relative, setRelative] = useState<boolean>(false);

    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const getPreciseNumber = (value: number): string => {
        if (value === 0) return '0.0';

        const maxPrecision = settings.statisticMaxPrecision <= 1 ? 1 : settings.statisticMaxPrecision;
        
        let s: string = '0';
        for (let i = 1; i <= maxPrecision; i++) {
            // Find the minimum number of decimal places that is not zero
            s = value.toFixed(i);
            if (Number(s) !== 0) return s;
        }

        // If we didn't break early then we are still 0, return that.
        return '0.0';
    }

    const sortedRows: CardRowData[] = useMemo(() => {
        const rows = Object.entries(report.cardNameStats).map(([id, stats]) => {
            const banishedStats = report.banishedCardNameStats ? report.banishedCardNameStats[id] : undefined;
            const discardedStats = report.discardedCardNameStats ? report.discardedCardNameStats[id] : undefined;
            const freeStats = report.freeCardStats ? report.freeCardStats[id] : undefined;

            const iterations: number = report.iterations;
            
            const drawnCount: number = stats.drawnCount || 0;
            const banishedCount: number = banishedStats ? getTotalSeenCount(banishedStats) : 0;
            const discardedCount: number = discardedStats ? getTotalSeenCount(discardedStats) : 0;
            
            const getRelativeDivisor = (count: number) => relative ? count : iterations;

            const row: CardRowData = {
                id,
                opened: ((getTotalHandsSeen(stats) / iterations) * 100),
                averageOpened: (getTotalSeenCount(stats) / getRelativeDivisor(getTotalHandsSeen(stats))),
                openedCounts: Array.from(cardSeenCounts).map(count => 
                    [count, ((stats.seenCount[count] || 0) / getRelativeDivisor(getTotalHandsSeen(stats))) * 100]
                )
            };

            if (drawnSupported) {
                row.drawn = (drawnCount / totalDrawnCount) * 100;
            }
            if (banishedSupported) {
                row.banished = (banishedCount / totalBanishedCount) * 100;
            }
            if (discardedSupported) {
                row.discarded = (discardedCount / totalDiscardedCount) * 100;
            }

            if (freeStats) {
                const usedToWinCount = freeStats.overall.usedToWinCount || 0;
                const unusedCount = freeStats.overall.unusedCount || 0;
                const seenCount = getTotalHandsSeen(stats);
                const lostCount = seenCount - usedToWinCount - unusedCount;

                const divisor = relative ? seenCount : iterations;

                row.free = {
                    usedToWin: (usedToWinCount / divisor) * 100,
                    unused: (unusedCount / divisor) * 100,
                    lost: (lostCount / divisor) * 100,
                };
            }

            return row;
        });

        return stableSort(rows, getComparator(order, orderBy));
    }, [report, order, orderBy, relative]);


    const CardStatsRow = ({ data }: CardStatsRowProps) => {
        const FreeCardSummary = ({open}: {open: boolean}) => {
            if (!data.free) return <></>;

            return (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 3 }}>
                        <Typography variant="h6" gutterBottom component="div">
                            Draw Statistics
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell align='center'>Helped win</TableCell>
                                    <TableCell align='center'>Couldn't win</TableCell>
                                    <TableCell align='center'>Unneeded</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell align='center'>
                                        {data.free.usedToWin.toFixed(1)}%
                                    </TableCell>
                                    <TableCell align='center'>{getPreciseNumber(data.free.lost)}%</TableCell>
                                    <TableCell align='center'>{getPreciseNumber(data.free.unused)}%</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Box>
                </Collapse>
            );
        }

        const collapsible = data.free != undefined;
        const [openCollapsible, setOpenCollapsible] = useState(false);

        return (
            <>
                <TableRow
                    onClick={() => data.free ? setOpenCollapsible(!openCollapsible) : undefined}
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
                    <TableCell>{data.id}</TableCell>
                    <TableCell>{getPreciseNumber(data.opened)}%</TableCell>
                    <TableCell>{getPreciseNumber(data.averageOpened)}</TableCell>
                    {data.openedCounts.map(([count, value]) => (
                        <TableCell key={count}>{getPreciseNumber(value)}%</TableCell>
                    ))}
                    {data.drawn !== undefined && <TableCell>{getPreciseNumber(data.drawn)}%</TableCell>}
                    {data.banished !== undefined && <TableCell>{getPreciseNumber(data.banished)}%</TableCell>}
                    {data.discarded !== undefined && <TableCell>{getPreciseNumber(data.discarded)}%</TableCell>}
                </TableRow>
                {data.free && (
                    <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={(freeCardSupported ? 1 : 0) + headers.length}>
                            <FreeCardSummary open={openCollapsible} />
                        </TableCell>
                    </TableRow>
                )}
            </>
        )
    };

    return (
        <Box>
            <Toolbar>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={relative}
                            onChange={(e) => setRelative(e.target.checked)}
                        />
                    }
                    label='Relative Statistics'
                />
            </Toolbar>
            <TableContainer sx={{ overflowX: 'scroll' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {freeCardSupported && (
                                <TableCell sx={{ width: 'fit-content', padding: 0, textAlign: 'center' }} />
                            )}
                            {headers.map((header) => (
                                <TableCell
                                    key={header.id}
                                    sortDirection={orderBy === header.id ? order : false}
                                >
                                    <TableSortLabel
                                        active={orderBy === header.id}
                                        direction={orderBy === header.id ? order : 'asc'}
                                        onClick={() => handleRequestSort(header.id)}
                                    >
                                        {header.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedRows.map((row) => (
                            <CardStatsRow key={row.id} data={row} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
