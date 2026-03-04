export class CurrencyService {
    private static DEFAULT_RATE = 300;
    private static API_URL = 'https://api.budjet.org/fiat/USD/LKR';

    /**
     * Fetches current USD to LKR exchange rate.
     * Falls back to 300 if API fails.
     */
    static async getUSDTOLKR(): Promise<number> {
        try {
            const response = await fetch(this.API_URL, {
                next: { revalidate: 3600 } // Cache for 1 hour
            });

            if (!response.ok) throw new Error('Failed to fetch exchange rate');

            const data = await response.json();
            const rate = data.conversion_rate || data.rate || data.USD_LKR || data.value;

            if (typeof rate === 'number' && rate > 0) {
                return rate;
            }

            return this.DEFAULT_RATE;
        } catch (error) {
            console.error("Exchange rate fetch failed, using fallback:", error);
            return this.DEFAULT_RATE;
        }
    }
}
