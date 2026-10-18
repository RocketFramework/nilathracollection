ALTER TABLE tour_guides
  ADD COLUMN IF NOT EXISTS review_score smallint CHECK (review_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS review_note text;
