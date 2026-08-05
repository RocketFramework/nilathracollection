const https = require('https');
const XLSX = require('xlsx');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', err => reject(err));
  });
}

async function run() {
  try {
    const buf = await fetchBuffer('https://www.cbsl.gov.lk/sites/default/files/cbslweb_documents/statistics/sheets/IF_Buying_Selling_Exchange_Rates.xlsx');
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log("Top 10 rows:");
    for (let i = 0; i < 10; i++) {
      console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
