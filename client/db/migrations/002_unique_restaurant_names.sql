-- Restaurant names identify one saved place in this app, regardless of casing
-- or accidental outer whitespace. The API maps a violation to HTTP 409.
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_name_unique
  ON restaurants (LOWER(TRIM(name)));
