import React, { useEffect, useState } from 'react';
import { CardAnalytics } from '@probi-oh/types';
import { 
    Box, 
    BoxProps, 
    List, 
    ListItem, 
    ListItemText, 
    Typography, 
    Paper,
    Divider,
    Chip
} from '@mui/material';

interface CardDataProps extends BoxProps {
    cardData: CardAnalytics | null;
}

export default function CardData({ cardData, ...props }: CardDataProps) {
    const [usedList, setUsedList] = useState<Record<string, number>>({});

    useEffect(() => {
        if (cardData?.usedWith) {
            const sortedUsedWith = Object.entries(cardData.usedWith)
                .sort(([, a], [, b]) => b - a);
            setUsedList(Object.fromEntries(sortedUsedWith));
        } else {
            setUsedList({});
        }
    }, [cardData]);

    if (!cardData) {
        return null;
    }

    const hasUsedWithData = Object.keys(usedList).length > 0;
    const hasQtyStats = Object.keys(cardData.qtyStats || {}).length > 0;

    return (
        <Box display="flex" width='100%' gap={2} {...props}>
            <Paper 
                elevation={1} 
                sx={{ 
                    p: 2, 
                    flex: 1,
                    minWidth: 0
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Card Statistics
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Simulated:</strong> {cardData.simulationIds.length} times
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                        <strong>Average Success Rate:</strong> {(cardData.averageSuccessRate * 100).toFixed(2)}%
                    </Typography>
                    
                    {hasQtyStats && (
                        <>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" gutterBottom>
                                Usage:
                            </Typography>
                                <List 
                                    sx={{ 
                                        flex: 1,
                                        overflow: 'auto',
                                        px: 1
                                    }}
                                    dense
                                >                    
                                {Object.entries(cardData.qtyStats).map(([qty, count], index) => (
                                    <ListItem key={`${qty}-${count}`} divider={index < Object.keys(cardData.qtyStats).length - 1}>
                                        <ListItemText
                                            primary={`${qty}: ${count}`}
                                            primaryTypographyProps={{
                                                variant: 'body2',
                                                noWrap: true,
                                                title: `${qty}: ${count}`
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                </Box>
            </Paper>

            {hasUsedWithData && (
                <Paper 
                    elevation={1} 
                    sx={{ 
                        flex: 1,
                        minWidth: 0,
                        maxHeight: 400,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Box sx={{ p: 2, pb: 1 }}>
                        <Typography variant="h6">
                            Used With ({Object.keys(usedList).length} cards)
                        </Typography>
                    </Box>
                    
                    <List 
                        sx={{ 
                            flex: 1,
                            overflow: 'auto',
                            px: 1
                        }}
                        dense
                    >
                        {Object.entries(usedList).map(([cardName, count], index) => (
                            <ListItem key={`${cardName}-${index}`} divider={index < Object.keys(usedList).length - 1}>
                                <ListItemText
                                    primary={cardName}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        noWrap: true,
                                        title: cardName
                                    }}
                                />
                                <Chip 
                                    label={count} 
                                    size="small" 
                                    color="secondary"
                                    sx={{ ml: 1 }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
}