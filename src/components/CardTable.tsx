import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Checkbox, TextField, IconButton, TablePagination, Toolbar, Typography,
    Autocomplete
} from '@mui/material';
import TagBox from './TagBox';
import { fuzzySearchCard } from './../utils/card-api';
import { CardDetails } from './../utils/card-details';
import { ArrowDownward, ArrowUpward, Delete } from '@mui/icons-material';

interface CardTableProps {
    cards: Map<string, CardDetails>;
    onUpdateCard: (name: string, details: CardDetails) => void;
    onCreateCard: (name: string) => void;
    onDeleteCards: (names: string[]) => void;
    onMoveCard: (name: string, direction: 'up' | 'down') => void;
}

export default function CardTable({
    cards,
    onUpdateCard,
    onCreateCard,
    onDeleteCards,
    onMoveCard
}: CardTableProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selected, setSelected] = useState<string[]>([]);
    const [newCardName, setNewCardName] = useState('');
    const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>([]);

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
        setSelected(Array.from(cards.keys()));
        } else {
        setSelected([]);
        }
    };

    const handleCheckboxClick = (event: React.MouseEvent<unknown>, name: string) => {
        event.stopPropagation();
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
            onUpdateCard(name, { ...cardDetails, tags });
        }
    };

    const handleNewCardNameChange = async (event: React.ChangeEvent<object>, value: string) => {
        setNewCardName(value);
        if (value.length > 2) {
            const results = await fuzzySearchCard(value);
            setAutocompleteOptions(results.map(card => card.name));
        } else {
            setAutocompleteOptions([]);
        }
    };

    const handleCreateCard = () => {
        if (!newCardName) {
            return;
        }
        if (cards.has(newCardName)) {
            // Highlight existing card
            const index = Array.from(cards.keys()).indexOf(newCardName);
            setPage(Math.floor(index / rowsPerPage));
            // You might want to add some visual feedback here
        } else {
            onCreateCard(newCardName);
        }
        setNewCardName('');
    };

    const handleDeleteSelected = () => {
        if (selected.length > 0) {
            onDeleteCards(selected);
            setSelected([]);
        }
    };

    const handleMoveCard = (direction: 'up' | 'down') => {
        if (selected.length === 1) {
            onMoveCard(selected[0], direction);
        }
    };

    const isSelected = (name: string) => selected.indexOf(name) !== -1;

    return (
        <Paper>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
                    Deck
                </Typography>
                {selected.length > 0 && (
                <>
                    <IconButton onClick={() => handleMoveCard('up')} disabled={selected.length !== 1}>
                    <ArrowUpward />
                    </IconButton>
                    <IconButton onClick={() => handleMoveCard('down')} disabled={selected.length !== 1}>
                    <ArrowDownward />
                    </IconButton>
                    <IconButton onClick={handleDeleteSelected}>
                    <Delete />
                    </IconButton>
                </>
                )}
            </Toolbar>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={selected.length > 0 && selected.length < cards.size}
                                    checked={cards.size > 0 && selected.length === cards.size}
                                    onChange={handleSelectAllClick}
                                />
                            </TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell>Tags</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Array.from(cards.entries())
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map(([name, details]) => {
                            const isItemSelected = isSelected(name);
                            return (
                            <TableRow
                                hover
                                role="checkbox"
                                aria-checked={isItemSelected}
                                tabIndex={-1}
                                key={name}
                                selected={isItemSelected}
                            >
                                <TableCell padding="checkbox">
                                <Checkbox
                                        checked={isItemSelected}
                                        onClick={(event) => handleCheckboxClick(event, name)}
                                    />
                                </TableCell>
                                    <TableCell>{name}</TableCell>
                                    <TableCell>
                                    <TextField
                                        type="number"
                                        value={details.qty || 0}
                                        onChange={(e) => handleQuantityChange(name, parseInt(e.target.value, 10))}
                                        inputProps={{ min: 0, style: { width: '50px' } }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TagBox
                                        tags={details.tags || []}
                                        onTagsChange={(tags) => {
                                            handleTagsChange(name, tags)
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                            );
                        })}
                        <TableRow>
                            <TableCell colSpan={4}>
                                <Autocomplete
                                    freeSolo
                                    options={autocompleteOptions}
                                    inputValue={newCardName}
                                    onInputChange={handleNewCardNameChange}
                                    onChange={(event, value) => setNewCardName(value || '')}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            onBlur={handleCreateCard}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleCreateCard();
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
                rowsPerPageOptions={[5, 10, 25]}
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
