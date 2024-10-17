import React, { MouseEvent, useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, IconButton, TableCell, TableRow, TableRowProps, TextField, Tooltip, Typography } from "@mui/material";
import TagBox from "./TagBox";
import CardImage from "./CardImage";
import { Delete, DragIndicator } from "@mui/icons-material";
import { CardDetails } from '@server/card-details';
import { DraggableProvided } from "@hello-pangea/dnd";
import CardPreview from "./CardPreview";
import { getCardByName } from "@/ygo/card-api";
import { CardInformation } from "@/ygo/card-information";

interface CardRowProps extends TableRowProps {
    cardName: string;
    cardDetails: CardDetails;
    tagOptions?: string[];
    draggableProvided: DraggableProvided | null;
    onDelete: () => void;
    onDetailsChange: (name: string, details: CardDetails) => void;
}

export default function CardRow({ cardName, cardDetails, tagOptions, draggableProvided, onDelete, onDetailsChange, ...props }: CardRowProps) {
    const [information, setInformation] = useState<CardInformation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCard = async () => {
            try {
                setLoading(true);
                const data = await getCardByName(cardName);
                setInformation(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };

        fetchCard();
    }, [cardName]);

    const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.stopPropagation();
        const quantity = parseInt(event.target.value, 10);
        onDetailsChange(cardName, { ...cardDetails, qty: quantity });
    };

    const handleTagsChange = (tags: string[], event: MouseEvent) => {
        event.stopPropagation();
        onDetailsChange(cardName, { ...cardDetails, tags });
    };

    const renderTooltipContent = () => {
        if (loading) {
            return <CircularProgress size={24} />;
        }

        if (error) {
            return <Typography color="error">Error loading card info</Typography>;
        }

        if (information) {
            return <CardPreview cardInformation={information} />;
        }
        
        return <Typography>No card information available</Typography>;
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
                    <Tooltip 
                        title={
                            <CardPreview cardInformation={information}/>
                        }
                        PopperProps={{
                            sx: {
                                '& .MuiTooltip-tooltip': {
                                    maxWidth: '500px'
                                },
                            },
                        }}
                    >
                        <Box>
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
                        </Box>
                    </Tooltip>
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