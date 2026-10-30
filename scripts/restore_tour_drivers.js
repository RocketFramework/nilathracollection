// Restores tour_itinerary_drivers rows for ONE tour from a backup export.
//
// Usage:
//   node scripts/restore_tour_drivers.js <backup.json|backup.csv> <tourId> [--apply]
//
// Without --apply it is a dry run (prints what would be inserted).
// Only rows whose tour_id matches <tourId> are used. Rows are inserted only if the tour
// currently has NO driver rows (it never overwrites existing data). New FX columns are
// not part of an old backup and are left empty.
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const [file, tourId, flag] = process.argv.slice(2);
if (!file || !tourId) {
    console.error('Usage: node scripts/restore_tour_drivers.js <backup.json|backup.csv> <tourId> [--apply]');
    process.exit(1);
}

const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
    const i = l.indexOf('=');
    if (i > 0 && !l.trim().startsWith('#')) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function parseCsv(text) {
    const rows = [];
    let cur = [], field = '', q = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (q) {
            if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (c === '"') q = false;
            else field += c;
        } else if (c === '"') q = true;
        else if (c === ',') { cur.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            cur.push(field); field = '';
            if (cur.length > 1 || cur[0] !== '') rows.push(cur);
            cur = [];
        } else field += c;
    }
    if (field !== '' || cur.length) { cur.push(field); rows.push(cur); }
    const head = rows.shift();
    return rows.map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const NUMERIC = ['per_day_rate', 'accommodation_cost', 'meal_cost', 'other_allowance',
    'contracted_per_day_rate', 'contracted_accommodation_cost', 'contracted_meal_cost', 'contracted_other_allowance',
    'charged_per_day_rate', 'charged_accommodation_cost', 'charged_meal_cost', 'charged_other_allowance'];
const DROP = ['contracted_fx_rate', 'contracted_total_lkr'];

(async () => {
    const raw = fs.readFileSync(file, 'utf8');
    const all = file.toLowerCase().endsWith('.csv') ? parseCsv(raw) : JSON.parse(raw);
    const rows = all.filter(r => r.tour_id === tourId).map(r => {
        const out = {};
        for (const [k, v] of Object.entries(r)) {
            if (DROP.includes(k)) continue;
            out[k] = (v === '' || v === undefined) ? null : v;
        }
        NUMERIC.forEach(k => { if (out[k] != null) out[k] = Number(out[k]); });
        return out;
    });
    console.log(`Backup rows for tour ${tourId}: ${rows.length}`);
    if (rows.length === 0) { console.error('Nothing to restore.'); process.exit(1); }

    const { data: existing, error } = await sb.from('tour_itinerary_drivers').select('id').eq('tour_id', tourId);
    if (error) throw error;
    if ((existing || []).length > 0) {
        console.error(`Tour already has ${existing.length} driver rows. Refusing to overwrite.`);
        process.exit(1);
    }
    rows.forEach(r => console.log(`  day-itin ${r.tour_itinerary_id}  driver ${r.driver_id}  rate ${r.contracted_per_day_rate ?? r.per_day_rate}`));

    if (flag !== '--apply') { console.log('\nDry run only. Re-run with --apply to insert.'); return; }
    const { error: insErr } = await sb.from('tour_itinerary_drivers').insert(rows);
    if (insErr) throw insErr;
    console.log(`\nInserted ${rows.length} rows.`);
})().catch(e => { console.error(e); process.exit(1); });
