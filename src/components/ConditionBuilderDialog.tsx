import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Select, MenuItem, IconButton, Grid,
    Autocomplete, Alert, Snackbar
} from '@mui/material';
import { Remove, DragIndicator } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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
    id: string;
    type: 'condition' | 'and' | 'or';
    quantity?: number;
    operator?: string;
    cardName?: string;
    location?: string;
}

export default function ConditionBuilderDialog({ open, onClose, onSave, initialCondition, autocompleteOptions }: ConditionBuilderDialogProps) {
    const [elements, setElements] = useState<Element[]>([]);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        if (initialCondition) {
            const elements: Element[] = [];
            
            // parse the condition string to objects
            const condition = parseCondition(initialCondition);

            // function to parse the next condition object
            const parseElement = (condition: BaseCondition) => {
                if (condition instanceof AndCondition) {
                    parseElement(condition.conditions[0]);
                    elements.push({ id: `element-${elements.length}`, type: 'and' });
                    parseElement(condition.conditions[1]);
                } else if (condition instanceof OrCondition) {
                    parseElement(condition.conditions[0]);
                    elements.push({ id: `element-${elements.length}`, type: 'or' });
                    parseElement(condition.conditions[1]);
                } else if (condition instanceof Condition) {
                    elements.push({
                        id: `element-${elements.length}`,
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
            setElements([{ id: 'element-0', type: 'condition', quantity: 1, operator: '>=', cardName: '', location: 'Hand' }]);
        }
    }, [initialCondition, open]);
    
    const addElement = (type: 'condition' | 'and' | 'or') => {
        const newElements: Element[] = [];
        const lastElement = elements[elements.length - 1];

        if (type === 'condition') {
            newElements.push({ id: `element-${elements.length}`, type, quantity: 1, operator: '>=', cardName: '', location: 'Hand' });
        } else {
            if (!lastElement || lastElement.type !== 'condition') {
                newElements.push({ id: `element-${elements.length}`, type: 'condition', quantity: 1, operator: '>=', cardName: '', location: 'Hand' });
            }
            
            newElements.push({ id: `element-${elements.length + 1}`, type });
            newElements.push({ id: `element-${elements.length + 2}`, type: 'condition', quantity: 1, operator: '>=', cardName: '', location: 'Hand' });
        }

        setElements([...elements, ...newElements]);
    };

    const removeElement = (index: number) => {
        setElements(elements.filter((_, i) => i !== index));
    };

    const updateElement = (index: number, field: string, value: any) => {
        const newElements = [...elements];
        newElements[index] = { ...newElements[index], [field]: value };
        setElements(newElements);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        const newElements = Array.from(elements);
        const [reorderedItem] = newElements.splice(result.source.index, 1);
        newElements.splice(result.destination.index, 0, reorderedItem);

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

        try {
            parseCondition(conditionString);
            onSave(conditionString);
        } catch (e) {
            setAlertMessage('Invalid condition');
            setAlertOpen(true);
        }
    };

    const handleCloseAlert = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setAlertOpen(false);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>Build Condition</DialogTitle>
                <DialogContent>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="condition-list">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {elements.map((element, index) => (
                                        <Draggable key={element.id} draggableId={element.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <Grid 
                                                        container 
                                                        spacing={1} 
                                                        alignItems="center" 
                                                        sx={{ mb: 1 }}
                                                    >
                                                        <Grid item>
                                                            <DragIndicator />
                                                        </Grid>
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
                                                                <Grid item xs={4}>
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
                                                            <Grid item xs={9}>
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
                                                        <Grid item>
                                                            <IconButton onClick={() => removeElement(index)}>
                                                                <Remove />
                                                            </IconButton>
                                                        </Grid>
                                                    </Grid>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                    <Grid container spacing={1} sx={{ mt: 2 }}>
                        <Grid item>
                            <Button variant="outlined" onClick={() => addElement('condition')}>
                                Add Condition
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button variant="outlined" onClick={() => addElement('or')}>
                                Add Logic
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
            <Snackbar 
                open={alertOpen} 
                autoHideDuration={6000} 
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
                    {alertMessage}
                </Alert>
            </Snackbar>
        </>
    );
}