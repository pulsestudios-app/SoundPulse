-- User safety features for Google Play UGC compliance.

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid primary key default gen_random_uuid(),
  sound_id uuid references public.community_sounds(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete cascade not null,
  reported_user_id uuid references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  UNIQUE(sound_id, reporter_id)
);

-- Blocked users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references auth.users(id) on delete cascade not null,
  blocked_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_sound_id ON public.reports(sound_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- RLS Policies for blocked_users
CREATE POLICY "Users can manage their blocks" ON public.blocked_users
  FOR ALL USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);
