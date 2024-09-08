import { Box, IconButton, TableCell, TableRow, TableRowProps, TextField, Typography } from "@mui/material";
import React from "react";
import TagBox from "./TagBox";
import CardImage from "./CardImage";
import { DragIndicator } from "@mui/icons-material";
import { CardDetails } from '../../utils/card-details';
import { DraggableProvided } from "@hello-pangea/dnd";

interface CardRowProps extends TableRowProps {
    cardName: string;
    cardDetails: CardDetails;
    tagOptions?: string[];
    draggableProvided: DraggableProvided | null;
    onDetailsChange: (name: string, details: CardDetails) => void;
}

export default function CardRow({ cardName, cardDetails, tagOptions, draggableProvided, onDetailsChange, ...props }: CardRowProps) {

    const handleQuantityChange = (name: string, quantity: number) => {
        onDetailsChange(name, { ...cardDetails, qty: quantity });
    };

    const handleTagsChange = (name: string, tags: string[]) => {
        onDetailsChange(name, { ...cardDetails, tags });
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
            <TableCell padding="none" width="48px">
                {draggableProvided &&
                    <IconButton {...draggableProvided?.dragHandleProps} size="small">
                        <DragIndicator />
                    </IconButton>
                }
            </TableCell>
            <TableCell width="45%">
                <Box display="flex" alignContent='center'>
                    <CardImage 
                        name={cardName} 
                        type="cropped" 
                        sx={{ 
                            maxWidth: '60px', 
                            maxHeight: '60px', 
                            objectFit: 'fill',
                            mr: 3
                        }} 
                    />
                    <Typography variant='body1'>{cardName}</Typography>
                </Box>
            </TableCell>
            <TableCell width="10%">
                <TextField
                    type="number"
                    value={cardDetails.qty || 0}
                    onChange={(e) => handleQuantityChange(cardName, parseInt(e.target.value, 10))}
                    inputProps={{ min: 0, style: { width: '50px' } }}
                />
            </TableCell>
            <TableCell width="45%">
                <TagBox
                    tags={cardDetails.tags || []}
                    onTagsChange={(tags) => {
                        handleTagsChange(cardName, tags)
                    }}
                    tagOptions={tagOptions}
                />
            </TableCell>
        </TableRow>
    )
}