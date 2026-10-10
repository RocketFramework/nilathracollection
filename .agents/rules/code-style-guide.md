---
trigger: always_on
---

do only what I ask you to do.. if you are doing any thing more than what I asked, please ask for permission, with a justification

# Price Source of Truth (all services: hotel, transport provider/vehicle, driver, guide, activity vendor, restaurant, concierge, custom items)

## Definitions
- Charged price = what the customer pays. Set ONLY in the basic track (AI builder / planner).
- Contracted price = what we pay the supplier. Set ONLY by the final track (negotiated value).
- "Unit" = per room per night (hotel), per head/cover (meal), per person/unit (activity), per day (driver/vehicle/guide), per km where km-rated. Totals = unit x quantity. Always compare charged and contracted on the same unit basis.

## Where each value is persisted (authoritative once saved)
- Hotel, activity, meal, guide, custom items: daily_activities.charged_unit_price / charged_total_price and daily_activities.contracted_price / contracted_total_price.
- Driver assignments (tour daily driver table): charged_per_day_rate, charged_accommodation_cost, charged_meal_cost, charged_other_allowance and the matching contracted_* columns.
- Vehicle / transport provider assignments (tour daily vehicle table): charged_per_day_rate, charged_excess_mileage_cost, charged_other_allowance and the matching contracted_* columns.
- Concierge (tour_itinerary_concierges): cost = what we pay (contracted side, per unit), charged_cost = what the customer pays (per unit).

## Rules
- Never write one price into the other's field (no charged -> contracted, no contracted -> charged), including via fallbacks, markups-on-save, version loads, or "sync" effects.
- Never overwrite a saved value unless the user explicitly edited and saved it. A final-track negotiated rate changes ONLY contracted_*; a basic-track edit changes ONLY charged_*.
- Before a save, the builder's draft value lives in the block/draft state (e.g. selectedRooms[].pricePerNight, block.agreedPrice); after saving, the table columns above are authoritative. Draft fields are mirrors, never a second source.
- If no final-track rate exists yet, do not invent a contracted price; leave it empty or labelled "Not negotiated".
- Every screen (basic track, final track, P&L, hotel/transport/driver selection, POs, invoices, PDFs) must display the saved column values and must not recompute prices.
- Before adding any price read/write, grep for every place that touches that field and list them first.
- All price persistence goes through service classes (TourService.saveTour and the daily driver/vehicle/concierge services); UI uses DTOs and does not write price columns directly.

## Anti-fallback rules (never "fall back to something stupid")
- Never write `charged ?? contracted` or `contracted ?? charged` (or `||` equivalents) anywhere: UI, services, PDFs, invoices.
- The ONLY allowed charged -> contracted derivation is display-only: PriceResolutionService.resolveContractedForDisplay (charged x 0.9) with a visible "Not negotiated" label. It must never be persisted or fed into totals saved to contracted_* columns.
- Charged default when the user has not entered one: the ai-builder input first; if there is no input, the markup from the app_settings table (e.g. room_markup, tour_guide_markup, transport_markup, diver_markup). Never a hard-coded amount or multiplier (e.g. 15, 25, 1.1). Concierge charged stays 0 until the user types it (the style service fee is the markup).
- Missing saved value = 0/empty, never a guess from another field, master rate or PO total.
- Do not reintroduce a fallback that was removed. If a screen shows a wrong price, fix the source column, not the display.

# Invoice / Line-Total Integrity (never double-count a value)
- Store UNIT values in unit columns and TOTALS in total columns. Never store a line total (unit x qty) in a unit column, and never multiply a value by quantity unless it is verified to be a unit value.
- Every invoice line (concierge, hotel, transport, etc.) is computed ONCE from its saved source, by InvoiceCalculationService only. The UI shows what the service returned; it must not rebuild, split or re-add a line (e.g. carving concierge out of the fee line).
- The service fee (<style>_service_fee) is applied once on the item subtotal, as its own line. Never also bake a markup into a line the fee is later applied to.
- Before changing any invoice source field, grep every reader and check that the previewed line total equals the source screen total (e.g. concierge-config total == invoice concierge line). If they differ, stop and report it instead of shipping.