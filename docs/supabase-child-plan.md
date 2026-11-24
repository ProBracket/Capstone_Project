# Supabase — Child Experience (MVP)

Status: **planned (2026-11-01)**, not applied yet. Builds on `docs/supabase-plan.md`. Project: `hkatangpfklbwmoqmymq`.

## 1. The flow

| Step | What the child does | Supabase piece |
|---|---|---|
| 1 | Parent picks the child's profile on `/parentview` | `lock_parent_area()` (PIN switch OFF), go to `/child/welcome?childId=…` |
| 2 | Welcome screen: navbar + fixed mascot greeting | `children` select (name), `child_interests` select |
| 3 | Adds / removes their interests | `child_interests` insert / delete (`source = 'child'`) |
| 4 | "Want to talk?" → AI conversation | `conversations` insert, then `conversation_messages` insert per turn |
| 5 | Conversation ends | `conversations` update (`ended_at`, `summary`); the AI may insert interests (`source = 'ai'`) |
| 6 | "Challenge yourself" → calibration test | `calibration_results` insert, one row per subject attempt |

The child has **no login of their own**. Everything runs on the parent's session, and the parent area is locked while the child uses the app. So child tables need "this child belongs to the signed-in parent" and never the PIN, except deleting transcripts, which is a parent action.

The mascot is fixed for everyone and the greeting is static for the MVP, so nothing is stored for either.

## 2. Tables

### `child_interests`
`id` uuid PK · `child_id` uuid (FK → `children.id`, cascade) · `interest` text (1–50 chars) · `source` text (`child` | `ai`) · `created_at`

Unique per child, case-insensitive (`dinosaurs` = `Dinosaurs`). One row per interest so the child and the AI can both add and remove them, and the parent can see where each came from.

### `conversations`
`id` uuid PK · `child_id` uuid (FK → `children.id`, cascade) · `started_at` · `ended_at` (null while ongoing) · `summary` text (AI recap, filled when it ends)

### `conversation_messages` (full transcripts)
`id` bigint identity PK (keeps order) · `conversation_id` uuid (FK → `conversations.id`, cascade) · `role` text (`child` | `assistant`) · `content` text · `created_at`

Messages are append-only: no update or delete. They disappear when the conversation (or the child) is deleted.

### `calibration_results` (already exists, reworked)
Measures the child's base knowledge per subject. The table is empty, so the changes are safe:
- `child_id` and `subject` become required
- the FK to `children` becomes `on delete cascade` (right now deleting a child with results would fail)
- it currently has RLS on and **no policies**, so the app can't read or write it at all. Policies are added below.

## 3. Access rules (RLS, authenticated only)

| Table | select | insert | update | delete |
|---|---|---|---|---|
| `child_interests` | own child | own child | — | own child |
| `conversations` | own child | own child | own child | own child **and** PIN unlocked |
| `conversation_messages` | own conversation | own conversation | — | — (cascade only) |
| `calibration_results` | own child | own child | — | — |

"Own child" = `owns_child(child_id)`: the child's `parent_id` is `auth.uid()`.

## 4. SQL — run in Dashboard → SQL Editor

Run it as one script. If anything fails, nothing is applied.

```sql
begin;

-- 0. Security fix: these two policies let anyone (even signed out) read and add children.
drop policy if exists "Allow select children" on public.children;
drop policy if exists "Allow insert children" on public.children;

-- 1. Helper: does this child belong to the signed-in parent?
-- Security invoker: it reads children through the parent's own RLS, so it can't leak anything.
create or replace function public.owns_child(target_child uuid)
returns boolean
language sql
stable
set search_path = pg_catalog
as $$
  select exists (
    select 1 from public.children
    where id = target_child and parent_id = auth.uid()
  )
$$;
revoke execute on function public.owns_child(uuid) from public, anon;
grant execute on function public.owns_child(uuid) to authenticated;

-- 2. Interests
create table public.child_interests (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  interest text not null check (char_length(trim(interest)) between 1 and 50),
  source text not null default 'child' check (source in ('child', 'ai')),
  created_at timestamptz not null default now()
);
create unique index child_interests_child_interest_key
  on public.child_interests (child_id, lower(interest));
alter table public.child_interests enable row level security;

create policy "Parents can view their children's interests" on public.child_interests
  for select to authenticated using (public.owns_child(child_id));
create policy "Parents can add their children's interests" on public.child_interests
  for insert to authenticated with check (public.owns_child(child_id));
create policy "Parents can remove their children's interests" on public.child_interests
  for delete to authenticated using (public.owns_child(child_id));

-- 3. Conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  summary text
);
create index conversations_child_started_idx
  on public.conversations (child_id, started_at desc);
alter table public.conversations enable row level security;

create policy "Parents can view their children's conversations" on public.conversations
  for select to authenticated using (public.owns_child(child_id));
create policy "Parents can start their children's conversations" on public.conversations
  for insert to authenticated with check (public.owns_child(child_id));
create policy "Parents can update their children's conversations" on public.conversations
  for update to authenticated
  using (public.owns_child(child_id)) with check (public.owns_child(child_id));
create policy "Parents can delete conversations when unlocked" on public.conversations
  for delete to authenticated
  using (public.owns_child(child_id) and (select public.parent_area_unlocked()));

-- 4. Transcript messages
create table public.conversation_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('child', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index conversation_messages_conversation_idx
  on public.conversation_messages (conversation_id, id);
alter table public.conversation_messages enable row level security;

create policy "Parents can view their children's messages" on public.conversation_messages
  for select to authenticated using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id and public.owns_child(c.child_id)
    )
  );
create policy "Parents can add their children's messages" on public.conversation_messages
  for insert to authenticated with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id and public.owns_child(c.child_id)
    )
  );

-- 5. Calibration results (table is empty)
alter table public.calibration_results
  alter column child_id set not null,
  alter column subject set not null;
alter table public.calibration_results
  drop constraint calibration_results_child_id_fkey,
  add constraint calibration_results_child_id_fkey
    foreign key (child_id) references public.children(id) on delete cascade;
create index calibration_results_child_idx
  on public.calibration_results (child_id, subject, created_at desc);

create policy "Parents can view their children's results" on public.calibration_results
  for select to authenticated using (public.owns_child(child_id));
create policy "Parents can add their children's results" on public.calibration_results
  for insert to authenticated with check (public.owns_child(child_id));

commit;
```

## 5. After running
1. **Table Editor:** the four tables are there and each shows "RLS enabled".
2. **Authentication → Policies → `children`:** only the 4 "Parents can …" policies are left.
3. **Advisors → Security Advisor:** no new warnings beyond the expected ones in `docs/supabase-plan.md`.
4. Tell Claude so it can verify the schema and generate the types.

## 6. Open / later
- `children.age` and `children.nickname` exist in the live DB but no code uses them, and `age` contradicts "age is not stored". Drop them once whoever added them agrees: `alter table public.children drop column age, drop column nickname;`
- Calibration questions: decide if they're a fixed bank (needs a `calibration_questions` table) or AI-generated (current `answers` jsonb is enough).
- If the AI later runs on the server with the service-role key, it bypasses RLS. The server must then check the child belongs to the signed-in parent itself.
- App code: `lib/interests.ts`, `lib/conversations.ts`, `lib/calibration.ts`, same pattern as `lib/children.ts`.
