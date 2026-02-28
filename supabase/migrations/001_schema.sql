-- SpinUp Database Schema
-- Run this in the Supabase SQL editor or via supabase db push

-- ============================================================
-- ENUMS
-- ============================================================

create type public.phase as enum ('validate', 'build_minimum', 'sell_iterate');
create type public.platform_role as enum ('admin', 'mentor', 'entrepreneur');
create type public.team_member_role as enum ('entrepreneur', 'mentor');
create type public.artifact_status as enum ('draft', 'complete');
create type public.funding_status as enum ('not_started', 'preparing', 'submitted', 'awaiting_decision', 'awarded', 'rejected');
create type public.compliance_status as enum ('not_started', 'in_progress', 'complete');
create type public.relationship_stage as enum ('identified', 'contacted', 'engaged', 'active');
create type public.author_role as enum ('admin', 'mentor');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  platform_role public.platform_role not null default 'entrepreneur',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TEAMS
-- ============================================================

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text,
  operating_name text,
  current_phase public.phase not null default 'validate',
  value_proposition jsonb,
  vp_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.team_member_role not null default 'entrepreneur',
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index idx_team_members_user on public.team_members(user_id);
create index idx_team_members_team on public.team_members(team_id);

-- ============================================================
-- TEAM INVITES
-- ============================================================

create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null,
  role public.team_member_role not null default 'entrepreneur',
  invited_by uuid not null references public.profiles(id),
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  unique (team_id, email)
);

-- ============================================================
-- ARTIFACTS (all tool outputs stored here)
-- ============================================================

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  artifact_type text not null,
  title text not null,
  data jsonb not null default '{}',
  status public.artifact_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_artifacts_team_type on public.artifacts(team_id, artifact_type);

-- ============================================================
-- ARTIFACT EXPORTS
-- ============================================================

