import { getCard } from "@ygo/card-api";
import { CardInformation } from "./card-information";
import { getSettings } from "@/components/Settings/settings";
import { convertCurrency } from "@/currency/currency";

const sourceCurrency: Record<string, string> = {
    'cardmarket': "EUR",
    'coolstuffinc': "USD",
    'tcgplayer': "USD",
    'ebay': "USD",
    'amazon': "USD",
};

function sortPrices(prices: Record<string, number>): Record<string, number> {
    return Object.fromEntries(Object.entries(prices).sort(([,a],[,b]) => a - b));
}

async function convertPrices(prices: Record<string, string>): Promise<Record<string, number>> {
    const convertedEntries = await Promise.all(
        Object.entries(prices).map(async ([source, price]) => {
            source = source.split('_')[0];

            if (!sourceCurrency[source]) {
                return [source, price];
            }

            const priceNumber: number = parseFloat(price);

            const converted = await convertCurrency(
                sourceCurrency[source], 
                getSettings().selectedCurrency,
                priceNumber
            );
            return [source, converted];
        })
    );

    return Object.fromEntries(convertedEntries);
}

export async function getCardPrice(idOrName: string | number): Promise<Record<string, number>>  {
    try {
        const info: CardInformation | null = await getCard(idOrName);

        if (info && info.card_prices && info.card_prices.length > 0) {
            if (info.card_prices.length !== 1) {
                console.warn(`Multiple prices found for card ${idOrName}`);
            }

            const prices = sortPrices(
                Object.fromEntries(
                    Object.entries(
                        await convertPrices(info.card_prices[0])
                    ).filter(([, price]) => price > 0 && !isNaN(price))
                )
            );
            console.log(`Final prices for card ${idOrName}:`, prices);
            return prices;
        } else {
            throw new Error(`No card found with ID or name ${idOrName}`);
        }
    } catch (error) {
        console.error('Error fetching card price:', error);
    }

    return {};
}

async function getStatisticalList(prices: Record<string, number>, irqTh: number): Promise<Record<string, number>> {
    if (prices.length === 0) {
        return {};
    }
    
    // Sort by the value of the Record
    const sortedPrices = sortPrices(prices);

    // Calculate quartiles
    const q1Index = Math.floor(Object.keys(sortedPrices).length * 0.25);
    const q3Index = Math.floor(Object.keys(sortedPrices).length * 0.75);
    
    const q1 = Object.values(sortedPrices)[q1Index];
    const q3 = Object.values(sortedPrices)[q3Index];
    
    // Calculate IQR and bounds
    const iqr = q3 - q1;
    const lowerBound = q1 - (iqr * irqTh);
    const upperBound = q3 + (iqr * irqTh);
    
    const includedPrices: Record<string, number> = {};

    // Find the prices that are within the bounds
    Object.entries(sortedPrices).forEach(([source, price]) => {
        if (price >= lowerBound && price <= upperBound) {
            includedPrices[source] = price;
        }
    });

    return includedPrices;
}

/**
 * Get the average price of a card, excluding outliers.
 * @param idOrName The card ID or name
 * @param irqTh The threshold for excluding outliers
 * @returns The average price of the card
 */
export async function getAverageCardPrice(idOrName: string | number, irqTh: number = 1.5): Promise<number> {
    const prices = await getCardPrice(idOrName);
    const includedPrices = await getStatisticalList(prices, irqTh);

    return (Object.values(includedPrices).reduce((a, b) => a + b, 0) / Object.keys(includedPrices).length);
}

export async function getLowestCardPrice(idOrName: string | number, irqTh: number = 1.5): Promise<number> {
    const prices = await getCardPrice(idOrName);
    const includedPrices = await getStatisticalList(prices, irqTh);

    return Math.min(...Object.values(includedPrices));
}

export async function getHighestCardPrice(idOrName: string | number, irqTh: number = 1.5): Promise<number> {
    const prices = await getCardPrice(idOrName);
    const includedPrices = await getStatisticalList(prices, irqTh);

    return Math.max(...Object.values(includedPrices));
}
