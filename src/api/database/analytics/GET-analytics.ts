import { CardAnalytics } from "@probi-oh/types";
import { AnalyticsDateRange, isDateRangeValid } from "./analytics-daterange";

export interface AnalyticsSummary {
    totalSimulations: number,
    uniqueUsers: number,
    avgSuccessRate: number
}

export async function getAnalyticsSummary(dates: AnalyticsDateRange): Promise<AnalyticsSummary> {
    if (!dates || !isDateRangeValid(dates)) {
        throw new Error('Invalid date range');
    }
    
    const apiUrl = encodeURI(`${process.env.API_URL}/api/analytics/summary?startDate=${dates.startDate}&endDate=${dates.endDate}`);
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to get analytics summary data: ${response.statusText}`);
    }

    try {
        const data: AnalyticsSummary[] = await response.json();

        if (data.length === 0) {
            console.warn('No summary data found');
            return {
                totalSimulations: 0,
                uniqueUsers: 0,
                avgSuccessRate: 0
            };
        }

        return data[0];
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
    if (!dates || !isDateRangeValid(dates)) {
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
    if (!dates || !isDateRangeValid(dates)) {
        throw new Error('Invalid date range');
    }

    if (!cardName) {
        throw new Error('Card name is required');
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
