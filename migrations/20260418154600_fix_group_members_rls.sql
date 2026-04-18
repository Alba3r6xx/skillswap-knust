-- Fix: group_members RLS policy causes infinite recursion → 500 error
-- The original policy queried group_members from within group_members RLS,
-- creating a recursive loop. Replace with a non-recursive authenticated check.
--
-- Run this once in: Supabase Dashboard → SQL Editor → New Query

drop policy if exists "Group members can view membership" on public.group_members;

create policy "Group members can view membership"
  on public.group_members for select
  using (auth.role() = 'authenticated');
