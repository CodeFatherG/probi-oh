import React, { useEffect, useState } from 'react';
import '@/styles/app.css';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { Box, Stack } from '@mui/material';
import Logo from '@shared/components/Logo';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AnalyticsSidebar from '@/features/analytics/components/AnalyticsSidebar';
import { CardAnalytics } from '@probi-oh/types';
import { getAnalyticsAllCards, getAnalyticsCard } from '@database/analytics/GET-analytics';
import dayjs, { Dayjs } from 'dayjs';
import AnalyticCard from '@/features/analytics/components/AnalyticCard';
import SummaryAnalytics from '@/features/analytics/components/SummaryAnalytics';
import { useSearchParams } from 'react-router-dom';
import 'dayjs/locale/en-au';

function getDateString(date: Dayjs): string {
    return date.format("YYYY-MM-DD");
}

function getDayjs(date: string): Dayjs | null {
    try {
        return dayjs(date);
    } catch (error) {
        console.error(`Error parsing date: ${date}`, error);
        return null;
    }
}

export default function Analytics() {
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().subtract(1, "month"));
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [cardOptions, setCardOptions] = useState<string[]>([]);
    const [cardAnalytics, setCardAnalytics] = useState<CardAnalytics | undefined>(undefined);
    const [searchParams, setSearchParams] = useSearchParams();

    const getAnalyticsDateRange = () => {
        const end = (!endDate) ? dayjs().format("YYYY-MM-DD") : endDate.format("YYYY-MM-DD");
        const start = (!startDate) ? dayjs(end).subtract(7, "day").format("YYYY-MM-DD") : startDate.format("YYYY-MM-DD");
            
        return{
            startDate: end, 
            endDate: start
        };
    };

    useEffect(() => {
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        const card = searchParams.get('card');
        if (start) {
            setStartDate(getDayjs(start));
        }
        if (end) {
            setEndDate(getDayjs(end));
        }
        if (card) {
            setSelectedCard(card);
        }
    }, []);

    useEffect(() => {
        // Create an async function inside the effect
        const fetchCardAnalytics = async () => {
            try {
                const allCards = await getAnalyticsAllCards(getAnalyticsDateRange());
                console.log("Fetched all card analytics:", allCards);
                setCardOptions(allCards);
            }
            catch (error) {
                setCardOptions([]);
            }
        };
        
        // Call the async function
        fetchCardAnalytics();
    }, [startDate, endDate]);

    useEffect(() => {
        if (!selectedCard) {
            setCardAnalytics(undefined);
            return;
        }

        const fetchCardAnalytics = async () => {
            try {
                const analytics = await getAnalyticsCard(
                    selectedCard || "",
                    getAnalyticsDateRange()
                );
                setCardAnalytics(analytics);
            } catch (error) {
                setCardAnalytics(undefined);
            }
        };

        fetchCardAnalytics();
    }, [startDate, endDate, selectedCard]);

    const handleFilterAnalytics = (filters: {
        startDate: Dayjs | null;
        endDate: Dayjs | null;
        selectedCard?: string;
    }) => {
        setStartDate(filters.startDate);
        setEndDate(filters.endDate);
        setSelectedCard(filters.selectedCard || null);
        
        // Check if the filter is changed and if it is update the url
        const params = searchParams;
        if (filters.startDate) {
            // has it changed?
            if (filters.startDate.format("YYYY-MM-DD") !== getDateString(startDate || dayjs())) {
                
                params.set('start', filters.startDate.format("YYYY-MM-DD"));
            }
        }
        if (filters.endDate) {
            // has it changed?
            if (filters.endDate.format("YYYY-MM-DD") !== getDateString(endDate || dayjs())) {
                params.set('end', filters.endDate.format("YYYY-MM-DD"));
            }
        }
        if (filters.selectedCard) {
            // has it changed?
            if (!filters.selectedCard) {
                params.delete('card');
            }
            else if (filters.selectedCard !== selectedCard) {
                params.set('card', filters.selectedCard);
            }
        }

        setSearchParams(params);
    }

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
                            dateRange={getAnalyticsDateRange()}
                            variant='h6'                   
                        />
                    )}
                    
                </Stack>
                <Box display='flex' width='100%' height='100%' flexGrow='1'>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'en-au'}>
                        <AnalyticsSidebar 
                            cardOptions={cardOptions}
                            startDate={startDate}
                            endDate={endDate}
                            card={selectedCard}
                            onFilterAnalytics={handleFilterAnalytics} 
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
