const { createClient } = require('@supabase/supabase-js');

const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';
const supabase = createClient(url, key);

const vipGeneralItems = [
  {
    cost_code: 'SC-VIP-001',
    title: 'Private chef at the villa/hotel',
    details: 'Bespoke culinary service with dedicated private chef at your villa or hotel.',
    category: 'VIP General',
    default_cost: 250,
    currency: 'USD',
    costing_basis: 'per_day',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-002',
    title: 'Executive protection officers',
    details: 'Certified close-protection security officers for VIP safety.',
    category: 'VIP General',
    default_cost: 350,
    currency: 'USD',
    costing_basis: 'per_day',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-003',
    title: 'Residential/villa security',
    details: 'Dedicated 24/7 static perimeter security and access control for private villas.',
    category: 'VIP General',
    default_cost: 200,
    currency: 'USD',
    costing_basis: 'per_day',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-004',
    title: 'Airport arrival/departure security',
    details: 'Tarmac-side close protection and secure transfer escort upon arrival/departure.',
    category: 'VIP General',
    default_cost: 180,
    currency: 'USD',
    costing_basis: 'per_service',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-005',
    title: 'Security assessment and coordination',
    details: 'Comprehensive pre-trip threat evaluation, route planning, and venue security logistics.',
    category: 'VIP General',
    default_cost: 300,
    currency: 'USD',
    costing_basis: 'whole_trip',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-006',
    title: 'Secure transportation',
    details: 'Armored or high-security convoy vehicle with trained defensive driver.',
    category: 'VIP General',
    default_cost: 400,
    currency: 'USD',
    costing_basis: 'per_day',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-007',
    title: 'Yacht / Private Boat',
    details: 'Bespoke luxury yacht or private boat charter for coastal and ocean excursions.',
    category: 'VIP General',
    default_cost: 1200,
    currency: 'USD',
    costing_basis: 'per_service',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-008',
    title: 'Helicopter',
    details: 'Private charter helicopter flight for VIP aerial transfers and scenic tours.',
    category: 'VIP General',
    default_cost: 1500,
    currency: 'USD',
    costing_basis: 'per_service',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-009',
    title: 'Seaplane',
    details: 'Exclusive seaplane transfer connecting coastal resorts and inland lakes.',
    category: 'VIP General',
    default_cost: 1100,
    currency: 'USD',
    costing_basis: 'per_service',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-010',
    title: 'Police / Government Security',
    details: 'Official state police or government security escort detail for high-profile VVIPs.',
    category: 'VIP General',
    default_cost: 500,
    currency: 'USD',
    costing_basis: 'per_day',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-011',
    title: 'Serving Military Personnel',
    details: 'Specialized active military detail for high-risk route protection and logistics.',
    category: 'VIP General',
    default_cost: 450,
    currency: 'USD',
    costing_basis: 'per_day',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-012',
    title: 'Medical/Doctor-on-call coordination',
    details: '24/7 dedicated private physician on standby with rapid medical response setup.',
    category: 'VIP General',
    default_cost: 150,
    currency: 'USD',
    costing_basis: 'per_day',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-013',
    title: 'Security Risk Assessment',
    details: 'Formal advance risk profiling and intelligence protocol briefing for UHNW travelers.',
    category: 'VIP General',
    default_cost: 250,
    currency: 'USD',
    costing_basis: 'whole_trip',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-014',
    title: 'Security Chauffeur',
    details: 'Tactically trained executive chauffeur specialized in evasive driving and protection.',
    category: 'VIP General',
    default_cost: 220,
    currency: 'USD',
    costing_basis: 'per_day',
    is_generic: false,
    is_active: true
  },
  {
    cost_code: 'SC-VIP-015',
    title: 'Villa Security',
    details: 'On-site private estate security guards and surveillance setup.',
    category: 'VIP General',
    default_cost: 180,
    currency: 'USD',
    costing_basis: 'per_day',
    is_generic: false,
    is_active: true
  }
];

async function seed() {
  console.log('Seeding VIP General Concierge Items into seamless_concierge_cost_items...');
  const tourId = 'edf2600d-da8d-4c3a-9d45-67d3ee5e16fe';

  const insertedItems = [];

  for (const item of vipGeneralItems) {
    // Check if item exists by cost_code
    const { data: existing } = await supabase
      .from('seamless_concierge_cost_items')
      .select('*')
      .eq('cost_code', item.cost_code)
      .maybeSingle();

    let recordId;
    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from('seamless_concierge_cost_items')
        .update(item)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) {
        console.error(`Error updating ${item.cost_code}:`, updateErr);
      } else {
        recordId = updated.id;
        console.log(`Updated ${item.cost_code}: ${item.title}`);
      }
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('seamless_concierge_cost_items')
        .insert(item)
        .select()
        .single();

      if (insertErr) {
        console.error(`Error inserting ${item.cost_code}:`, insertErr);
      } else {
        recordId = inserted.id;
        console.log(`Inserted ${item.cost_code}: ${item.title}`);
      }
    }

    if (recordId) {
      insertedItems.push({ id: recordId, ...item });
    }
  }

  console.log(`Successfully processed ${insertedItems.length} VIP General concierge items.`);

  // Now assign concierge items to tour_itinerary_concierges for tour edf2600d-da8d-4c3a-9d45-67d3ee5e16fe
  console.log(`Assigning VIP General items to tour ${tourId}...`);
  for (const item of insertedItems) {
    const { data: existingTourConc } = await supabase
      .from('tour_itinerary_concierges')
      .select('*')
      .eq('tour_id', tourId)
      .eq('concierge_cost_item_id', item.id)
      .maybeSingle();

    if (!existingTourConc) {
      const { error: assignErr } = await supabase
        .from('tour_itinerary_concierges')
        .insert({
          tour_id: tourId,
          concierge_cost_item_id: item.id,
          quantity: 2, // 2 individuals / guests
          cost: item.default_cost
        });

      if (assignErr) {
        console.error(`Error assigning ${item.title} to tour:`, assignErr);
      } else {
        console.log(`Assigned ${item.title} (Qty: 2, Cost: $${item.default_cost}) to tour.`);
      }
    } else {
      console.log(`${item.title} already assigned to tour.`);
    }
  }

  console.log('Seeding and tour assignment completed successfully!');
}

seed();
