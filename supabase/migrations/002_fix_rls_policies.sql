-- Fix RLS policies for team creation flow
-- Problem 1: teams INSERT policy may not have been created (partial migration run)
-- Problem 2: team_members INSERT policy blocks the creator from adding themselves
--            because is_team_entrepreneur() returns false on a brand-new team

-- ============================================================
-- TEAMS
-- ============================================================

drop policy if exists "Entrepreneurs can create teams" on public.teams;

create policy "Entrepreneurs can create teams"
  on public.teams for insert
  to authenticated
  with check (true);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
-- Allow:
--   (a) any authenticated user to add themselves to a team as entrepreneur
--       (required for the new-team creation bootstrap)
--   (b) existing entrepreneurs on a team to add other members
--   (c) admins to do anything

drop policy if exists "Entrepreneurs can add team members" on public.team_members;

create policy "Entrepreneurs can add team members"
  on public.team_members for insert
  to authenticated
  with check (
    (auth.uid() = user_id and role = 'entrepreneur')
    or public.is_team_entrepreneur(team_id)
    or public.is_admin()
  );
