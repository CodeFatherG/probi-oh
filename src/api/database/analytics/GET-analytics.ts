import { CardAnalytics } from "@probi-oh/types";
import { AnalyticsDateRange, isDateRangeValid } from "./analytics-daterange";

export interface AnalyticsSummary {
    totalSimulations: number,
    uniqueUsers: number,
    avgSuccessRate: number
}

function fixDateFormat(dateString: string): string {
    // Check if format is YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(dateString)) {
        // We need to add hh:mm:ss to the date string
        dateString += " 00:00:00";
    }

    return dateString;
}

export async function getAnalyticsSummary(dates: AnalyticsDateRange): Promise<AnalyticsSummary> {
    if (!dates) {
        throw new Error('Invalid date range');
    }

    // Fix date format to YYYY-MM-DD hh:mm:ss
    const formattedStartDate = fixDateFormat(dates.startDate);
    const formattedEndDate = fixDateFormat(dates.endDate);

    if (!isDateRangeValid({ startDate: formattedStartDate, endDate: formattedEndDate })) {
        throw new Error('Invalid date range');
    }
    
    const apiUrl = encodeURI(`${process.env.API_URL}/api/analytics/summary?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to get analytics summary data: ${response.statusText}`);
    }

    try {
        return await response.json();
    } catch (error) {
        console.error('Error validating summary data:', error);
        return {
            totalSimulations: 0,
            uniqueUsers: 0,
            avgSuccessRate: 0
        };
    }
}

function parseCardAnalytics(jsonData: string | object): Record<string, CardAnalytics> {
    try {
        // If jsonData is already an object, use it directly
        if (typeof jsonData === 'object' && jsonData !== null) {
            return jsonData as Record<string, CardAnalytics>;
        } else {
            throw new Error('Invalid JSON data');
        }
    } catch (error) {
        console.error('Error parsing card analytics data:', error);
        // Return empty map on error to prevent application crash
        return {};
    }
}

export async function getAnalyticsAllCards(dates: AnalyticsDateRange): Promise<Record<string, CardAnalytics>> {
    if (!dates) {
        throw new Error('Invalid date range');
    }

    // Fix date format to YYYY-MM-DD hh:mm:ss
    dates.startDate = fixDateFormat(dates.startDate);
    dates.endDate = fixDateFormat(dates.endDate);

    if (!isDateRangeValid(dates)) {
        throw new Error('Invalid date range');
    }

    const apiUrl = encodeURI(`${process.env.API_URL}/api/analytics/card/all?startDate=${dates.startDate}&endDate=${dates.endDate}`);
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to get analytics cards data: ${response.statusText}`);
    }

    try {
        return parseCardAnalytics(await response.json());
    } catch (error) {
        console.error('Error validating card analytics data:', error);
        return {};
    }
}

export async function getAnalyticsCard(cardName: string, dates: AnalyticsDateRange): Promise<CardAnalytics | undefined> {
    if (!dates) {
        throw new Error('Invalid date range');
    }

    if (!cardName) {
        throw new Error('Card name is required');
    }

    // Fix date format to YYYY-MM-DD hh:mm:ss
    dates.startDate = fixDateFormat(dates.startDate);
    dates.endDate = fixDateFormat(dates.endDate);

    if (!isDateRangeValid(dates)) {
        throw new Error('Invalid date range');
    }
    
    const apiUrl = `${process.env.API_URL}/api/analytics/card/` +
                    `?name=${encodeURIComponent(cardName)}` +
                    `&startDate=${encodeURIComponent(dates.startDate)}` +
                    `&endDate=${encodeURIComponent(dates.endDate)}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to get analytics cards data: ${response.statusText}`);
    }

    try {
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error validating card analytics data:', error);
        return undefined;
    }
}
