-- Job Board Schema
-- Purely additive — no changes to existing tables or enums

-- ============================================================
-- ENUMS
-- ============================================================

create type public.jb_role as enum ('applicant', 'company_member');
create type public.jb_job_type as enum ('paid_internship', 'unpaid_internship', 'part_time_contractor', 'full_time_contractor', 'employment');
create type public.jb_work_mode as enum ('remote', 'hybrid', 'in_person');
create type public.jb_availability_type as enum ('start_date_only', 'date_range');
create type public.jb_outreach_status as enum ('sent', 'viewed', 'responded');

-- ============================================================
-- JB_USER_ROLES
-- ============================================================

create table public.jb_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.jb_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index idx_jb_user_roles_user on public.jb_user_roles(user_id);

-- ============================================================
-- JB_APPLICANT_PROFILES
-- ============================================================

create table public.jb_applicant_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  anonymous_id text not null unique,

  -- Academics
  academics jsonb not null default '[]',

  -- Skills
  software_skills text[] not null default '{}',
  languages text[] not null default '{}',

  -- Location
  location_city text,
  location_country text,
  willing_to_relocate boolean not null default false,

  -- Work experience
  work_experience jsonb not null default '[]',

  -- Free text
  personality_description text,
  looking_for text,

  -- Visibility
  is_published boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- JB_APPLICANT_PREFERENCES
-- ============================================================