create table public.artifact_exports (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.artifacts(id) on delete cascade,
  format text not null check (format in ('docx', 'txt')),
  storage_path text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- TOOL NOTES (admin platform-wide + mentor per-team)
-- ============================================================

create table public.tool_notes (
  id uuid primary key default gen_random_uuid(),
  artifact_type text not null,
  team_id uuid references public.teams(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  author_role public.author_role not null,
  note_text text not null,
  url text,
  url_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tool_notes_type on public.tool_notes(artifact_type);
create index idx_tool_notes_team on public.tool_notes(team_id);

-- ============================================================
-- JOURNAL ENTRIES
-- ============================================================

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  week_start date not null,
  what_we_did text,
  what_we_learned text,
  what_changed text,
  blockers text,
  next_week_priority text,
  metrics jsonb not null default '{}',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, week_start)
);

-- ============================================================
-- FUNDING TRACKER
-- ============================================================

create table public.funding_tracker_entries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  funder text not null,
  amount_available numeric,
  stage_fit text,
  eligibility_notes text,
  status public.funding_status not null default 'not_started',
  deadline date,
  notes text,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_funding_tracker_team on public.funding_tracker_entries(team_id);

-- ============================================================
-- ADVISOR / MENTOR NETWORK
-- ============================================================

create table public.advisor_entries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  expertise text,
  relationship_stage public.relationship_stage not null default 'identified',
  how_we_know_them text,
  last_contact date,
  next_action text,
  value_exchanged text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_advisor_entries_team on public.advisor_entries(team_id);

-- ============================================================
-- TRELLO INTEGRATION
-- ============================================================

create table public.trello_connections (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  access_token text not null,
  access_token_secret text not null,
  trello_member_id text not null,
  board_id text,
  webhook_id text,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  unique (team_id)
);

create table public.trello_card_mappings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  artifact_id uuid not null references public.artifacts(id) on delete cascade,
  trello_card_id text not null,
  trello_list_id text,
  last_pushed_at timestamptz,
  last_pulled_at timestamptz,
  unique (artifact_id, trello_card_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;
alter table public.artifacts enable row level security;
alter table public.artifact_exports enable row level security;
alter table public.tool_notes enable row level security;
alter table public.journal_entries enable row level security;
alter table public.funding_tracker_entries enable row level security;
alter table public.advisor_entries enable row level security;
alter table public.trello_connections enable row level security;
alter table public.trello_card_mappings enable row level security;

-- Helper: check if user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and platform_role = 'admin'
  );
$$ language sql security definer stable;

-- Helper: check if user is member of a team
create or replace function public.is_team_member(p_team_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: check if user is entrepreneur on a team
create or replace function public.is_team_entrepreneur(p_team_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid() and role = 'entrepreneur'
  );
$$ language sql security definer stable;

-- PROFILES
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- TEAMS
create policy "Team members can view their team"
  on public.teams for select
  using (public.is_team_member(id) or public.is_admin());

create policy "Entrepreneurs can create teams"
  on public.teams for insert
  with check (true);

create policy "Entrepreneurs can update their team"
  on public.teams for update
  using (public.is_team_entrepreneur(id) or public.is_admin());

-- TEAM MEMBERS
create policy "Team members can view team membership"
  on public.team_members for select
  using (public.is_team_member(team_id) or public.is_admin());

create policy "Entrepreneurs can add team members"
  on public.team_members for insert
  with check (public.is_team_entrepreneur(team_id) or public.is_admin());

create policy "Entrepreneurs can remove team members"
  on public.team_members for delete
  using (public.is_team_entrepreneur(team_id) or public.is_admin());

-- TEAM INVITES
create policy "Team members can view invites"
  on public.team_invites for select
  using (public.is_team_member(team_id) or email = (select email from public.profiles where id = auth.uid()) or public.is_admin());

create policy "Entrepreneurs can create invites"
  on public.team_invites for insert
  with check (public.is_team_entrepreneur(team_id) or public.is_admin());

create policy "Invited users can accept invites"
  on public.team_invites for update
  using (email = (select email from public.profiles where id = auth.uid()));

-- ARTIFACTS
create policy "Team members can view artifacts"
  on public.artifacts for select
  using (public.is_team_member(team_id) or public.is_admin());

create policy "Entrepreneurs can create artifacts"
  on public.artifacts for insert
  with check (public.is_team_entrepreneur(team_id));

create policy "Entrepreneurs can update artifacts"
  on public.artifacts for update
  using (public.is_team_entrepreneur(team_id));

create policy "Entrepreneurs can delete artifacts"
  on public.artifacts for delete
  using (public.is_team_entrepreneur(team_id));

-- ARTIFACT EXPORTS
create policy "Team members can view exports"
  on public.artifact_exports for select
  using (
    exists (
      select 1 from public.artifacts a
      where a.id = artifact_id and public.is_team_member(a.team_id)
    ) or public.is_admin()
  );

create policy "Entrepreneurs can create exports"
  on public.artifact_exports for insert
  with check (
    exists (
      select 1 from public.artifacts a
      where a.id = artifact_id and public.is_team_entrepreneur(a.team_id)
    )
  );

-- TOOL NOTES
create policy "Everyone can read tool notes for their team or platform notes"
  on public.tool_notes for select
  using (
    team_id is null -- platform-wide admin notes
    or public.is_team_member(team_id)
    or public.is_admin()
  );

create policy "Admins can create platform notes"
  on public.tool_notes for insert
  with check (public.is_admin() and team_id is null and author_role = 'admin');

create policy "Mentors can create team notes"
  on public.tool_notes for insert
  with check (
    author_role = 'mentor'
    and team_id is not null
    and exists (
      select 1 from public.team_members
      where team_id = tool_notes.team_id and user_id = auth.uid() and role = 'mentor'
    )
  );

create policy "Authors can update own notes"
  on public.tool_notes for update
  using (created_by = auth.uid());

create policy "Authors can delete own notes"
  on public.tool_notes for delete
  using (created_by = auth.uid());

-- JOURNAL ENTRIES
create policy "Team members can view journal"
  on public.journal_entries for select
  using (public.is_team_member(team_id) or public.is_admin());

create policy "Entrepreneurs can create journal entries"
  on public.journal_entries for insert
  with check (public.is_team_entrepreneur(team_id));

create policy "Entrepreneurs can update journal entries"
  on public.journal_entries for update
  using (public.is_team_entrepreneur(team_id));

-- FUNDING TRACKER
create policy "Team members can view funding tracker"
  on public.funding_tracker_entries for select
  using (public.is_team_member(team_id) or public.is_admin());

create policy "Entrepreneurs can manage funding tracker"
  on public.funding_tracker_entries for insert
  with check (public.is_team_entrepreneur(team_id));

create policy "Entrepreneurs can update funding tracker"
  on public.funding_tracker_entries for update
  using (public.is_team_entrepreneur(team_id));

create policy "Entrepreneurs can delete funding tracker entries"
  on public.funding_tracker_entries for delete
  using (public.is_team_entrepreneur(team_id));

-- ADVISOR ENTRIES
create policy "Team members can view advisors"
  on public.advisor_entries for select
  using (public.is_team_member(team_id) or public.is_admin());

create policy "Entrepreneurs can manage advisors"
  on public.advisor_entries for insert
  with check (public.is_team_entrepreneur(team_id));

create policy "Entrepreneurs can update advisors"
  on public.advisor_entries for update
  using (public.is_team_entrepreneur(team_id));

create policy "Entrepreneurs can delete advisors"
  on public.advisor_entries for delete
  using (public.is_team_entrepreneur(team_id));

-- TRELLO
create policy "Team members can view trello connection"
  on public.trello_connections for select
  using (public.is_team_member(team_id) or public.is_admin());

create policy "Entrepreneurs can manage trello connection"
  on public.trello_connections for insert
  with check (public.is_team_entrepreneur(team_id));

create policy "Entrepreneurs can update trello connection"
  on public.trello_connections for update
  using (public.is_team_entrepreneur(team_id));

create policy "Entrepreneurs can delete trello connection"
  on public.trello_connections for delete
  using (public.is_team_entrepreneur(team_id));

create policy "Team members can view trello mappings"
  on public.trello_card_mappings for select
  using (public.is_team_member(team_id) or public.is_admin());

create policy "Entrepreneurs can manage trello mappings"
  on public.trello_card_mappings for insert
  with check (public.is_team_entrepreneur(team_id));

create policy "Entrepreneurs can update trello mappings"
  on public.trello_card_mappings for update
  using (public.is_team_entrepreneur(team_id));

-- ============================================================
-- SEED: SA FUNDING SOURCES (pre-populated for new teams via function)
-- ============================================================

create or replace function public.seed_funding_tracker(p_team_id uuid)
returns void as $$
begin
  insert into public.funding_tracker_entries (team_id, funder, amount_available, stage_fit, eligibility_notes) values
    (p_team_id, 'TIA Seed Fund', 200000, 'Idea to prototype', 'For HEIs, Science Councils, and SMEs. Up to R200K per transaction (R500K for IP costs). Advances research outputs into prototypes.'),
    (p_team_id, 'SPII Grant', 1000000, 'Prototype development', 'Non-repayable grant reimbursing 50-85% of qualifying costs. Up to R1M (small) / R3M (medium/large).'),
    (p_team_id, 'SEDA Technology Programme', 600000, 'Startup / incubation', 'Non-repayable grant up to R600K per project. Includes technology transfer and business incubation support.'),
    (p_team_id, 'DSTI Innovation Fund', null, 'Early-stage commercialisation', 'Variable amounts via VC fund-of-funds model. De-risks early-stage SME creation.'),
    (p_team_id, 'TIA Technology Deployment Fund', null, 'Market entry', 'Variable amounts. Facilitates deployment of locally developed technologies.');
end;
$$ language plpgsql security definer;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger teams_updated_at before update on public.teams for each row execute function public.update_updated_at();
create trigger artifacts_updated_at before update on public.artifacts for each row execute function public.update_updated_at();
create trigger tool_notes_updated_at before update on public.tool_notes for each row execute function public.update_updated_at();
create trigger journal_entries_updated_at before update on public.journal_entries for each row execute function public.update_updated_at();
create trigger funding_tracker_updated_at before update on public.funding_tracker_entries for each row execute function public.update_updated_at();
create trigger advisor_entries_updated_at before update on public.advisor_entries for each row execute function public.update_updated_at();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

insert into storage.buckets (id, name, public) values ('exports', 'exports', false);

create policy "Team members can read their exports"
  on storage.objects for select
  using (bucket_id = 'exports' and auth.role() = 'authenticated');

create policy "Authenticated users can upload exports"
  on storage.objects for insert
  with check (bucket_id = 'exports' and auth.role() = 'authenticated');
