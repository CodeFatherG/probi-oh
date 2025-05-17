import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Select, MenuItem, IconButton, Grid,
    Autocomplete, Alert, Snackbar, Paper,
    Tooltip
} from '@mui/material';
import { Remove, DragIndicator } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { parseCondition } from '@probi-oh/core/src/parser';
import { Condition, ConditionType, LogicCondition, ConditionLocation, ConditionOperator } from '@probi-oh/types';
import { conditionToString } from '@probi-oh/core/src/condition';

interface ConditionBuilderDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (condition: Condition) => void;
    initialCondition: Condition | undefined;
    autocompleteOptions: string[];
}

interface Element {
    id: string;
    type: 'condition' | 'and' | 'or' | 'group';
    quantity?: number;
    operator?: string;
    cardName?: string;
    location?: string;
    children?: Element[];
}

function createNewElement(type: 'condition' | 'and' | 'or' | 'group'): Element {
    const newElement: Element = { id: `element-${Date.now()}-${Math.random()}`, type };

    if (type === 'condition') {
        newElement.quantity = 1;
        newElement.operator = '>=';
        newElement.cardName = '';
        newElement.location = 'Hand';
    } else if (type === 'group') {
        newElement.children = [];
    }
    return newElement;
}

function addElementToList(elements: Element[], type: 'condition' | 'and' | 'or' | 'group'): Element[] {
    return([...elements, createNewElement(type)]);
}

interface GroupComponentProps {
    element: Element;
    index: number;
    updateElement: (index: number, field: string, value: string | number | Element[]) => void;
    autocompleteOptions: string[];
}

interface ConditionListProps {
    elements: Element[];
    updateElement: (index: number, field: string, value: string | number | Element[]) => void;
    removeElement: (index: number) => void;
    addElement: (type: 'condition' | 'and' | 'or' | 'group') => void;
    autocompleteOptions: string[];
    dragType: 'list-item' | 'group-item';
}
  
