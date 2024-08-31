import React, { useCallback, useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Checkbox, TextField, IconButton, TablePagination, Toolbar, Typography,
    Autocomplete,
    Box
} from '@mui/material';
import TagBox from './TagBox';
import { fuzzySearchCard } from './../utils/card-api';
import { CardDetails } from './../utils/card-details';
import { Delete, DragIndicator } from '@mui/icons-material';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import useLocalStorage from './LocalStorage';

interface CardTableProps {
    cards: Map<string, CardDetails>;
    onUpdateCard: (name: string, details: CardDetails) => void;
    onCreateCard: (name: string) => void;
    onDeleteCards: (names: string[]) => void;
    onReorderCards: (reorderedCards: Map<string, CardDetails>) => void;
}

export default function CardTable({
    cards,
    onUpdateCard,
    onCreateCard,
    onDeleteCards,
    onReorderCards
}: CardTableProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage, ] = useLocalStorage<number>('rowsPerPage', 5);
    const [selected, setSelected] = useState<string[]>([]);
    const [newCardName, setNewCardName] = useState<string>('');
    const [selectedCardName, setSelectedCardName] = useState<string>('');
    const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>([]);
    const [tagOptions, setTagOptions] = useState<string[]>([...new Set(Array.from(cards.values()).flatMap(card => card.tags || []))]);

    const calculateCardSummary = useCallback(() => {
        let totalCount = 0;
        let monsterCount = 0;
        let spellCount = 0;
        let trapCount = 0;

        const monsterRegex = /monster/i;
        const spellRegex = /spell/i;
        const trapRegex = /trap/i;

        cards.forEach((card) => {
            totalCount += card.qty || 0;
            if (card.tags) {
                if (card.tags.some(tag => monsterRegex.test(tag))) monsterCount += card.qty || 0;
                if (card.tags.some(tag => spellRegex.test(tag))) spellCount += card.qty || 0;
                if (card.tags.some(tag => trapRegex.test(tag))) trapCount += card.qty || 0;
            }
        });

        return { totalCount, monsterCount, spellCount, trapCount };
    }, [cards]);

    const updateTagOptions = (updatedCards: Map<string, CardDetails>) => {
        const allTags = new Set<string>();
        updatedCards.forEach(card => {
            card.tags?.forEach(tag => allTags.add(tag));
        });
        setTagOptions(Array.from(allTags));
    };

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
        setSelected(Array.from(cards.keys()));
        } else {
        setSelected([]);
        }
    };

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

    const handleCheckboxClick = (event: React.MouseEvent<unknown>, name: string) => {
        event.stopPropagation();
        selectCard(name);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setPage(0);
    };

    const handleQuantityChange = (name: string, quantity: number) => {
        const cardDetails = cards.get(name);
        if (cardDetails) {
            onUpdateCard(name, { ...cardDetails, qty: quantity });
        }
    };

    const handleTagsChange = (name: string, tags: string[]) => {
        const cardDetails = cards.get(name);
        if (cardDetails) {
            const updatedCards = new Map(cards);
            updatedCards.set(name, { ...cardDetails, tags });
            onUpdateCard(name, { ...cardDetails, tags });
            updateTagOptions(updatedCards);
        }
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

    const handleCreateCard = (cardName: string) => {
        if (!cardName) {
            setNewCardName('');
            setSelectedCardName('');
            setAutocompleteOptions([]);
            return;
        }
        if (cards.has(cardName)) {
            // Highlight existing card
            const index = Array.from(cards.keys()).indexOf(cardName);
            setPage(Math.floor(index / rowsPerPage));
            // Select the card
            selectCard(cardName);
        } else {
            onCreateCard(cardName);
        }
        setNewCardName('');
        setSelectedCardName('');
        setAutocompleteOptions([]);
    };

    const handleDeleteSelected = () => {
        if (selected.length > 0) {
            onDeleteCards(selected);
            setSelected([]);
        }
    };

    // const handleMoveCard = (direction: 'up' | 'down') => {
    //     if (selected.length === 1) {
    //         onMoveCard(selected[0], direction);
    //     }
    // };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        const items = Array.from(cards);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const reorderedCards = new Map(items);
        onReorderCards(reorderedCards);
    };

    const isSelected = (name: string) => selected.indexOf(name) !== -1;

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
                <Box sx={{ display: 'flex', alignItems: 'baseline', flex: '1 1 100%' }}>
                    <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                        Deck
                    </Typography>
                    <Typography variant="subtitle1" component="div">
                        {calculateCardSummary().totalCount} Total
                    </Typography>
                    <Typography variant="subtitle2" component="div" sx={{paddingLeft: 2}}>
                        M: {calculateCardSummary().monsterCount} • S: {calculateCardSummary().spellCount} • T: {calculateCardSummary().trapCount}
                    </Typography>
                </Box>
                {selected.length > 0 && (
                    <IconButton onClick={handleDeleteSelected} disabled={selected.length === 0}>
                        <Delete />
                    </IconButton>
                )}
            </Toolbar>
            <TableContainer>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="none" width="48px"></TableCell>
                                <TableCell padding="checkbox" width="48px">
                                    <Checkbox
                                        indeterminate={selected.length > 0 && selected.length < cards.size}
                                        checked={cards.size > 0 && selected.length === cards.size}
                                        onChange={handleSelectAllClick}
                                    />
                                </TableCell>
                                <TableCell width="40%">Name</TableCell>
                                <TableCell width="15%">Qty</TableCell>
                                <TableCell width="40%">Tags</TableCell>
                            </TableRow>
                        </TableHead>
                        <Droppable droppableId="card-list">
                            {(provided) => (
                                <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                                    {Array.from(cards.entries())
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map(([name, details], index) => {
                                        const isItemSelected = isSelected(name);
                                        return (
                                            <Draggable key={name} draggableId={name} index={index}>
                                                {(provided, snapshot) => (
                                                    <TableRow
                                                        hover
                                                        role="checkbox"
                                                        aria-checked={isItemSelected}
                                                        tabIndex={-1}
                                                        selected={isItemSelected}
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        sx={{
                                                            ...provided.draggableProps.style,
                                                            background: snapshot.isDragging ? 'lightblue' : 'inherit',
                                                        }}
                                                    >
                                                        <TableCell padding="none" width="48px">
                                                            <IconButton {...provided.dragHandleProps} size="small">
                                                                <DragIndicator />
                                                            </IconButton>
                                                        </TableCell>
                                                        <TableCell padding="checkbox" width="48px">
                                                            <Checkbox
                                                                checked={isItemSelected}
                                                                onClick={(event) => handleCheckboxClick(event, name)}
                                                            />
                                                        </TableCell>
                                                        <TableCell width="40%">{name}</TableCell>
                                                        <TableCell width="15%">
                                                            <TextField
                                                                type="number"
                                                                value={details.qty || 0}
                                                                onChange={(e) => handleQuantityChange(name, parseInt(e.target.value, 10))}
                                                                inputProps={{ min: 0, style: { width: '50px' } }}
                                                            />
                                                        </TableCell>
                                                        <TableCell width="40%">
                                                            <TagBox
                                                                tags={details.tags || []}
                                                                onTagsChange={(tags) => {
                                                                    handleTagsChange(name, tags)
                                                                }}
                                                                tagOptions={tagOptions}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
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
                count={cards.size}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}
