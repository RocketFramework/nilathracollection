-- Rename agreed_unit_price and agreed_total_price to charged_unit_price and charged_total_price
ALTER TABLE daily_activities 
RENAME COLUMN agreed_unit_price TO charged_unit_price;

ALTER TABLE daily_activities 
RENAME COLUMN agreed_total_price TO charged_total_price;