create table public.jb_applicant_preferences (
  id uuid primary key default gen_random_uuid(),
  applicant_profile_id uuid not null references public.jb_applicant_profiles(id) on delete cascade unique,

  job_types public.jb_job_type[] not null default '{}',
  availability_type public.jb_availability_type not null default 'start_date_only',
  available_from date,
  available_until date,
  work_modes public.jb_work_mode[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- JB_COMPANIES
-- ============================================================

create table public.jb_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  what_we_do text,
  how_we_work text,
  website_url text,
  team_linkedin jsonb not null default '[]',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- JB_COMPANY_MEMBERS
-- ============================================================

create table public.jb_company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.jb_companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_owner boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index idx_jb_company_members_user on public.jb_company_members(user_id);
create index idx_jb_company_members_company on public.jb_company_members(company_id);

-- ============================================================
-- JB_FAVOURITES
-- ============================================================

create table public.jb_favourites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.jb_companies(id) on delete cascade,
  applicant_profile_id uuid not null references public.jb_applicant_profiles(id) on delete cascade,
  favourited_by uuid not null references public.profiles(id),
  note text,
  created_at timestamptz not null default now(),
  unique (company_id, applicant_profile_id)
);

create index idx_jb_favourites_company on public.jb_favourites(company_id);

-- ============================================================
-- JB_OUTREACH
-- ============================================================

create table public.jb_outreach (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.jb_companies(id) on delete cascade,
  applicant_profile_id uuid not null references public.jb_applicant_profiles(id) on delete cascade,
  sent_by uuid not null references public.profiles(id),
  message text,
  status public.jb_outreach_status not null default 'sent',
  sent_at timestamptz not null default now(),
  viewed_at timestamptz
);

create index idx_jb_outreach_company on public.jb_outreach(company_id);
create index idx_jb_outreach_applicant on public.jb_outreach(applicant_profile_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Generate unique anonymous ID
create or replace function public.generate_anonymous_id()
returns text as $$
declare
  new_id text;
  exists_already boolean;
begin
  loop
    new_id := 'Candidate-' || upper(substr(md5(random()::text), 1, 4));
    select exists(select 1 from public.jb_applicant_profiles where anonymous_id = new_id) into exists_already;
    exit when not exists_already;
  end loop;
  return new_id;
end;
$$ language plpgsql;

-- Auto-set anonymous_id on insert
create or replace function public.set_anonymous_id()
returns trigger as $$
begin
  if new.anonymous_id is null or new.anonymous_id = '' then
    new.anonymous_id := public.generate_anonymous_id();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger jb_applicant_set_anonymous_id
  before insert on public.jb_applicant_profiles
  for each row execute function public.set_anonymous_id();

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger jb_applicant_profiles_updated_at
  before update on public.jb_applicant_profiles
  for each row execute function public.update_updated_at();

create trigger jb_applicant_preferences_updated_at
  before update on public.jb_applicant_preferences
  for each row execute function public.update_updated_at();

create trigger jb_companies_updated_at
  before update on public.jb_companies
  for each row execute function public.update_updated_at();

-- ============================================================
-- RLS HELPER FUNCTIONS
-- ============================================================

create or replace function public.is_jb_role(p_role public.jb_role)
returns boolean as $$
  select exists (
    select 1 from public.jb_user_roles
    where user_id = auth.uid() and role = p_role
  );
$$ language sql security definer stable;

create or replace function public.is_jb_company_member(p_company_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.jb_company_members
    where company_id = p_company_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

create or replace function public.is_jb_applicant_owner(p_applicant_profile_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.jb_applicant_profiles
    where id = p_applicant_profile_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.jb_user_roles enable row level security;
alter table public.jb_applicant_profiles enable row level security;
alter table public.jb_applicant_preferences enable row level security;
alter table public.jb_companies enable row level security;
alter table public.jb_company_members enable row level security;
alter table public.jb_favourites enable row level security;
alter table public.jb_outreach enable row level security;

-- JB_USER_ROLES
create policy "Users can view own roles"
  on public.jb_user_roles for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can create own roles"
  on public.jb_user_roles for insert
  with check (user_id = auth.uid() or public.is_admin());

-- JB_APPLICANT_PROFILES
create policy "Applicants can view own profile"
  on public.jb_applicant_profiles for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Companies can view published profiles"
  on public.jb_applicant_profiles for select
  using (is_published = true and public.is_jb_role('company_member'));

create policy "Applicants can create own profile"
  on public.jb_applicant_profiles for insert
  with check (user_id = auth.uid());

create policy "Applicants can update own profile"
  on public.jb_applicant_profiles for update
  using (user_id = auth.uid());

-- JB_APPLICANT_PREFERENCES
create policy "Owners can view preferences"
  on public.jb_applicant_preferences for select
  using (
    public.is_jb_applicant_owner(applicant_profile_id)
    or public.is_admin()
  );

create policy "Companies can view preferences of published profiles"
  on public.jb_applicant_preferences for select
  using (
    public.is_jb_role('company_member')
    and exists (
      select 1 from public.jb_applicant_profiles
      where id = applicant_profile_id and is_published = true
    )
  );

create policy "Owners can insert preferences"
  on public.jb_applicant_preferences for insert
  with check (public.is_jb_applicant_owner(applicant_profile_id));

create policy "Owners can update preferences"
  on public.jb_applicant_preferences for update
  using (public.is_jb_applicant_owner(applicant_profile_id));

-- JB_COMPANIES
create policy "Members can view own company"
  on public.jb_companies for select
  using (public.is_jb_company_member(id) or public.is_admin());

create policy "Applicants can view companies"
  on public.jb_companies for select
  using (public.is_jb_role('applicant'));

create policy "Authenticated users can create companies"
  on public.jb_companies for insert
  to authenticated
  with check (true);

create policy "Members can update own company"
  on public.jb_companies for update
  using (public.is_jb_company_member(id) or public.is_admin());

-- JB_COMPANY_MEMBERS
create policy "Members can view company membership"
  on public.jb_company_members for select
  using (public.is_jb_company_member(company_id) or public.is_admin());

create policy "Users can add themselves during creation"
  on public.jb_company_members for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

-- JB_FAVOURITES
create policy "Company members can view own favourites"
  on public.jb_favourites for select
  using (public.is_jb_company_member(company_id) or public.is_admin());

create policy "Company members can add favourites"
  on public.jb_favourites for insert
  with check (public.is_jb_company_member(company_id));

create policy "Company members can remove favourites"
  on public.jb_favourites for delete
  using (public.is_jb_company_member(company_id));

-- JB_OUTREACH
create policy "Company members can view own outreach"
  on public.jb_outreach for select
  using (public.is_jb_company_member(company_id) or public.is_admin());

create policy "Applicants can view own inbound outreach"
  on public.jb_outreach for select
  using (public.is_jb_applicant_owner(applicant_profile_id));

create policy "Company members can create outreach"
  on public.jb_outreach for insert
  with check (public.is_jb_company_member(company_id));

create policy "Applicants can update outreach status"
  on public.jb_outreach for update
  using (public.is_jb_applicant_owner(applicant_profile_id));
