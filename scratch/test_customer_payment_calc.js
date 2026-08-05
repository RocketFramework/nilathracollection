function getCustomerPaymentUSD(p, tourBuyingRate = 331.20) {
  const amt = Number(p.amount) || 0;
  if (amt === 0) return 0;
  const currency = p.currency || 'USD';
  if (currency === 'USD') return amt;

  const rate = Number(p.exchange_rate);
  const effectiveRate = (rate && rate > 1.0) ? rate : tourBuyingRate;
  return effectiveRate > 0 ? amt / effectiveRate : amt;
}

// Test case 1: USD Payment
const usdPay = { amount: 1000, currency: 'USD' };
console.log("USD Payment 1000 -> USD:", getCustomerPaymentUSD(usdPay)); // 1000

// Test case 2: LKR Payment with explicit rate 335
const lkrPayExplicit = { amount: 335000, currency: 'LKR', exchange_rate: 335.00 };
console.log("LKR Payment 335,000 at 335.00 -> USD:", getCustomerPaymentUSD(lkrPayExplicit)); // 1000

// Test case 3: LKR Payment without explicit rate (default fallback rate)
const lkrPayDefault = { amount: 331200, currency: 'LKR', exchange_rate: 1.0 };
console.log("LKR Payment 331,200 (rate 1.0 fallback to 331.20) -> USD:", getCustomerPaymentUSD(lkrPayDefault)); // 1000
