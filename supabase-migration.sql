-- SkillSwap KNUST Database Schema
-- Run this in Supabase SQL Editor (https://app.supabase.com → SQL Editor → New query)

-- 1. Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  faculty text not null default '',
  bio text default '',
  avatar_url text default '',
  skills_to_teach jsonb default '[]'::jsonb,
  skills_to_learn jsonb default '[]'::jsonb,
  availability text[] default '{}',
  preferred_mode text default 'online' check (preferred_mode in ('online', 'offline', 'both')),
  contact text default '',
  rating numeric(3,2) default 0,
  total_ratings integer default 0,
  xp integer default 0,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. Sessions table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  learner_id uuid references public.profiles(id) on delete cascade not null,
  skill text not null,
  date date not null,
  time text not null,
  mode text default 'online' check (mode in ('online', 'offline')),
  location text default '',
  status text default 'pending' check (status in ('pending', 'accepted', 'completed', 'cancelled')),
  teacher_rating integer,
  learner_rating integer,
  teacher_feedback text,
  learner_feedback text,
  notes text default '',
  created_at timestamptz default now()
);

-- 3. Messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  type text default 'text' check (type in ('text', 'resource')),
  read boolean default false,
  created_at timestamptz default now()
);

-- 4. Notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text default '',
  link text default '',
  read boolean default false,
  created_at timestamptz default now()
);

-- 5. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- 6. RLS Policies - Profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- 7. RLS Policies - Sessions
create policy "Users can view their sessions"
  on public.sessions for select using (
    auth.uid() = teacher_id or auth.uid() = learner_id
  );

create policy "Authenticated users can create sessions"
  on public.sessions for insert with check (auth.uid() = learner_id);

create policy "Participants can update sessions"
  on public.sessions for update using (
    auth.uid() = teacher_id or auth.uid() = learner_id
  );

-- 8. RLS Policies - Messages
create policy "Users can view their messages"
  on public.messages for select using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "Authenticated users can send messages"
  on public.messages for insert with check (auth.uid() = sender_id);

create policy "Receiver can mark messages as read"
  on public.messages for update using (auth.uid() = receiver_id);

-- 9. RLS Policies - Notifications
create policy "Users can view their notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update their notifications"
  on public.notifications for update using (auth.uid() = user_id);

create policy "System can create notifications"
  on public.notifications for insert with check (true);

-- 10. Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, faculty)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'faculty', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 11. Function to update last_seen
create or replace function public.update_last_seen()
returns void as $$
begin
  update public.profiles set last_seen = now() where id = auth.uid();
end;
$$ language plpgsql security definer;

-- 12. Enable Realtime for messages
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- 13. Create storage bucket for avatars
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Anyone can view avatars"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );

create policy "Users can update their own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
