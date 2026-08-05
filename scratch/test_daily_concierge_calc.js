const fs = require('fs');

console.log("=== Testing Daily Concierge Cost Calculation Logic ===");

const mockTourDays = 5;

const mockCostItems = [
  { id: 'c-1', cost_code: 'SC-CON-001', title: 'Daily Mobile Wi-Fi Router', costing_basis: 'per_day', default_cost: 15 },
  { id: 'c-2', cost_code: 'SC-CON-002', title: 'VIP Airport Welcome Kit', costing_basis: 'per_service', default_cost: 50 },
  { id: 'c-3', cost_code: 'SC-CON-003', title: 'Day 3 Special Butler', costing_basis: 'per_service', default_cost: 80 }
];

const mockSelectedConcierges = new Map([
  ['c-1', { selected: true, quantity: 2, cost: 15, tour_itinerary_id: null }], // Daily item across 5 days: 2 * $15 * 5 = $150
  ['c-2', { selected: true, quantity: 1, cost: 50, tour_itinerary_id: null }], // One-off trip item: 1 * $50 = $50
  ['c-3', { selected: true, quantity: 1, cost: 80, tour_itinerary_id: 'itin-day-3' }] // Day-specific item: 1 * $80 = $80
]);

let totalSupplierPLCost = 0;

mockSelectedConcierges.forEach((val, itemId) => {
  if (!val.selected) return;
  const costObj = mockCostItems.find(c => c.id === itemId);
  if (!costObj) return;

  const cb = (costObj.costing_basis || '').toLowerCase();
  const isDaily = cb.includes('day') || cb.includes('daily');
  const isDaySpecific = !!val.tour_itinerary_id;

  let totalQty = val.quantity || 1;

  if (isDaySpecific) {
    totalQty = val.quantity;
  } else if (isDaily) {
    totalQty = (val.quantity || 1) * mockTourDays;
  }

  const lineTotal = (val.cost || 0) * totalQty;
  totalSupplierPLCost += lineTotal;

  console.log(`- Item [${costObj.cost_code}] "${costObj.title}": Basis=${costObj.costing_basis}, DailyMultiplier=${isDaily && !isDaySpecific ? mockTourDays : 1}, Qty=${totalQty}, Cost=$${val.cost} => Line Total = $${lineTotal}`);
});

console.log(`\nExpected Total Concierge Cost for 5-Day Tour: $280 ($150 daily + $50 trip + $80 day 3)`);
console.log(`Computed Total Concierge Cost: $${totalSupplierPLCost}`);

if (totalSupplierPLCost === 280) {
  console.log("\nDAILY CONCIERGE COST CALCULATION TEST PASSED!");
} else {
  console.error("\nDAILY CONCIERGE COST CALCULATION TEST FAILED!");
  process.exit(1);
}
