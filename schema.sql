-- ============================================================
--  SkillSwap KNUST — Complete Database Schema
--  Run once in: Supabase Dashboard → SQL Editor → New Query
--  Safe to re-run: uses IF NOT EXISTS / OR REPLACE throughout
-- ============================================================


-- ──────────────────────────────────────────────────────────
--  TABLES
-- ──────────────────────────────────────────────────────────

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id               uuid references auth.users on delete cascade primary key,
  name             text        not null default '',
  email            text        not null unique,
  faculty          text        not null default '',
  bio              text                 default '',
  avatar_url       text                 default '',
  skills_to_teach  jsonb                default '[]'::jsonb,
  skills_to_learn  jsonb                default '[]'::jsonb,
  availability     text[]               default '{}',
  preferred_mode   text                 default 'online'
                     check (preferred_mode in ('online','offline','both')),
  contact          text                 default '',
  rating           numeric(3,2)         default 0,
  total_ratings    integer              default 0,
  xp               integer              default 0,
  last_seen        timestamptz          default now(),
  created_at       timestamptz          default now()
);

-- 2. Sessions
create table if not exists public.sessions (
  id               uuid        default gen_random_uuid() primary key,
  teacher_id       uuid references public.profiles(id) on delete cascade not null,
  learner_id       uuid references public.profiles(id) on delete cascade not null,
  skill            text        not null,
  date             date        not null,
  time             text        not null,
  mode             text        default 'online'
                     check (mode in ('online','offline')),
  location         text        default '',
  status           text        default 'pending'
                     check (status in ('pending','accepted','completed','cancelled')),
  teacher_rating   integer,
  learner_rating   integer,
  teacher_feedback text,
  learner_feedback text,
  notes            text        default '',
  created_at       timestamptz default now()
);

-- 3. Messages  (includes delivered, reply, edit, forward, pin, delete columns)
create table if not exists public.messages (
  id               uuid        default gen_random_uuid() primary key,
  sender_id        uuid references public.profiles(id) on delete cascade not null,
  receiver_id      uuid references public.profiles(id) on delete cascade not null,
  content          text        not null,
  type             text        default 'text'
                     check (type in ('text','resource','audio','image','document')),
  read             boolean     default false,
  delivered        boolean     default false,
  -- reply thread
  reply_to         uuid references public.messages(id) on delete set null,
  reply_preview    text,
  reply_sender_id  uuid,
  -- lifecycle
  deleted_at       timestamptz,
  edited_at        timestamptz,
  pinned           boolean     default false,
  forwarded_from   uuid references public.messages(id) on delete set null,
  created_at       timestamptz default now()
);

-- 4. Message reactions
create table if not exists public.message_reactions (
  id          uuid default gen_random_uuid() primary key,
  message_id  uuid not null references public.messages(id) on delete cascade,
  user_id     uuid not null references auth.users(id)      on delete cascade,
  emoji       text not null,
  created_at  timestamptz default now(),
  unique (message_id, user_id, emoji)
);

-- 5. Notifications
create table if not exists public.notifications (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  type        text not null,
  title       text not null,
  message     text default '',
  link        text default '',
  read        boolean     default false,
  created_at  timestamptz default now()
);

-- 6. Push subscriptions  (one row per user — UNIQUE on user_id)
create table if not exists public.push_subscriptions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade unique,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz default now()
);


-- 7. Study Groups
create table if not exists public.groups (
  id          uuid default gen_random_uuid() primary key,
  name        text        not null,
  description text        default '',
  avatar_url  text        default '',
  created_by  uuid references public.profiles(id) on delete cascade not null,
  created_at  timestamptz default now()
);

