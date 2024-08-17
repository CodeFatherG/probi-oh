import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Select, MenuItem, IconButton, Grid,
    Autocomplete
} from '@mui/material';
import { Remove } from '@mui/icons-material';
import { parseCondition } from '../utils/parser';
import { AndCondition, BaseCondition, Condition, LocationConditionTarget, OrCondition } from '../utils/condition';

interface ConditionBuilderDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (condition: string) => void;
    initialCondition: string;
    autocompleteOptions: string[];
}

interface Element {
    type: 'condition' | 'and' | 'or';
    quantity?: number;
    operator?: string;
    cardName?: string;
    location?: string;
}

export default function ConditionBuilderDialog({ open, onClose, onSave, initialCondition, autocompleteOptions }: ConditionBuilderDialogProps) {
    const [elements, setElements] = useState<Element[]>([]);

    useEffect(() => {
        if (initialCondition) {
            const elements: Element[] = [];
            
            // parse the condition string to objects
            const condition = parseCondition(initialCondition);

            // function to parse the next condition object
            const parseElement = (condition: BaseCondition) => {
                if (condition instanceof AndCondition) {
                    parseElement(condition.conditions[0]);
                    elements.push({ type: 'and' });
                    parseElement(condition.conditions[1]);
                } else if (condition instanceof OrCondition) {
                    parseElement(condition.conditions[0]);
                    elements.push({ type: 'or' });
                    parseElement(condition.conditions[1]);
                } else if (condition instanceof Condition) {
                    elements.push({
                        type: 'condition',
                        quantity: condition.quantity,
                        operator: condition.operator,
                        cardName: condition.cardName,
                        location: condition.location === LocationConditionTarget.Deck ? 'Deck' : 'Hand'
                    });
                }
            }

            // Now parse the element
            parseElement(condition);

            setElements(elements);
        } else {
            setElements([{ type: 'condition', quantity: 1, operator: '>=', cardName: '', location: 'Hand' }]);
        }
    }, [initialCondition, open]);
    
    const addElement = (type: 'condition' | 'and' | 'or') => {
        const newElements: Element[] = [];
        const lastElement = elements[elements.length - 1];

        if (type === 'condition') {
            newElements.push({ type, quantity: 1, operator: '>=', cardName: '', location: 'Hand' });
        } else {
            if (!lastElement || lastElement.type !== 'condition') {
                newElements.push({ type: 'condition', quantity: 1, operator: '>=', cardName: '', location: 'Hand' });
            }
            
            newElements.push({ type });
            newElements.push({ type: 'condition', quantity: 1, operator: '>=', cardName: '', location: 'Hand' });
        }

        setElements([...elements, ...newElements]);
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
            if (el.type === 'condition') {
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
                    {element.type === 'condition' ? (
                    <>
                        <Grid item xs={2}>
                            <Select
                                size="small"
                                value={element.operator}
                                onChange={(e) => updateElement(index, 'operator', e.target.value)}
                                fullWidth
                            >
                                <MenuItem value=">=">at least</MenuItem>
                                <MenuItem value="=">exactly</MenuItem>
                                <MenuItem value="<=">no more than</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={1}>
                            <TextField
                                size="small"
                                type="number"
                                value={element.quantity}
                                onChange={(e) => updateElement(index, 'quantity', e.target.value)}
                                InputProps={{ inputProps: { min: 1 } }}
                            />
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
                    <Button variant="outlined" onClick={() => addElement('condition')}>
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