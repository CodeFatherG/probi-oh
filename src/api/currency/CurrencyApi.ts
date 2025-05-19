import Freecurrency from '@everapi/freecurrencyapi-js';

// Types
export interface CurrencyApiConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

export interface CurrencyData {
  symbol: string;
  name: string;
  symbol_native: string;
  decimal_digits: number;
  rounding: number;
  code: string;
  name_plural: string;
}

export class CurrencyApiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'CurrencyApiError';
  }
}

export class CurrencyApi {
  private client: Freecurrency;

  constructor(config: CurrencyApiConfig) {
    if (!config.apiKey) {
      throw new CurrencyApiError('API key is required');
    }

    this.client = new Freecurrency(config.apiKey, {
      baseUrl: config.baseUrl,
      timeout: config.timeout || 10000
    });
  }

  /**
   * Get latest exchange rates for a base currency
   * @param baseCurrency The base currency code (e.g., 'USD')
   * @param targetCurrencies Array of target currency codes
   * @returns Promise<Record<string, ExchangeRate>>
   */
  async getLatestRates(
    baseCurrency: string = 'USD'
  ): Promise<Record<string, ExchangeRate>> {
    try {
      const response = await this.client.latest({
        base_currency: baseCurrency
      });

      const rates: Record<string, ExchangeRate> = {};
      for (const [currency, rate] of Object.entries(response.data)) {
        rates[currency] = {
          from: baseCurrency,
          to: currency,
          rate: rate as number,
          timestamp: Date.now()
        };
      }

      return rates;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Convert an amount from one currency to another
   * @param amount Amount to convert
   * @param fromCurrency Source currency code
   * @param toCurrency Target currency code
   * @returns Promise<number>
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    try {
      const response = await this.client.latest({
        base_currency: fromCurrency,
        currencies: [toCurrency]
      });

      const rate = response.data[toCurrency];
      if (!rate) {
        throw new CurrencyApiError(`Exchange rate not found for ${toCurrency}`);
      }

      return amount * (rate as number);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get historical exchange rates for a specific date
   * @param date Date in YYYY-MM-DD format
   * @param baseCurrency Base currency code
   * @param targetCurrencies Array of target currency codes
   * @returns Promise<Record<string, ExchangeRate>>
   */
  async getHistoricalRates(
    date: string,
    baseCurrency: string,
    targetCurrencies?: string[]
  ): Promise<Record<string, ExchangeRate>> {
    try {
      const response = await this.client.historical({
        date,
        base_currency: baseCurrency,
        currencies: targetCurrencies
      });

      const rates: Record<string, ExchangeRate> = {};
      for (const [currency, rate] of Object.entries(response.data)) {
        rates[currency] = {
          from: baseCurrency,
          to: currency,
          rate: rate as number,
          timestamp: new Date(date).getTime()
        };
      }

      return rates;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get currency status (available currencies)
   * @returns Promise<Record<string, CurrencyData>>
   */
  async getCurrencies(): Promise<Record<string, CurrencyData>> {
    try {
      const response = await this.client.currencies();
      return response.data as Record<string, CurrencyData>;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleError(error: any): CurrencyApiError {
    if (error instanceof CurrencyApiError) {
      return error;
    }

    const message = error.message || 'An unknown error occurred';
    const code = error.code || 'UNKNOWN_ERROR';

    return new CurrencyApiError(message, code);
  }
}

// Export default instance
export default CurrencyApi;