-- 8. Group members
create table if not exists public.group_members (
  id          uuid default gen_random_uuid() primary key,
  group_id    uuid references public.groups(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  role        text default 'member'
                check (role in ('admin','member')),
  joined_at   timestamptz default now(),
  unique (group_id, user_id)
);

-- 9. Group messages
create table if not exists public.group_messages (
  id               uuid default gen_random_uuid() primary key,
  group_id         uuid references public.groups(id) on delete cascade not null,
  sender_id        uuid references public.profiles(id) on delete cascade not null,
  content          text        not null,
  type             text default 'text'
                     check (type in ('text','audio','image','document')),
  reply_to         uuid references public.group_messages(id) on delete set null,
  reply_preview    text,
  reply_sender_id  uuid,
  deleted_at       timestamptz,
  edited_at        timestamptz,
  created_at       timestamptz default now()
);


-- ──────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.sessions          enable row level security;
alter table public.messages          enable row level security;
alter table public.message_reactions enable row level security;
alter table public.notifications     enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.groups            enable row level security;
alter table public.group_members     enable row level security;
alter table public.group_messages    enable row level security;

-- Profiles
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Profiles are viewable by everyone') then
    create policy "Profiles are viewable by everyone"
      on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can insert own profile') then
    create policy "Users can insert own profile"
      on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can update own profile') then
    create policy "Users can update own profile"
      on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

-- Sessions
do $$ begin
  if not exists (select 1 from pg_policies where tablename='sessions' and policyname='Users can view their sessions') then
    create policy "Users can view their sessions"
      on public.sessions for select using (
        auth.uid() = teacher_id or auth.uid() = learner_id
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='sessions' and policyname='Authenticated users can create sessions') then
    create policy "Authenticated users can create sessions"
      on public.sessions for insert with check (auth.uid() = learner_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='sessions' and policyname='Participants can update sessions') then
    create policy "Participants can update sessions"
      on public.sessions for update using (
        auth.uid() = teacher_id or auth.uid() = learner_id
      );
  end if;
end $$;

-- Messages
do $$ begin
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='Users can view their messages') then
    create policy "Users can view their messages"
      on public.messages for select using (
        auth.uid() = sender_id or auth.uid() = receiver_id
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='Authenticated users can send messages') then
    create policy "Authenticated users can send messages"
      on public.messages for insert with check (auth.uid() = sender_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='Participants can update messages') then
    create policy "Participants can update messages"
      on public.messages for update using (
        auth.uid() = sender_id or auth.uid() = receiver_id
      );
  end if;
end $$;

-- Message reactions
do $$ begin
  if not exists (select 1 from pg_policies where tablename='message_reactions' and policyname='Anyone can view reactions') then
    create policy "Anyone can view reactions"
      on public.message_reactions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='message_reactions' and policyname='Users can add reactions') then
    create policy "Users can add reactions"
      on public.message_reactions for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='message_reactions' and policyname='Users can remove own reactions') then
    create policy "Users can remove own reactions"
      on public.message_reactions for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Notifications
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can view their notifications') then
    create policy "Users can view their notifications"
      on public.notifications for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can update their notifications') then
    create policy "Users can update their notifications"
      on public.notifications for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='System can create notifications') then
    create policy "System can create notifications"
      on public.notifications for insert with check (true);
  end if;
end $$;

-- Push subscriptions
do $$ begin
  if not exists (select 1 from pg_policies where tablename='push_subscriptions' and policyname='Users can manage own push subscription') then
    create policy "Users can manage own push subscription"
      on public.push_subscriptions for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='push_subscriptions' and policyname='Service role can read all subscriptions') then
    create policy "Service role can read all subscriptions"
      on public.push_subscriptions for select using (true);
  end if;
end $$;

