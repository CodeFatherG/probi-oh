import { Box, BoxProps, CircularProgress, Divider, Paper, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { CardAnalytics } from "types/build";
import { CardInformation } from '@/types/card-information';
import { getCard } from "@/api/ygopro/card-api";
import CardImage from "@/shared/components/CardImage";
import CardHeader from "./CardHeader";
import CardSummary from "./CardSummary";
import CardData from "./CardData";

interface CardAnalyticsProps extends Omit<BoxProps, 'component'> {
    analytics: CardAnalytics;
}

export default function AnalyticCard({analytics, ...props}: CardAnalyticsProps) {
    const [cardInformation, setCardInformation] = React.useState<CardInformation | null>(null);

    useEffect(() => {
        if (analytics) {
            // Fetch card information
            const fetchCard = async (cardName: string) => {
                const cardInfo = await getCard(cardName);
                setCardInformation(cardInfo);
            };

            fetchCard(analytics.cardName);
        } else {
            setCardInformation(null);
        }
    }, [analytics]);

    return (
        <Box display={"flex"} {...props}>
            <Paper elevation={3} sx={{ p: 2, flexGrow: 1 }}>
                <Box 
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                        flexGrow: 1,
                        minWidth: '100%',
                        minHeight: '100%',
                    }}
                >
                    {cardInformation === null ? (
                        <CircularProgress />
                    ) : (
                        <Box 
                            display="flex"
                            flexDirection="row"
                            width="100%"
                            overflow="hidden"
                        >
                            <CardImage 
                                cardId={cardInformation.id}
                                sx={{ 
                                    flexShrink: 1,
                                    minWidth: '100px',
                                    width: '100%',
                                    maxWidth: '350px',
                                    marginRight: 2,
                                    height: 'fit-content',
                                }}
                            />
                            <Box 
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                sx={{ 
                                    flexGrow: 1,
                                    overflow: 'hidden'
                                }}
                            >
                                <Typography 
                                    variant="h5" 
                                    mb={2}
                                    sx={{ 
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    {cardInformation?.name}
                                </Typography>
                                <CardHeader 
                                    cardInformation={cardInformation}
                                />
                                <CardSummary 
                                    cardInformation={cardInformation}
                                />
                                <Divider sx={{ width: '100%', my: 2 }} />
                                <CardData 
                                    cardData={analytics}
                                    alignSelf={'flex-start'}
                                />
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}