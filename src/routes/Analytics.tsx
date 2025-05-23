import React, { useEffect } from 'react';
import '@/styles/app.css';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { Box, Stack } from '@mui/material';
import Logo from '@shared/components/Logo';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AnalyticsSidebar from '@/features/analytics/components/AnalyticsSidebar';
import { CardAnalytics } from '@probi-oh/types';
import { getAnalyticsAllCards, getAnalyticsCard } from '@api/database/analytics/GET-analytics';
import dayjs from 'dayjs';
import AnalyticCard from '@/features/analytics/components/AnalyticCard';
import SummaryAnalytics from '@/features/analytics/components/SummaryAnalytics';

export default function Analytics() {
    const [startDate, setStartDate] = React.useState<string | null>(null);
    const [endDate, setEndDate] = React.useState<string | null>(null);
    const [selectedCard, setSelectedCard] = React.useState<string | null>(null);
    const [allCardAnalytics, setAllCardAnalytics] = React.useState<Record<string, CardAnalytics>>({});
    const [cardOptions, setCardOptions] = React.useState<string[]>([]);
    const [cardAnalytics, setCardAnalytics] = React.useState<CardAnalytics | undefined>(undefined);

    useEffect(() => {
        const start = (!startDate) ? dayjs().subtract(7, "day").format("YYYY-MM-DD HH:mm:ss") : startDate;
        const end = (!endDate) ? dayjs().format("YYYY-MM-DD HH:mm:ss") : endDate;
        
        // Create an async function inside the effect
        const fetchCardAnalytics = async () => {
            const analytics = await getAnalyticsAllCards({
                startDate: start, 
                endDate: end
            });
            setAllCardAnalytics(analytics);
        };
        
        // Call the async function
        fetchCardAnalytics();
    }, [startDate, endDate]);

    useEffect(() => {
        // sort card analytics by simulationIds length
        // and create a list of unique card names
        const options = Object.entries(allCardAnalytics)
            .sort(([, a], [, b]) => b.simulationIds.length - a.simulationIds.length)
            .map(([cardName]) => cardName)
            .filter((cardName) => allCardAnalytics[cardName].simulationIds.length > 0);
        setCardOptions(options);
    }, [allCardAnalytics]);

    useEffect(() => {
        if (!selectedCard) {
            setCardAnalytics(undefined);
            return;
        }

        const start = (!startDate) ? dayjs().subtract(7, "day").format("YYYY-MM-DD HH:mm:ss") : startDate;
        const end = (!endDate) ? dayjs().format("YYYY-MM-DD HH:mm:ss") : endDate;
    

        const fetchCardAnalytics = async () => {
            const analytics = await getAnalyticsCard(
                selectedCard || "",
                {
                    startDate: start, 
                    endDate: end
                }
            );
            console.log(analytics);
            setCardAnalytics(analytics);
        };

        fetchCardAnalytics();
    }, [startDate, endDate, selectedCard]);

    return (
        <ErrorBoundary>
            <Box className="app">
                <Stack
                    alignItems={'center'}
                >
                    <Logo 
                        sx={{
                            width: {
                                xs: 100,
                                sm: 150,
                                md: 280,
                            },
                            height: 'auto',
                            display: 'block',
                            margin: 'auto',
                            pb: 2,
                        }}
                    />
                    {startDate && endDate && (
                        <SummaryAnalytics 
                            dateRange={{
                                startDate: startDate,
                                endDate: endDate,
                            }}
                            variant='h6'                   
                        />
                    )}
                    
                </Stack>
                <Box display='flex' width='100%' height='100%' flexGrow='1'>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <AnalyticsSidebar 
                            cardOptions={cardOptions} 
                            onRunAnalysis={
                                (filters: {
                                    startDate: string;
                                    endDate: string;
                                    selectedCard?: string;
                                }) => {
                                    setStartDate(filters.startDate);
                                    setEndDate(filters.endDate);
                                    setSelectedCard(filters.selectedCard || null);
                            }} 
                        />
                    </LocalizationProvider>
                    {cardAnalytics && (
                        <AnalyticCard
                            analytics={cardAnalytics}
                            sx = {{
                                flexGrow: 1,
                                marginLeft: 3,
                                overflow: 'hidden',
                            }}
                        />
                    )}
                </Box>
            </Box>
        </ErrorBoundary>
    );
}
