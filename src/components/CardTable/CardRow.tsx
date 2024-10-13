import React, { MouseEvent } from "react";
import { Box, IconButton, TableCell, TableRow, TableRowProps, TextField, Typography } from "@mui/material";
import TagBox from "./TagBox";
import CardImage from "./CardImage";
import { Delete, DragIndicator } from "@mui/icons-material";
import { CardDetails } from '@server/card-details';
import { DraggableProvided } from "@hello-pangea/dnd";

interface CardRowProps extends TableRowProps {
    cardName: string;
    cardDetails: CardDetails;
    tagOptions?: string[];
    draggableProvided: DraggableProvided | null;
    onDelete: () => void;
    onDetailsChange: (name: string, details: CardDetails) => void;
}

export default function CardRow({ cardName, cardDetails, tagOptions, draggableProvided, onDelete, onDetailsChange, ...props }: CardRowProps) {

    const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.stopPropagation();
        const quantity = parseInt(event.target.value, 10);
        onDetailsChange(cardName, { ...cardDetails, qty: quantity });
    };

    const handleTagsChange = (tags: string[], event: MouseEvent) => {
        event.stopPropagation();
        onDetailsChange(cardName, { ...cardDetails, tags });
    };

    return (
        <TableRow
            hover
            tabIndex={-1}
            ref={draggableProvided?.innerRef}
            {...draggableProvided?.draggableProps}
            sx={{
                ...draggableProvided?.draggableProps.style,
            }}
            {...props}
        >
            <TableCell padding="none">
                <Box display="flex" justifyContent="center">
                    {draggableProvided !== null ? (
                        <IconButton 
                            {...draggableProvided?.dragHandleProps} 
                            disabled={false}
                            size="small"
                        >
                            <DragIndicator />
                        </IconButton>
                    ) : (
                        <IconButton 
                            disabled={true}
                            size="small"
                        >
                            <DragIndicator />
                        </IconButton>
                    )}
                </Box>
            </TableCell>
            <TableCell>
                <Box display="flex" alignContent='center'>
                    <CardImage 
                        name={cardName} 
                        type="cropped" 
                        sx={{ 
                            maxWidth: '60px', 
                            maxHeight: '60px', 
                            objectFit: 'fill',
                            borderRadius: '8px',
                            mr: 3
                        }} 
                    />
                    <Typography variant='body1'>{cardName}</Typography>
                </Box>
            </TableCell>
            <TableCell>
                <TextField
                    type="number"
                    value={cardDetails.qty || 0}
                    onChange={handleQuantityChange}
                    onClick={(e) => e.stopPropagation()}
                    inputProps={{ min: 0, style: { width: '50px' } }}
                />
            </TableCell>
            <TableCell>
                <TagBox
                    tags={cardDetails.tags || []}
                    onTagsChange={handleTagsChange}
                    tagOptions={tagOptions}
                    onClick={(e) => e.stopPropagation()}
                />
            </TableCell>
            <TableCell>
                <Box display="flex" justifyContent="center">
                    <IconButton size="small" onClick={onDelete}>
                        <Delete />
                    </IconButton>
                </Box>
            </TableCell>
        </TableRow>
    )
}