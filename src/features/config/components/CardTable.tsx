import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    TextField, IconButton, TablePagination, Toolbar, Typography,
    Autocomplete,Box,
    Stack,
    InputAdornment,
    Tooltip,
} from '@mui/material';
import { fuzzySearchCard } from '@api/ygopro/card-api';
import { CardDetails } from '@probi-oh/types';
import { Clear, Delete, Search } from '@mui/icons-material';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import useLocalStorage from '@shared/hooks/useLocalStorage';
import CardRow from './CardRow';
import DeleteDialog from '@shared/components/DeleteDialog';
import { getAverageCardPrice, getCardPrice, getHighestCardPrice, getLowestCardPrice } from '@services/yugioh/prices';
import { getCurrencySymbol } from '@api/currency/currency';
import { getSettings } from '@services/settings';
import PriceSummary from './PriceSummary';



interface CardTableProps {
    cards: Record<string, CardDetails>;
    onUpdateCard: (name: string, details: CardDetails) => void;
    onCreateCard: (name: string) => void;
    onDeleteCards: (names: string[]) => void;
    onReorderCards: (reorderedCards: Record<string, CardDetails>) => void;
}

export default function CardTable({
    cards,
    onUpdateCard,
    onCreateCard,
    onDeleteCards,
    onReorderCards
}: CardTableProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage, ] = useLocalStorage<number>('rowsPerPage', 25);
    const [selected, setSelected] = useState<string[]>([]);
    const [newCardName, setNewCardName] = useState<string>('');
    const [selectedCardName, setSelectedCardName] = useState<string>('');
    const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>([]);
    const [tagOptions, setTagOptions] = useState<string[]>([...new Set(Array.from(Object.values(cards)).flatMap(card => card.tags || []))]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteDialogPrompt, setDeleteDialogPrompt] = useState('');
    const [nameSearch, setNameSearch] = useState('');
    const [tagSearch, setTagSearch] = useState('');

    const [minCost, setMinCost] = useState<number>(0);
    const [maxCost, setMaxCost] = useState<number>(0);
    const [averageCost, setAverageCost] = useState<number>(0);
    const [costBySource, setCostBySource] = useState<Record<string, number>>({});

    const calculateCardSummary = useCallback(() => {
        let totalCount = 0;
        let monsterCount = 0;
        let spellCount = 0;
        let trapCount = 0;

        const monsterRegex = /monster/i;
        const spellRegex = /spell/i;
        const trapRegex = /trap/i;

        Object.values(cards).forEach((card) => {
            totalCount += card.qty || 0;
            if (card.tags) {
                if (card.tags.some(tag => monsterRegex.test(tag))) monsterCount += card.qty || 0;
                if (card.tags.some(tag => spellRegex.test(tag))) spellCount += card.qty || 0;
                if (card.tags.some(tag => trapRegex.test(tag))) trapCount += card.qty || 0;
            }
        });

        return { totalCount, monsterCount, spellCount, trapCount };
    }, [cards]);

    useEffect(() => {
        const calculateCosts = async () => {
            let minCost = 0;
            let maxCost = 0;
            let averageCost = 0;
            const sourceCost: Record<string, number> = {};

            for (const [name, details] of Object.entries(cards)) {
                minCost += await getLowestCardPrice(name) * (details.qty || 0);
                maxCost += await getHighestCardPrice(name) * (details.qty || 0);
                averageCost += await getAverageCardPrice(name) * (details.qty || 0);
                const prices = await getCardPrice(name);
                for (const [source, price] of Object.entries(prices)) {
                    sourceCost[source] = (sourceCost[source] || 0) + (price * (details.qty || 0));
                }
            }

            setMinCost(minCost);
            setMaxCost(maxCost);
            setAverageCost(averageCost);
            setCostBySource(sourceCost);
        };

        calculateCosts();
    }, [cards]);


    useEffect(() => {
        const allTags = new Set<string>();
        Object.values(cards).forEach(card => {
            card.tags?.forEach(tag => allTags.add(tag));
        });
        setTagOptions(Array.from(allTags));
    }, [cards]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const selectCard = (name: string) => {
        const selectedIndex = selected.indexOf(name);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
    }

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setPage(0);
    };

    const handleNewCardNameChange = async (event: React.ChangeEvent<object>, value: string, reason: string) => {
        if (reason === 'input') {
            setNewCardName(value);
            if (value.length > 2) {
                const results = await fuzzySearchCard(value);
                setAutocompleteOptions(results.map(card => card.name));
            } else {
                setAutocompleteOptions([]);
            }
        } else if (reason === 'clear') {
            setNewCardName('');
            setSelectedCardName('');
            setAutocompleteOptions([]);
        }
    };

    const handleDetailsChange = (name: string, details: CardDetails) => {
        onUpdateCard(name, details);
    };

    const handleCreateCard = (cardName: string) => {
        if (!cardName) {
            setNewCardName('');
            setSelectedCardName('');
            setAutocompleteOptions([]);
            return;
        }
        if (cards[cardName]) {
            // Highlight existing card
            const index = Array.from(Object.keys(cards)).indexOf(cardName);
            setPage(Math.floor(index / rowsPerPage));
        } else {
            onCreateCard(cardName);
        }
        setNewCardName('');
        setSelectedCardName('');
        setAutocompleteOptions([]);
    };

    const handleDelete = () => {
        setDeleteDialogPrompt('Are you sure you want to delete all cards?');
        setDeleteDialogOpen(true);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        console.log('handleDragEnd', result);

        const items = Array.from(Object.entries(cards));
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        onReorderCards(Object.fromEntries(items));
    };

    const filteredAndSortedCards = useMemo(() => {
        console.log('filteredAndSortedCards', nameSearch, tagSearch);

        if (nameSearch === '' && tagSearch === '') {
            return Array.from(Object.entries(cards));
        }

        return Array.from(Object.entries(cards))
            .filter(([name, details]) => {
                const nameMatch = name.toLowerCase().includes(nameSearch.toLowerCase());
                const tagMatch = details.tags?.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()));
                return nameMatch && (tagSearch === '' || tagMatch);
            })
            .sort(([nameA], [nameB]) => {
                const nameAStartsWith = nameA.toLowerCase().startsWith(nameSearch.toLowerCase());
                const nameBStartsWith = nameB.toLowerCase().startsWith(nameSearch.toLowerCase());
                if (nameAStartsWith && !nameBStartsWith) return -1;
                if (!nameAStartsWith && nameBStartsWith) return 1;
                return nameA.localeCompare(nameB);
            });
    }, [cards, nameSearch, tagSearch]);

    const isSelected = (name: string) => selected.indexOf(name) !== -1;

    const searchActive = nameSearch !== '' || tagSearch !== '';

    return (
        <Paper sx={{ position: 'relative' }}>
            <Toolbar
                sx = {{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    backgroundColor: 'background.paper',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: 1,
                    borderBottom: 1,
                    borderColor: 'divider'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: '1 1 100%' }}>
                    <Typography variant="h6" sx={{ mr: 2 }}>
                        Deck
                    </Typography>
                    <Typography variant="subtitle1">
                        {calculateCardSummary().totalCount} Total
                    </Typography>
                    <Stack sx={{paddingLeft: 2}}>
                        <Typography variant="subtitle2">
                            M: {calculateCardSummary().monsterCount} • S: {calculateCardSummary().spellCount} • T: {calculateCardSummary().trapCount}
                        </Typography>
                        <Tooltip 
                            title={
                                <PriceSummary prices={costBySource}/>
                            }
                        >
                            <Box display='flex'>
                                <Typography m='2px' color='#73a657' variant='caption'>{`${getCurrencySymbol(getSettings().selectedCurrency)}${minCost.toFixed(2)}`}</Typography>
                                <Typography m='2px' color='#b3ebf2' variant='caption'>{`${getCurrencySymbol(getSettings().selectedCurrency)}${averageCost.toFixed(2)}`}</Typography>
                                <Typography m='2px' color='#ff6961' variant='caption'>{`${getCurrencySymbol(getSettings().selectedCurrency)}${maxCost.toFixed(2)}`}</Typography>
                            </Box>
                        </Tooltip>
                    </Stack>
                </Box>
                <IconButton onClick={handleDelete} disabled={Object.keys(cards).length === 0}>
                    <Delete />
                </IconButton>
            </Toolbar>
            <TableContainer>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="none"></TableCell>
                                <TableCell sx={{textAlign:'center', margin:'auto'}}>
                                    <Stack alignItems='center'>
                                        <Typography>Name</Typography>
                                        <TextField
                                            size="small"
                                            placeholder="Search name..."
                                            value={nameSearch}
                                            onChange={(e) => {
                                                setTagSearch('');
                                                setNameSearch(e.target.value);
                                            }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Search />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: nameSearch && (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="clear name search"
                                                            onClick={() => setNameSearch('')}
                                                            edge="end"
                                                        >
                                                            <Clear />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ 
                                                ml: 1,
                                                maxWidth: '300px'
                                            }}
                                        />
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{textAlign:'center', margin:'auto'}}>Qty</TableCell>
                                <TableCell sx={{textAlign:'center', margin:'auto'}}>
                                    <Stack alignItems='center'>
                                        <Typography>Tags</Typography>
                                        <TextField
                                            size="small"
                                            placeholder="Search tags..."
                                            value={tagSearch}
                                            onChange={(e) => {
                                                setNameSearch('');
                                                setTagSearch(e.target.value);
                                            }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Search />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: tagSearch && (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="clear tag search"
                                                            onClick={() => setTagSearch('')}
                                                            edge="end"
                                                        >
                                                            <Clear />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ 
                                                ml: 1,
                                                maxWidth: '300px'
                                            }}
                                        />
                                    </Stack>
                                </TableCell>
                                <TableCell padding="none"></TableCell>
                            </TableRow>
                        </TableHead>
                        <Droppable droppableId="card-list">
                            {(provided) => (
                                <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                                    {filteredAndSortedCards
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map(([name, details], index) => {
                                            return (
                                                <Draggable key={name} draggableId={name} index={index}>
                                                    {(provided) => (
                                                        <CardRow
                                                            cardName={name}
                                                            cardDetails={details}
                                                            tagOptions={tagOptions}
                                                            draggableProvided={(searchActive) ? null : provided}
                                                            onDetailsChange={handleDetailsChange}
                                                            hover
                                                            tabIndex={-1}
                                                            selected={isSelected(name)}
                                                            onDelete={() => onDeleteCards([name])}
                                                            onClick={() => {/* Do nothing */}}
                                                        />
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                    {provided.placeholder}
                                </TableBody>
                            )}
                        </Droppable>
                    </Table>
                </DragDropContext>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={4} sx={{ borderBottom: 'none' }}>
                                <Autocomplete
                                    fullWidth
                                    freeSolo
                                    options={autocompleteOptions}
                                    inputValue={newCardName}
                                    value={selectedCardName}
                                    onInputChange={handleNewCardNameChange}
                                    onChange={(event, value) => {
                                        if (value) {
                                            handleCreateCard(value);
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleCreateCard(newCardName);
                                                }
                                            }}
                                            placeholder="Add new card..."
                                            fullWidth
                                        />
                                    )}
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredAndSortedCards.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
            <DeleteDialog
                prompt={deleteDialogPrompt}
                open={deleteDialogOpen}
                onClose={(result) => {
                    if (result) {
                        // delete all
                        onDeleteCards(Array.from(Object.keys(cards)));
                        setDeleteDialogOpen(false);
                    } else {
                        setDeleteDialogOpen(false);
                    }
                }}
            />
        </Paper>
    );
}
