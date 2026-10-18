ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS review_score smallint CHECK (review_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS review_score smallint CHECK (review_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS review_score smallint CHECK (review_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE transport_providers
  ADD COLUMN IF NOT EXISTS review_score smallint CHECK (review_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS review_note text;