function GroupComponent({ element, index, updateElement, autocompleteOptions}: GroupComponentProps) {
    return (
        <Paper
            elevation={1}
            sx={{ p: 2, mb: 2, backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
        >
            <Grid container spacing={1} alignItems="center">
                <Grid item xs>
                    <Droppable droppableId={`group-${Date.now()}-${Math.random()}`} type="group-item">
                        {(providedDrop) => (
                        <div>
                            <ConditionList
                                elements={element.children || []}
                                updateElement={(childIndex, field, value) => {
                                    const newChildren = [...(element.children || [])];
                                    newChildren[childIndex] = { ...newChildren[childIndex], [field]: value };
                                    updateElement(index, 'children', newChildren);
                                }}
                                removeElement={(childIndex) => {
                                    const newChildren = (element.children || []).filter((_, i) => i !== childIndex);
                                    updateElement(index, 'children', newChildren);
                                }}
                                addElement={(type) => {
                                    const newChildren = addElementToList(element.children || [], type);
                                    updateElement(index, 'children', newChildren);
                                }}
                                autocompleteOptions={autocompleteOptions}
                                dragType="group-item"
                            />
                            {providedDrop.placeholder}
                        </div>
                        )}
                    </Droppable>
                </Grid>
            </Grid>
        </Paper>
    );
}
  
function ConditionList({
    elements,
    updateElement,
    removeElement,
    addElement,
    autocompleteOptions,
    dragType
}: ConditionListProps) {
    const renderElement = (element: Element, index: number) => {
        const content = (
            <Grid container spacing={1} alignItems="center" sx={{ mb: 1, width: '100%' }}>
                <Tooltip title={dragType === 'group-item' ? "Nested draggables are not supported, sorry" : ""}>
                    <Grid item>
                        <DragIndicator sx={{ color: dragType === 'group-item' ? 'action.disabled' : 'inherit' }} />
                    </Grid>
                </Tooltip>
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
                        <Grid item xs={2}>
                            <TextField
                                size="small"
                                type="number"
                                value={element.quantity}
                                onChange={(e) => updateElement(index, 'quantity', Number(e.target.value))}
                                InputProps={{ inputProps: { min: 1 } }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs>
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
                ) : element.type === 'group' ? (
                    <Grid item xs>
                        <GroupComponent
                            element={element}
                            index={index}
                            updateElement={updateElement}
                            autocompleteOptions={autocompleteOptions}
                        />
                    </Grid>
                ) : (
                    <Grid item xs>
                        <Select
                            size="small"
                            value={element.type}
                            onChange={(e) => updateElement(index, 'type', e.target.value as 'and' | 'or')}
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
        );

        return dragType === 'list-item' ? (
            <Draggable key={element.id} draggableId={element.id} index={index}>
                {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{...provided.draggableProps.style, width: '100%'}}
                >
                    {content}
                </div>
                )}
            </Draggable>
        ) : (
            <div key={element.id} style={{width: '100%'}}>
                {content}
            </div>
        );
    };

    return (
        <div style={{width: '100%'}}>
            {elements.map((element, index) => renderElement(element, index))}
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
                <Grid item>
                <Button variant="outlined" onClick={() => addElement('group')}>
                    Add Group
                </Button>
                </Grid>
            </Grid>
        </div>
    );
}

function conditionIsLogical(condition: Condition): condition is LogicCondition {
    return (condition as LogicCondition).type !== undefined;
}

function conditionHasAnd(condition: LogicCondition): boolean {
    return condition.type === ConditionType.AND;
}

export default function ConditionBuilderDialog({ open, onClose, onSave, initialCondition, autocompleteOptions }: ConditionBuilderDialogProps) {
    const [elements, setElements] = useState<Element[]>([]);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        if (initialCondition) {
            const parseGroup = (condition: LogicCondition): Element => {
                const group = createNewElement('group');
                group.children = [];
                group.children.push(...parseElement(condition.conditionA));
                group.children.push(createNewElement(condition.type === ConditionType.AND ? 'and' : 'or'));
                group.children.push(...parseElement(condition.conditionB));
                return group;
            }

            // function to parse the next condition object
            const parseElement = (condition: Condition): Element[] => {
                if (conditionIsLogical(condition)) {
                    if (conditionHasAnd(condition)) {
                        if (condition.render?.hasParentheses) {
                            return [parseGroup(condition)];
                        } else {
                            return [
                                ...parseElement(condition.conditionA),
                                createNewElement('and'),
                                ...parseElement(condition.conditionB)
                            ];
                        }

                    } else if (condition) {
                        if (condition.render?.hasParentheses) {
                            return [parseGroup(condition)];
                        } else {
                            return [
                                ...parseElement(condition.conditionA),
                                createNewElement('or'),
                                ...parseElement(condition.conditionB)
                            ];
                        }
                    } 
                } else if (condition) {
                    const cond = createNewElement('condition');
                    cond.quantity = condition.cardCount,
                    cond.operator = condition.operator === ConditionOperator.AT_LEAST ? '>=' : condition.operator === ConditionOperator.NO_MORE ? '<=' : '=',
                    cond.cardName = condition.cardName,
                    cond.location = condition.location === ConditionLocation.DECK ? 'Deck' : 'Hand'
                    return [cond];
                }

                    console.error(`Invalid condition object ${conditionToString(condition)}`);
                    return [];
            }

            setElements(parseElement(initialCondition));
        } else {
            setElements([{ id: 'element-0', type: 'condition', quantity: 1, operator: '>=', cardName: '', location: 'Hand' }]);
        }
    }, [initialCondition, open]);

    const removeElement = (index: number) => {
        setElements(elements.filter((_, i) => i !== index));
    };

    const updateElement = (index: number, field: string, value: string | number | Element[]) => {
        const newElements = [...elements];
        newElements[index] = { ...newElements[index], [field]: value };
        setElements(newElements);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        const reorder = (list: Element[], startIndex: number, endIndex: number) => {
            const result = Array.from(list);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return result;
        };

        if (result.type === 'list-item') {
            setElements(reorder(elements, result.source.index, result.destination.index));
        } else if (result.type === 'group-item') {
            const groupId = result.source.droppableId.split('-')[1];
            const groupIndex = elements.findIndex(el => el.id === groupId);
            if (groupIndex !== -1) {
                const newElements = [...elements];
                newElements[groupIndex].children = reorder(
                    newElements[groupIndex].children || [],
                    result.source.index,
                    result.destination.index
                );
                setElements(newElements);
            }
        }
    };

    const elementToString = (element: Element): string => {
        if (element.type === 'condition') {
            const op = element.operator === '>=' ? '+' : element.operator === '<=' ? '-' : '';
            return `${element.quantity}${op} ${element.cardName} IN ${element.location}`;
        } else if (element.type === 'group') {
            return `(${element.children?.map(elementToString).join(' ')})`;
        }
        return element.type.toUpperCase();
    };

    const handleSave = () => {
        const conditionString = elements.map(el => {
            return elementToString(el);
        }).join(' ');

        try {
            onSave(parseCondition(conditionString));
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

    const onAddElement = (type: 'condition' | 'and' | 'or' | 'group') => {
        const newElements = addElementToList(elements, type);
        setElements(newElements);
    }

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>Build Condition</DialogTitle>
                <DialogContent>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="condition-list" type="list-item">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                    <ConditionList
                                        elements={elements}
                                        updateElement={updateElement}
                                        removeElement={removeElement}
                                        addElement={onAddElement}
                                        autocompleteOptions={autocompleteOptions}
                                        dragType="list-item"
                                    />
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
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