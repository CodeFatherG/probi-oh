import React, { useState } from 'react';
import { Box, Chip, Stack } from '@mui/material';
import FlexibleTextBox from './FlexibleTextBox';

const TagBox = () => {
    const [tags, setTags] = useState<string[]>([]);

    const handleFlexibleInputComplete = (value: string) => {
        if (value.trim() !== '' && !tags.includes(value.trim())) {
            setTags([...tags, value.trim()]);
        }
    };

    const handleDeleteTag = (tagToDelete: string) => () => {
        setTags((prevTags) => prevTags.filter((tag) => tag !== tagToDelete));
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
};

export default TagBox;