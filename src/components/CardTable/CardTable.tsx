import React, { useCallback, useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    TextField, IconButton, TablePagination, Toolbar, Typography,
    Autocomplete,Box,
} from '@mui/material';
import { fuzzySearchCard } from '../../utils/card-api';
import { CardDetails } from '../../utils/card-details';
import { Delete } from '@mui/icons-material';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import useLocalStorage from '../../hooks/useLocalStorage';
import CardRow from './CardRow';
import DeleteDialog from './DeleteDialog';



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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteDialogPrompt, setDeleteDialogPrompt] = useState('');

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
        updateTagOptions(cards);
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

    const handleDelete = () => {
        if (selected.length > 0) {
            onDeleteCards(selected);
            setSelected([]);
        } else {
            setDeleteDialogPrompt('Are you sure you want to delete all cards?');
            setDeleteDialogOpen(true);
        }
    };

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
                <IconButton onClick={handleDelete} disabled={cards.size === 0}>
                    <Delete />
                </IconButton>
            </Toolbar>
            <TableContainer>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="none" width="48px"></TableCell>
                                <TableCell width="40%" sx={{textAlign:'center', margin:'auto'}}>Name</TableCell>
                                <TableCell width="15%" sx={{textAlign:'center', margin:'auto'}}>Qty</TableCell>
                                <TableCell width="40%" sx={{textAlign:'center', margin:'auto'}}>Tags</TableCell>
                            </TableRow>
                        </TableHead>
                        <Droppable droppableId="card-list">
                            {(provided) => (
                                <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                                    {Array.from(cards.entries())
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map(([name, details], index) => {
                                        return (
                                            <Draggable key={name} draggableId={name} index={index}>
                                                {(provided, ) => (
                                                    <CardRow
                                                        cardName={name}
                                                        cardDetails={details}
                                                        tagOptions={tagOptions}
                                                        draggableProvided={provided}
                                                        onDetailsChange={handleDetailsChange}
                                                        hover
                                                        tabIndex={-1}
                                                        selected={isSelected(name)}
                                                        onClick={() => selectCard(name)}
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
                count={cards.size}
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
                        onDeleteCards(Array.from(cards.keys()));
                        setDeleteDialogOpen(false);
                    }
                }}
            />
        </Paper>
    );
}
