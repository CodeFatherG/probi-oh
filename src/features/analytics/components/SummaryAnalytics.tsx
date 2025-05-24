import React, { useEffect, useState } from 'react';
import { AnalyticsDateRange } from '../../../api/database/analytics/analytics-daterange';
import dayjs from 'dayjs';
import { AnalyticsSummary, getAnalyticsSummary } from '@/api/database/analytics/GET-analytics';
import { Typography, TypographyProps } from '@mui/material';

interface SummaryAnalyticsProps extends TypographyProps{
    dateRange: AnalyticsDateRange;
}

const getDateString = (dates: AnalyticsDateRange) => {
    const startDate = dayjs(dates.startDate).format("YYYY-MM-DD");
    const endDate = dayjs(dates.endDate).format("YYYY-MM-DD");

    // string should be the smallest format that makes sense (hours, days, months, years)
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diffInDays = end.diff(start, "day", true);
    const diffInWeeks = end.diff(start, "week", true);
    const diffInMonths = end.diff(start, "month", true);
    const diffInYears = end.diff(start, "year", true);

    if (diffInYears >= 1) {
        // if there is a decimal part, round it to 1 decimal place
        // if there is no decimal part, round it to the nearest integer
        const roundedYears = diffInYears % 1 === 0 ? Math.round(diffInYears) : diffInYears.toFixed(1);

        return `${roundedYears} year${diffInYears > 1 ? "s" : ""}`;
    } else if (diffInMonths >= 1) {
        // if there is a decimal part, round it to 1 decimal place
        // if there is no decimal part, round it to the nearest integer
        const roundedMonths = diffInMonths % 1 === 0 ? Math.round(diffInMonths) : diffInMonths.toFixed(1);

        return `${roundedMonths} month${diffInMonths > 1 ? "s" : ""}`;
    } else if (diffInWeeks >= 1) {
        // if there is a decimal part, round it to 1 decimal place
        // if there is no decimal part, round it to the nearest integer
        const roundedWeeks = diffInWeeks % 1 === 0 ? Math.round(diffInWeeks) : diffInWeeks.toFixed(1);

        return `${roundedWeeks} week${diffInWeeks > 1 ? "s" : ""}`;
    } else {
        // if there is a decimal part, round it to 1 decimal place
        // if there is no decimal part, round it to the nearest integer
        const roundedDays = diffInDays % 1 === 0 ? Math.round(diffInDays) : diffInDays.toFixed(1);

        return `${roundedDays} day${diffInDays > 1 ? "s" : ""}`;
    }
};


export default function SummaryAnalytics({ dateRange, ...props }: SummaryAnalyticsProps) {
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const start = dateRange.startDate;
                const end = dateRange.endDate;
                const summaryData = await getAnalyticsSummary({
                    startDate: start,
                    endDate: end,
                });
                setSummary(summaryData);
            } catch (error) {
                console.error("Error fetching summary:", error);
                setSummary(null);
            }
        };
        console.log("Fetching summary for date range:", dateRange);
        fetchSummary();
    }, [dateRange]);

    return (
        <>
            {(summary) && (
                <Typography gutterBottom {...props}>
                    {summary.uniqueUsers} users have run {summary.totalSimulations} simulations in the last {getDateString(dateRange)}!
                </Typography>
            )}
        </>
    );
};