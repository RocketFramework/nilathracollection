-- Update restaurants table to support new meal types and rates
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS has_tea_cafe BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_coffee_cafe BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_juice_bar BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tea_cafe_rate_per_head NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS coffee_cafe_rate_per_head NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS juice_bar_rate_per_head NUMERIC(10, 2);
