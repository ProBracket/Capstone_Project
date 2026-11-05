# Supabase — Parent Experience

Status: **built in the Dashboard (2026-10-31)**. Not yet saved as a migration in the repo. Project: `hkatangpfklbwmoqmymq`.

## 1. The flow

| Step | What the parent does | Supabase piece |
|---|---|---|
| 1 | Homepage (who we are / what we do) | nothing |
| 2 | Signs up | `auth.users` row → trigger `on_auth_user_created` creates their `parents` row |
| 3 | Logs in → redirected to `/parentview` | Supabase Auth session |
| 4 | Netflix-style picker shows their children | `children` select: own rows only, no PIN needed |
| 5 | No children → go to Settings | — |
| 6 | Opens Settings → PIN screen | `has_parent_pin()` → create (`set_parent_pin`) or enter (`verify_parent_pin`) |
| 7 | Correct PIN → stays in Settings/Dashboard as long as they want | switch `parent_pins.unlocked` = ON |
| 8 | Adds / edits / removes children | `children` insert/update/delete: **database refuses unless the switch is ON** |
| 9 | Leaves, picks a child, logs out | `lock_parent_area()` → switch OFF |

### The PIN switch (no session timer)
- Correct PIN → `unlocked = true`. Wrong PIN → `unlocked = false`.
- 5 wrong PINs → locked out for 5 minutes, then the counter resets to 0. Never longer than 5 minutes, no buildup.
- **The app must call `lock_parent_area()`** when:
  - the `/parentview` picker loads (including right after login)
  - a child profile is picked
  - the parent leaves Settings or the Dashboard
  - the parent logs out
  - Settings first opens (before showing the PIN screen)

  Closing the tab runs nothing, which is why the picker and Settings lock on load.

## 2. Tables

### `parents` — 1:1 with `auth.users`
`id` uuid PK (FK → `auth.users.id`, cascade) · `full_name` text · `created_at` timestamptz

RLS (authenticated): select / update own row (`id = auth.uid()`). No insert (the trigger does it), no delete.

### `children`
`id` uuid PK (`gen_random_uuid()`) · `parent_id` uuid (default `auth.uid()`, FK → `parents.id`, cascade, indexed) · `name` text · `date_of_birth` date · `grade` int2 (0 = K … 12) · `created_at` timestamptz

**Age is not stored.** The app calculates it from `date_of_birth`. No CHECK constraints exist, so the app validates: name 1–50 chars, date of birth not in the future, grade 0–12.

RLS (authenticated):
- select: `parent_id = auth.uid()`
- insert / update / delete: `parent_id = auth.uid() and parent_area_unlocked()`

### `parent_pins` — private
`parent_id` uuid PK (FK → `parents.id`, cascade) · `pin_hash` text (bcrypt) · `failed_attempts` int2 · `locked_until` timestamptz · `unlocked` bool (default false) · `updated_at` timestamptz

RLS on with **no policies on purpose**. The app can never read it; it can only go through the functions.

## 3. Functions

All are `security definer`, `search_path = pg_catalog`, and act only on `auth.uid()`. `anon` can't execute any of them.

| Function | Returns | Purpose |
|---|---|---|
| `has_parent_pin()` | bool | Settings shows "create PIN" or "enter PIN" |
| `set_parent_pin(new_pin)` | void | First time only, 4 digits. Switch ON |
| `verify_parent_pin(pin)` | bool | Correct → ON. Wrong → OFF, and a lockout after 5 |
| `parent_area_unlocked()` | bool | Used by the RLS policies; the app can call it too |
| `lock_parent_area()` | void | Switch OFF |
| `change_parent_pin(new_pin)` | void | Only while ON, 4 digits |
| `handle_new_user()` | trigger | Trigger-only (execute revoked from everyone) |

Error messages the app should show: `PIN must be exactly 4 digits`, `PIN already set`, `No PIN set`, `Too many wrong attempts. Try again in a few minutes.`, `Enter your current PIN first`, `Not signed in`.

**Not built yet:** "Forgot PIN" (it requires re-entering the account password).

## 4. Expected Security Advisor findings
- "RLS enabled, no policy" on `parent_pins`: intended.
- "Signed-in users can execute SECURITY DEFINER" on the 6 PIN functions: intended.
- Leaked password protection: turn it on in Auth settings if the plan allows.

## 5. Contract for teammates
- **Signup:** `supabase.auth.signUp({ email, password, options: { data: { full_name }, emailRedirectTo: <site>/parentview } })`. Nothing else is needed.
- **All Supabase calls go through `lib/`.** Never call `createClient` in a page.
  - `lib/auth.ts`: login / logout / session
  - `lib/profile.ts`: `parents.full_name` (switch from auth metadata to the table)
  - `lib/children.ts` (new): list / add / update / delete
  - `lib/pin.ts` (new): the PIN functions
- **No hardcoded or fake data.** Empty state = "Add a child in Settings".
- Never hardcode a PIN in code.

## 6. Still to do
1. Auth settings: Site URL, Redirect URLs (`http://localhost:3000/**`, Vercel URL + `/**`), Confirm email, leaked password protection.
2. Test the PIN flow end to end (set / verify / lockout / switch).
3. Save the schema into `supabase/migrations/` and generate `lib/database.types.ts`.
4. Fix the branches `child`, `Muhammad012344-patch-1` and `feature/parent-profile` to use this.
