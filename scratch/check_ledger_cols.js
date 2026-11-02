const { createClient } = require("@supabase/supabase-js");
const src = require("fs").readFileSync(__dirname + "/check_db.js", "utf8");
const s = createClient(src.match(/const url = "([^"]+)"/)[1], src.match(/const key = "([^"]+)"/)[1]);
(async () => {
  for (const t of ["customer_payments", "customer_invoices", "supplier_payments"]) {
    const { data, error } = await s.from(t).select("*").limit(1);
    console.log(t, error?.message, data && data[0] ? Object.keys(data[0]).join(",") : "(no rows)");
  }
  const { data } = await s.from("customer_payments").select("currency,exchange_rate,amount").limit(8);
  console.log(JSON.stringify(data));
  const { data: ci } = await s.from("customer_invoices").select("currency,exchange_rate,amount,status").limit(5);
  console.log(JSON.stringify(ci));
})();
