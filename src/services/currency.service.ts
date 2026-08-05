import * as XLSX from 'xlsx';

export class CurrencyService {
    private static DEFAULT_RATE = 300;

    // Primary: open.er-api.com — no key required, reliable TLS
    private static PRIMARY_URL = 'https://open.er-api.com/v6/latest/USD';
    // Secondary: Frankfurter (ECB data mirror) — also no key, stable TLS
    private static SECONDARY_URL = 'https://api.frankfurter.app/latest?from=USD&to=LKR';
    // Central Bank of Sri Lanka Official Daily Rates Sheet
    private static CBSL_EXCEL_URL = 'https://www.cbsl.gov.lk/sites/default/files/cbslweb_documents/statistics/sheets/IF_Buying_Selling_Exchange_Rates.xlsx';

    /**
     * Fetches official Sri Lanka Bank USD TT Buying Rate (Telegraphic Transfer Buying Rate).
     * Tries Central Bank of Sri Lanka (CBSL) daily excel rates first.
     * Falls back to open market rate adjusted by standard bank TT buying margin (~1.5% below mid-market).
     */
    static async getSriLankaBankBuyingRate(): Promise<number> {
        try {
            const res = await fetch(this.CBSL_EXCEL_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                next: { revalidate: 3600 }
            });

            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const wb = XLSX.read(buffer, { type: 'buffer' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Scan rows from bottom up to find the latest valid USD TT Buying rate (Col Index 2)
                for (let i = rows.length - 1; i >= 0; i--) {
                    const row = rows[i];
                    if (Array.isArray(row) && typeof row[1] === 'number' && typeof row[2] === 'number' && row[2] > 50 && row[2] < 1000) {
                        return row[2];
                    }
                }
            }
        } catch (err: any) {
            console.warn('[CurrencyService] Failed to fetch CBSL Excel rates:', err?.message || err);
        }

        // Fallback: Get open market mid-rate and adjust for bank buying spread (~1.5%)
        const midRate = await this.getUSDTOLKR();
        return Number((midRate * 0.985).toFixed(2));
    }

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

