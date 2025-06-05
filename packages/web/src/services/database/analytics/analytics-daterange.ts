export interface AnalyticsDateRange {
    startDate: string;
    endDate: string;
}

function isValidDate(dateString: string): void {
    // Check the format is YYYY-MM-DD hh:mm:ss
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!regex.test(dateString)) {
        throw new Error(`${dateString} is not a valid date format`);
    }
}

export function isDateRangeValid(dateRange: AnalyticsDateRange): boolean {
    const { startDate, endDate } = dateRange;

    isValidDate(startDate);
    isValidDate(endDate);

    return true;
}
