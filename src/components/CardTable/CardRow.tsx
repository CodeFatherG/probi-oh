import React, { MouseEvent, useEffect, useState } from "react";
import { Box, IconButton, Stack, TableCell, TableRow, TableRowProps, TextField, Tooltip, Typography } from "@mui/material";
import TagBox from "./TagBox";
import CardImage from "./CardImage";
import { Delete, DragIndicator } from "@mui/icons-material";
import { CardDetails } from '@server/card-details';
import { DraggableProvided } from "@hello-pangea/dnd";
import CardPreview from "./CardPreview";
import { CardInformation } from "@/ygo/card-information";
import { getAverageCardPrice, getCardPrice, getHighestCardPrice, getLowestCardPrice } from "@/ygo/prices";
import { getSettings } from "../Settings/settings";
import { getCard } from "@/ygo/card-api";
import { getCurrencySymbol } from "@/currency/currency";

interface CardRowProps extends TableRowProps {
    cardName: string;
    cardDetails: CardDetails;
    tagOptions?: string[];
    draggableProvided: DraggableProvided | null;
    onDelete: () => void;
    onDetailsChange: (name: string, details: CardDetails) => void;
}

const CardPriceSummary = ({ prices }: { prices: Record<string, number> }) => {
    return (
        <Stack>
            {Object.entries(prices).map(([source, price]) => (
                <Typography key={source} variant='caption'>{`${source}: ${getCurrencySymbol(getSettings().selectedCurrency)}${price.toFixed(2)}`}</Typography>
            ))}
        </Stack>
    );
}

export default function CardRow({ cardName, cardDetails, tagOptions, draggableProvided, onDelete, onDetailsChange, ...props }: CardRowProps) {
    const [information, setInformation] = useState<CardInformation | null>(null);
    const [cardPrices, setCardPrices] = useState<Record<string, number>>({});
    const [minPrice, setMinPrice] = useState<number>(0);
    const [averagePrice, setAveragePrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(0);

    useEffect(() => {
        const fetchCard = async () => {
            try {
                const data = await getCard(cardName);
                setInformation(data);
            } catch (err) {
                console.log(`Failed to fetch card information for ${cardName}: ${err}`);
            }
        };

        const fetchPrice = async () => {
            try {
                setCardPrices(await getCardPrice(cardName));
                setAveragePrice(await getAverageCardPrice(cardName));
                setMinPrice(await getLowestCardPrice(cardName));
                setMaxPrice(await getHighestCardPrice(cardName));
            } catch (err) {
                console.log(`Failed to fetch card price for ${cardName}: ${err}`);
            }
        }

        fetchCard();
        fetchPrice();
    }, [cardName, getSettings().selectedCurrency]);

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
                    <Stack>
                        <Typography variant='body1'>{cardName}</Typography>
                        <Tooltip 
                            title={
                                <CardPriceSummary prices={cardPrices}/>
                            }
                            PopperProps={{
                                sx: {
                                    '& .MuiTooltip-tooltip': {
                                        maxWidth: '150px'
                                    },
                                },
                            }}
                        >
                            <Box display='flex'>
                                <Typography m='2px' color='#73a657' variant='caption'>{`${getCurrencySymbol(getSettings().selectedCurrency)}${minPrice.toFixed(2)}`}</Typography>
                                <Typography m='2px' color='#b3ebf2' variant='caption'>{`${getCurrencySymbol(getSettings().selectedCurrency)}${averagePrice.toFixed(2)}`}</Typography>
                                <Typography m='2px' color='#ff6961' variant='caption'>{`${getCurrencySymbol(getSettings().selectedCurrency)}${maxPrice.toFixed(2)}`}</Typography>
                            </Box>
                            
                        </Tooltip>
                    </Stack>
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