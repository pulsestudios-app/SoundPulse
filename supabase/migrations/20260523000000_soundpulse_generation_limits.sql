ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS generations_used_this_month integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS generations_month text DEFAULT '';
