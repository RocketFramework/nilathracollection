export class CurrencyService {
    private static DEFAULT_RATE = 300;

    // Primary: open.er-api.com — no key required, reliable TLS
    private static PRIMARY_URL = 'https://open.er-api.com/v6/latest/USD';
    // Secondary: Frankfurter (ECB data mirror) — also no key, stable TLS
    private static SECONDARY_URL = 'https://api.frankfurter.app/latest?from=USD&to=LKR';

    /**
     * Fetches current USD to LKR exchange rate.
     * Tries PRIMARY then SECONDARY API before falling back to DEFAULT_RATE (300).
     */
    static async getUSDTOLKR(): Promise<number> {
        // --- Try primary ---
        try {
            const res = await fetch(this.PRIMARY_URL, { next: { revalidate: 3600 } });
            if (res.ok) {
                const data = await res.json();
                const rate = data?.rates?.LKR;
                if (typeof rate === 'number' && rate > 0) return rate;
            }
        } catch {
            // fall through to secondary
        }

        // --- Try secondary ---
        try {
            const res = await fetch(this.SECONDARY_URL, { next: { revalidate: 3600 } });
            if (res.ok) {
                const data = await res.json();
                const rate = data?.rates?.LKR;
                if (typeof rate === 'number' && rate > 0) return rate;
            }
        } catch {
            // fall through to default
        }

        console.warn('[CurrencyService] All exchange rate APIs failed — using fallback rate of', this.DEFAULT_RATE);
        return this.DEFAULT_RATE;
    }
}
