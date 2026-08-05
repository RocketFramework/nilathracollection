const XLSX = require('xlsx');

async function getSriLankaBankBuyingRate() {
  try {
    const res = await fetch('https://www.cbsl.gov.lk/sites/default/files/cbslweb_documents/statistics/sheets/IF_Buying_Selling_Exchange_Rates.xlsx', {
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
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Scan rows from bottom up to find the latest row with a numeric Excel date (col 1) and USD Buying rate (col 2)
      for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i];
        if (Array.isArray(row) && typeof row[1] === 'number' && typeof row[2] === 'number' && row[2] > 50 && row[2] < 1000) {
          console.log(`Found CBSL Buying Rate on row ${i} (Excel Date: ${row[1]}):`, row[2]);
          return row[2];
        }
      }
    }
  } catch (err) {
    console.warn("[CurrencyService] Failed to fetch CBSL Excel rates:", err.message);
  }

  console.log("Falling back to open market rate - 1.5% margin");
  return 300;
}

getSriLankaBankBuyingRate();
