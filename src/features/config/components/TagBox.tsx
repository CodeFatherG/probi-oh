import React, { useState, MouseEvent } from 'react';
import { Autocomplete, Box, Chip, Stack, TextField } from '@mui/material';

export interface TagBoxProps {
    tags: string[];
    tagOptions?: string[];
    onTagsChange: (tags: string[], event: MouseEvent) => void;
    onClick?: (event: MouseEvent) => void;
}

export default function TagBox({tags, tagOptions, onTagsChange, onClick}: TagBoxProps) {
    const [newTag, setNewTag] = useState('');
    const [selectedValue, setSelectedValue] = useState('');

    const handleNewTag = (event: MouseEvent, value: string) => {
        if (value.trim() !== '' && !tags.includes(value.trim())) {
            onTagsChange([...tags, value.trim()], event);
        }

        setNewTag('');
        setSelectedValue('');
    };

    const handleDeleteTag = (tagToDelete: string) => (event: MouseEvent) => {
        event.stopPropagation();
        onTagsChange(tags.filter((tag) => tag !== tagToDelete), event);
    };

    const handleBoxClick = (event: MouseEvent) => {
        event.stopPropagation();
        if (onClick) {
            onClick(event);
        }
    };

    const handleNewTagChange = (event: React.ChangeEvent<object>, value: string, reason: string) => {
        if (reason === 'input') {
            setNewTag(value);
        } else if (reason === 'clear') {
            setNewTag('');
            setSelectedValue('');
        }
    };

    return (
        <Box sx={{ width: '100%' }} onClick={handleBoxClick}>
            <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                {tags.map((tag) => (
                    <Chip
                        key={tag}
                        label={tag}
                        variant="outlined"
                        onDelete={handleDeleteTag(tag)}
                        sx={{ margin: '2px' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ))}
            </Stack>
            <Autocomplete
                freeSolo
                options={tagOptions || []}
                inputValue={newTag}
                value={selectedValue}
                onInputChange={handleNewTagChange}
                onChange={(event, value) => {
                    if (value) {
                        handleNewTag(event as unknown as MouseEvent, value);
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleNewTag(e as unknown as MouseEvent, newTag);
                                e.preventDefault();
                            }
                        }}
                        placeholder="Add a new tag..."
                        fullWidth
                        size="small"
                        InputProps={{
                            ...params.InputProps,
                            style: { fontSize: '0.875rem' }
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
                size="small"
            />
        </Box>
    );
}