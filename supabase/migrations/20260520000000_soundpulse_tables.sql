CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users primary key,
  email text,
  display_name text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS generated_sounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  url text not null,
  duration integer default 0,
  prompt text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plan text default 'free',
  status text default 'active',
  expires_at timestamptz,
  created_at timestamptz default now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own profile" ON profiles
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own sounds" ON generated_sounds
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);