-- Groups
do $$ begin
  if not exists (select 1 from pg_policies where tablename='groups' and policyname='Group members can view groups') then
    create policy "Group members can view groups"
      on public.groups for select using (
        exists (select 1 from public.group_members where group_id = id and user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='groups' and policyname='Authenticated users can create groups') then
    create policy "Authenticated users can create groups"
      on public.groups for insert with check (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where tablename='groups' and policyname='Group admins can update groups') then
    create policy "Group admins can update groups"
      on public.groups for update using (
        exists (select 1 from public.group_members where group_id = id and user_id = auth.uid() and role = 'admin')
      );
  end if;
end $$;

-- Group members
do $$ begin
  if not exists (select 1 from pg_policies where tablename='group_members' and policyname='Group members can view membership') then
    create policy "Group members can view membership"
      on public.group_members for select using (
        auth.role() = 'authenticated'
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='group_members' and policyname='Group admins can manage members') then
    create policy "Group admins can manage members"
      on public.group_members for insert with check (
        auth.uid() = user_id or
        exists (select 1 from public.group_members where group_id = group_members.group_id and user_id = auth.uid() and role = 'admin')
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='group_members' and policyname='Members can leave groups') then
    create policy "Members can leave groups"
      on public.group_members for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Group messages
do $$ begin
  if not exists (select 1 from pg_policies where tablename='group_messages' and policyname='Group members can view messages') then
    create policy "Group members can view messages"
      on public.group_messages for select using (
        exists (select 1 from public.group_members where group_id = group_messages.group_id and user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='group_messages' and policyname='Group members can send messages') then
    create policy "Group members can send messages"
      on public.group_messages for insert with check (
        auth.uid() = sender_id and
        exists (select 1 from public.group_members where group_id = group_messages.group_id and user_id = auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='group_messages' and policyname='Senders can update own messages') then
    create policy "Senders can update own messages"
      on public.group_messages for update using (auth.uid() = sender_id);
  end if;
end $$;


-- ──────────────────────────────────────────────────────────
--  FUNCTIONS & TRIGGERS
-- ──────────────────────────────────────────────────────────

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, name, email, faculty)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'faculty', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for auth users created before the trigger existed
insert into public.profiles (id, name, email, faculty)
select
  users.id,
  coalesce(users.raw_user_meta_data->>'name', ''),
  users.email,
  coalesce(users.raw_user_meta_data->>'faculty', '')
from auth.users as users
left join public.profiles on profiles.id = users.id
where profiles.id is null
on conflict (id) do nothing;

-- Update last_seen (called from the client via supabase.rpc)
create or replace function public.update_last_seen()
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles set last_seen = now() where id = auth.uid();
end;
$$;

-- Mark all unread messages as delivered for a given user
create or replace function public.mark_messages_delivered(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.messages
  set delivered = true
  where receiver_id = p_user_id
    and delivered = false;
end;
$$;


-- ──────────────────────────────────────────────────────────
--  REALTIME
-- ──────────────────────────────────────────────────────────

-- Full replica identity so UPDATE events carry all columns
alter table public.messages          replica identity full;
alter table public.notifications     replica identity full;
alter table public.group_messages    replica identity full;

-- Add tables to the Supabase realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'group_messages'
  ) then
    alter publication supabase_realtime add table public.group_messages;
  end if;
end $$;


-- ──────────────────────────────────────────────────────────
--  STORAGE BUCKETS
-- ──────────────────────────────────────────────────────────

-- Avatars bucket (public)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Anyone can view avatars') then
    create policy "Anyone can view avatars"
      on storage.objects for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Authenticated users can upload avatars') then
    create policy "Authenticated users can upload avatars"
      on storage.objects for insert with check (
        bucket_id = 'avatars' and auth.role() = 'authenticated'
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Users can update their own avatar') then
    create policy "Users can update their own avatar"
      on storage.objects for update using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

-- Audio messages bucket (public)
insert into storage.buckets (id, name, public)
values ('audio-messages', 'audio-messages', true)
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Anyone can listen to audio messages') then
    create policy "Anyone can listen to audio messages"
      on storage.objects for select using (bucket_id = 'audio-messages');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='Authenticated users can upload audio') then
    create policy "Authenticated users can upload audio"
      on storage.objects for insert with check (
        bucket_id = 'audio-messages' and auth.role() = 'authenticated'
      );
  end if;
end $$;
