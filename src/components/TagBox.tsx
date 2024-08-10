import React from 'react';
import { Box, Chip, Stack } from '@mui/material';
import FlexibleTextBox from './FlexibleTextBox';

export interface TagBoxProps {
    tags: string[];
    onTagsChange: (newTags: string[]) => void;
}

export default function TagBox({tags, onTagsChange}: TagBoxProps) {
    const handleFlexibleInputComplete = (value: string) => {
        if (value.trim() !== '' && !tags.includes(value.trim())) {
            onTagsChange([...tags, value.trim()]);
        }
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
            <FlexibleTextBox
                onComplete={handleFlexibleInputComplete}
                placeholder="Add a tag"
                style={{
                    width: '100%',
                    boxSizing: 'border-box'
                }}
            />
        </Box>
    );
}
