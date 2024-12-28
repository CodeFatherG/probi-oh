// freecurrencyapi.d.ts
declare module '@everapi/freecurrencyapi-js' {
  interface ClientOptions {
    baseUrl?: string;
    timeout?: number;
  }

  interface LatestOptions {
    base_currency?: string;
    currencies?: string[];
  }

  interface HistoricalOptions extends LatestOptions {
    date: string;
  }

  interface ApiResponse {
    data: Record<string, unknown>;
  }

  class Freecurrency {
    constructor(apiKey: string, options?: ClientOptions);
    latest(options?: LatestOptions): Promise<ApiResponse>;
    historical(options: HistoricalOptions): Promise<ApiResponse>;
    currencies(): Promise<ApiResponse>;
  }

  export default Freecurrency;
}