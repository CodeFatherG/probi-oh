import { CurrencyApi, ExchangeRate } from './CurrencyApi';

const currencyApi = new CurrencyApi({
    apiKey: "fca_live_rPKjqz8wF6jy12rL9NUo4F6icKmcw4RLuQJh0sw1"
});

const baseCurrency: string = 'USD';

interface rates_store {
    fetch_stamp: number;
    rates: Record<string, ExchangeRate>
}

const fetchRates = async (): Promise<Record<string, ExchangeRate>> => {
    const response = await currencyApi.getLatestRates(baseCurrency);
    const rates: Record<string, ExchangeRate> = {};

    for (const currency in response) {
        rates[currency] = {
            from: baseCurrency,
            to: currency,
            rate: response[currency].rate,
            timestamp: response[currency].timestamp
        };
    }

    const store: rates_store = {
        fetch_stamp: Date.now(),
        rates
    };

    localStorage.setItem('currency-rates', JSON.stringify(store));

    console.log('Currency rates', store);

    return rates;
}

// Load from local storage or fetch and save if not from the last 24 hours
const getRates = async (): Promise<Record<string, ExchangeRate>> => {
    const rates = localStorage.getItem('currency-rates');
    if (rates) {
        const store: rates_store = JSON.parse(rates);
        // 24 hours
        const hour = 60 * 60 * 1000;
        const age = Date.now() - store.fetch_stamp;
        if (age < (24 * hour)) {
            return store.rates;
        }

        console.log('Currency rates are older than 24 hours, fetching new rates');
    }

    return await fetchRates();
};

/**
 * Request a list of available currencies
 * @returns Promise<string[]>
 */
export async function getCurrencies(): Promise<string[]> {
    const rates = await getRates();
    return Object.keys(rates);
}

/**
 * Convert an amount from a currency to the base currency (USD)
 * @param currency The currency code
 * @returns 
 */
async function normaliseCurrency(currency: string, amount: number): Promise<number> {
    const rates = await getRates();
    const rate = rates[currency].rate;
    return amount / rate;
}

/**
 * Convert an amount from one currency to another
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @param amount The amount to convert
 * @returns The converted amount
 */
export async function convertCurrency(fromCurrency: string, toCurrency: string, amount: number): Promise<number> {
    const rates = await getRates();

    if (!rates[fromCurrency] || !rates[toCurrency]) {
        throw new Error(`Currency not found: ${fromCurrency} or ${toCurrency}`);
    }

    amount = await normaliseCurrency(fromCurrency, amount);

    return amount * rates[toCurrency].rate;
}

export function getCurrencySymbol(currencyCode: string): string {
    try {
        // Create a number formatter for the currency
        const formatter = new Intl.NumberFormat('en', {
            style: 'currency',
            currency: currencyCode,
            currencyDisplay: 'narrowSymbol'
        });

        // Format 0 and extract just the symbol
        const formatted = formatter.format(0);
        // Remove the number and any spaces/non-symbol characters
        const symbol = formatted.replace(/[\d\s.,]/g, '');

        return symbol;
    } catch (error) {
        throw new Error(`Invalid currency code: ${currencyCode}`);
    }
  }
