#!/bin/bash
source .env.local

URL="${NEXT_PUBLIC_SUPABASE_URL}/rest/v1"
KEY="${SUPABASE_SERVICE_ROLE_KEY}"
TOUR_ID="82b0e849-6450-4960-8c3b-3291e6bcb2d1"

echo "=== TOUR ITINERARIES ==="
curl -s -X GET "${URL}/tour_itineraries?tour_id=eq.${TOUR_ID}&select=id,day_number" \
  -H "apikey: ${KEY}" \
  -H "Authorization: Bearer ${KEY}"

echo -e "\n=== PLANNER DATA OVERVIEW ==="
curl -s -X GET "${URL}/tours?id=eq.${TOUR_ID}&select=planner_data" \
  -H "apikey: ${KEY}" \
  -H "Authorization: Bearer ${KEY}" | grep -o '"dayNumber":[0-9]' | sort | uniq -c

