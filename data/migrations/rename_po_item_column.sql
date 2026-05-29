-- Migration: Rename tour_itinerary_id to daily_activity_id for clarity
ALTER TABLE purchase_order_items RENAME COLUMN tour_itinerary_id TO daily_activity_id;
