import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Select, MenuItem, IconButton, Grid,
    Autocomplete
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

interface ConditionBuilderDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (condition: string) => void;
    initialCondition: string;
    autocompleteOptions: string[];
}

interface Element {
    type: 'single' | 'and' | 'or';
    quantity?: number;
    operator?: string;
    cardName?: string;
    location?: string;
}

export default function ConditionBuilderDialog({ open, onClose, onSave, initialCondition, autocompleteOptions }: ConditionBuilderDialogProps) {
    const [elements, setElements] = useState<Element[]>([]);

    useEffect(() => {
        if (initialCondition) {
            const parsedElements = initialCondition.split(' ').map(el => {
                if (el === 'AND' || el === 'OR') {
                return { type: el.toLowerCase() };
                }
                const [quantityOp, cardName, , location] = el.split(' ');
                const quantity = parseInt(quantityOp);
                const operator = quantityOp.includes('+') ? '>=' : quantityOp.includes('-') ? '<=' : '=';
                return { type: 'single', quantity, operator, cardName, location };
            });
            setElements(parsedElements);
        } else {
            setElements([{ type: 'single', quantity: 1, operator: '>=', cardName: '', location: 'Hand' }]);
        }
    }, [initialCondition, open]);

    const addElement = (type: string) => {
        if (type === 'single') {
            setElements([...elements, { type, quantity: 1, operator: '>=', cardName: '', location: 'Hand' }]);
        } else {
            setElements([...elements, { type }]);
        }
    };

    const removeElement = (index) => {
        setElements(elements.filter((_, i) => i !== index));
    };

    const updateElement = (index, field, value) => {
        const newElements = [...elements];
        newElements[index] = { ...newElements[index], [field]: value };
        setElements(newElements);
    };

    const handleSave = () => {
        const conditionString = elements.map(el => {
            if (el.type === 'single') {
                const op = el.operator === '>=' ? '+' : el.operator === '<=' ? '-' : '';
                return `${el.quantity}${op} ${el.cardName} IN ${el.location}`;
            }
            return el.type.toUpperCase();
        }).join(' ');
        onSave(conditionString);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Build Condition</DialogTitle>
        <DialogContent>
            {elements.map((element, index) => (
                <Grid container spacing={1} alignItems="center" key={index} sx={{ mb: 1 }}>
                    {element.type === 'single' ? (
                    <>
                        <Grid item xs={1}>
                            <TextField
                                size="small"
                                type="number"
                                value={element.quantity}
                                onChange={(e) => updateElement(index, 'quantity', e.target.value)}
                                InputProps={{ inputProps: { min: 1 } }}
                            />
                        </Grid>
                        <Grid item xs={2}>
                            <Select
                                size="small"
                                value={element.operator}
                                onChange={(e) => updateElement(index, 'operator', e.target.value)}
                                fullWidth
                            >
                                <MenuItem value=">=">≥</MenuItem>
                                <MenuItem value="=">=</MenuItem>
                                <MenuItem value="<=">≤</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={5}>
                        <Autocomplete
                                freeSolo
                                options={autocompleteOptions}
                                value={element.cardName}
                                onInputChange={(event, newValue) => {
                                updateElement(index, 'cardName', newValue);
                                }}
                                renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    placeholder="Card name or tag"
                                    fullWidth
                                />
                                )}
                            />
                        </Grid>
                        <Grid item xs={2}>
                            <Select
                                size="small"
                                value={element.location}
                                onChange={(e) => updateElement(index, 'location', e.target.value)}
                                fullWidth
                            >
                                <MenuItem value="Hand">Hand</MenuItem>
                                <MenuItem value="Deck">Deck</MenuItem>
                            </Select>
                        </Grid>
                    </>
                    ) : (
                    <Grid item xs={10}>
                        <Select
                        size="small"
                        value={element.type}
                        onChange={(e) => updateElement(index, 'type', e.target.value)}
                        fullWidth
                        >
                        <MenuItem value="and">AND</MenuItem>
                        <MenuItem value="or">OR</MenuItem>
                        </Select>
                    </Grid>
                    )}
                    <Grid item xs={2}>
                    <IconButton onClick={() => removeElement(index)}>
                        <Remove />
                    </IconButton>
                    </Grid>
                </Grid>
            ))}
            <Grid container spacing={1} sx={{ mt: 2 }}>
                <Grid item>
                    <Button variant="outlined" onClick={() => addElement('single')}>
                    Add Condition
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="outlined" onClick={() => addElement('and')}>
                    Add AND
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="outlined" onClick={() => addElement('or')}>
                    Add OR
                    </Button>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
        </Dialog>
    );
}