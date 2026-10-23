# Voice AI

A voice-based AI tutor for kids. Children talk with an AI tutor that teaches lessons, quizzes them, and helps them track their goals and progress.

> This is a capstone project and is still in development.

**Built with:** [Next.js](https://nextjs.org) · [React](https://react.dev) · [Supabase](https://supabase.com) · [Tailwind CSS](https://tailwindcss.com)

---

## Getting started

### 1. Requirements

- [Node.js](https://nodejs.org) 24 or newer
- [Git](https://git-scm.com)

### 2. Clone and install

```bash
git clone https://github.com/ProBracket/Capstone_Project.git
cd Capstone_Project
npm install
```

### 3. Set up environment variables

Copy the example file:

```bash
cp .env.example .env
```

Then fill in the values. **Ask Gael for them — they are shared privately.**

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Address of our Supabase project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Supabase key used by the app |
| `SUPABASE_SECRET_KEY` | Private Supabase key — server only |

> ⚠️ Never commit `.env` or share these values publicly. `.env` is already ignored by Git.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally with live reload |
| `npm run lint` | Check the code for errors and style problems |
| `npm run build` | Build the app for production (also catches type errors) |

Run `npm run lint` and `npm run build` before opening a PR — CI runs the same checks.

---

## Project structure

| Folder | What goes here |
|---|---|
| `app/` | **Pages (routes).** Every folder with a `page.tsx` becomes a URL — `app/parentview/page.tsx` is `/parentview`. Only files named `page.tsx` are routed. |
| `lib/` | **Plain logic, no React.** The Supabase client, database queries, and helper functions. Anything here can be used from any page. |
| `components/` | **Reusable UI pieces** like `<Button>`, `<Card>`, `<Header>`. Use these instead of copying the same JSX into several pages. |
| `hooks/` | **Custom React hooks** (`useSomething()`) — state and effects shared by several pages, like `useCurrentUser()`. |
| `supabase/` | Supabase CLI config. Owned by @ProBracket. |

Only `app/` is special to Next.js — the rest are team conventions. Create `components/` or `hooks/` when the first file that needs it shows up; Git doesn't track empty folders.

### What goes where

Each layer only imports from the layers below it:

```
app/          pages: put components together, handle the UI
  ↓
components/   reusable UI pieces
  ↓
hooks/        React state + effects
  ↓
lib/          plain logic, talks to Supabase
```

- **Talking to Supabase?** Put it in `lib/`. Pages call those functions instead of using `supabase` directly. If the table or columns change, only `lib/` needs updating.
- **Copying the same JSX into a second page?** Move it into `components/`.
- **Copying the same `useState` + `useEffect` into a second page?** Move it into `hooks/`.
- **Only one page uses it?** Keep it in that page until a second page needs it.

### Current `lib/` files

| File | What it does |
|---|---|
| `lib/supabase.js` | Creates the one shared Supabase client. Import it from here — never call `createClient` in a page. |
| `lib/auth.ts` | Login session helpers: `getCurrentUser`, `onSignInOrOut`, `signOut`. |
| `lib/profile.ts` | Profile data: `getFullName`, `updateFullName`. The name is stored in the auth user's metadata for now; when we add a `profiles` table, its queries go here. |

---

## Team workflow

`main` is protected. **Nobody pushes to `main` directly** — every change goes through a pull request.

### Steps

1. **Get the latest `main`**
   ```bash
   git switch main
   git pull
   ```
2. **Create a branch** for your work
   ```bash
   git switch -c your-branch-name
   ```
3. **Commit and push** your changes
   ```bash
   git add .
   git commit -m "Describe what you changed"
   git push -u origin your-branch-name
   ```
4. **Open a pull request** into `main` on GitHub.
5. **Wait for the checks.** The **Lint and build** check runs automatically. If it fails, fix the errors and push again.
6. **Get a review.** A code owner must approve the PR (see below). Resolve every review comment.
7. **Merge** using **Squash and merge** or **Rebase and merge**. Your branch is deleted automatically afterward.

### Rules on `main`

- Changes must come through a pull request
- At least **1 approval** from a code owner
- The **Lint and build** check must pass
- All review conversations must be resolved
- New commits on a PR reset its approvals
- No force pushes, and `main` can't be deleted

### Who approves what

Defined in [`.github/CODEOWNERS`](.github/CODEOWNERS):

| Files | Who can approve |
|---|---|
| Everything (default) | @ProBracket, @LZlatunic, @Muhammad012344, @DarrylJuneau |
| `supabase/`, `lib/supabase.js` | @ProBracket only |
| `.github/CODEOWNERS` | @ProBracket only |

If your PR touches files from more than one group, it needs an approval from each group.

You can't approve your own PR — ask a teammate.
