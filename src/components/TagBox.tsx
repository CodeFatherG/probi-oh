import React from 'react';
import { Autocomplete, Box, Chip, Stack, TextField } from '@mui/material';

export interface TagBoxProps {
    tags: string[];
    tagOptions?: string[];
    onTagsChange: (newTags: string[]) => void;
}

export default function TagBox({tags, tagOptions, onTagsChange}: TagBoxProps) {
    const [newTag, setNewTag] = React.useState('');
    const handleNewTag = () => {
        if (newTag.trim() !== '' && !tags.includes(newTag.trim())) {
            onTagsChange([...tags, newTag.trim()]);
        }

        setNewTag('');
    };

    const handleDeleteTag = (tagToDelete: string) => () => {
        onTagsChange(tags.filter((tag) => tag !== tagToDelete));
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                {tags.map((tag) => (
                    <Chip
                        key={tag}
                        label={tag}
                        variant="outlined"
                        onDelete={handleDeleteTag(tag)}
                        sx={{ margin: '2px' }}
                    />
                ))}
            </Stack>
            <Autocomplete
                freeSolo
                options={tagOptions || []}
                inputValue={newTag}
                onInputChange={(event, value) => setNewTag(value)}
                onChange={(event, value) => setNewTag(value || '')}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        // onBlur={handleNewTag}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleNewTag();
                            }
                        }}
                        placeholder="Add a new tag..."
                        fullWidth
                        size="small"
                        InputProps={{
                            ...params.InputProps,
                            style: { fontSize: '0.875rem' }
                        }}
                    />
                )}
                size="small"
            />
        </Box>
    );
}
