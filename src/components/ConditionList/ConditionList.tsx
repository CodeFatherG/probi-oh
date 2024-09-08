import React, { useState } from 'react';
import {
    Box, Paper, Typography, Button, List, ListItem, ListItemText,
    ListItemSecondaryAction, IconButton
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import ConditionBuilderDialog from './ConditionBuilderDialog';

interface ConditionListProps {
    conditions: string[];
    onConditionsChange: (newConditions: string[]) => void;
    autocompleteOptions: string[];
}

export default function ConditionList({ conditions, onConditionsChange, autocompleteOptions }: ConditionListProps) {
    const [open, setOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleOpen = () => {
        setEditingIndex(null);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingIndex(null);
    };

    const handleSave = (newCondition: string) => {
        let newConditions;
        if (editingIndex !== null) {
        newConditions = [...conditions];
        newConditions[editingIndex] = newCondition;
        } else {
        newConditions = [...conditions, newCondition];
        }
        onConditionsChange(newConditions);
        handleClose();
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setOpen(true);
    };

    const handleDelete = (index: number) => {
        const newConditions = conditions.filter((_, i) => i !== index);
        onConditionsChange(newConditions);
    };

    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" component="div" sx={{ flex: '1 1 100%' }}>
                Conditions
            </Typography>
            <List>
                {conditions.map((condition, index) => (
                <ListItem key={index}>
                    <ListItemText primary={condition} />
                    <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(index)}>
                            <Edit />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(index)}>
                            <Delete />
                        </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>
                ))}
            </List>
            <Box sx={{ mt: 2 }}>
                <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
                    Add Condition
                </Button>
            </Box>
            <ConditionBuilderDialog
                open={open}
                onClose={handleClose}
                onSave={handleSave}
                initialCondition={editingIndex !== null ? conditions[editingIndex] : ''}
                autocompleteOptions={autocompleteOptions}
            />
        </Paper>
    );
}