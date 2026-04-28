# ABE Astro Site — Windows Setup Guide

**For:** Andrey, working on Windows 10 or 11.
**End state:** Local Astro project + GitHub repo + Cloudflare Pages auto-deploy + Claude Code in your terminal.
**Time:** 2–3 hours total, much of it waiting on installs.
**Cost:** $0 ongoing.

---

## Phase 0 — Prerequisites

You need three accounts and four pieces of software.

### 0.1 Accounts

- **GitHub** — github.com, sign up if you don't have one (free)
- **Cloudflare** — cloudflare.com, sign up (free). You probably already have one if your domain DNS is on Cloudflare
- **Anthropic** — already have it via Claude

### 0.2 Software on Windows

You need:

1. **Windows Terminal** (if not already installed)
2. **Git for Windows**
3. **Node.js LTS**
4. **VS Code**

#### Install Windows Terminal

If you're on Windows 11, you already have it. On Windows 10, install from the Microsoft Store: search "Windows Terminal", click Get. This is a much better terminal than the old Command Prompt — tabs, colours, proper paste behaviour.

From this point on, "open Terminal" means: press `Win` key, type `terminal`, press Enter.

#### Install Git for Windows

The cleanest way is via **winget** (Windows Package Manager — built into Windows 11 and modern Windows 10). In Terminal:

```powershell
winget install --id Git.Git -e --source winget
```

If `winget` isn't recognised, download Git directly from **git-scm.com/download/win** and run the installer. Accept all defaults — they're sensible.

After installation, **close and reopen Terminal** (the new commands need a fresh session).

Verify:

```powershell
git --version
```

You should see `git version 2.40.x` or higher.

#### Install Node.js

```powershell
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

Or download from **nodejs.org** (pick the LTS version — currently 22).

Close and reopen Terminal. Verify:

```powershell
node --version
npm --version
```

Node should be v20 or higher. npm v10 or higher.

#### Install VS Code

```powershell
winget install --id Microsoft.VisualStudioCode -e --source winget
```

Or download from **code.visualstudio.com**. Accept defaults; **make sure** the option "Add to PATH" is ticked during install — it lets you open VS Code from Terminal with the `code` command.

Verify by closing Terminal, reopening, and running:

```powershell
code --version
```

### 0.3 Tell Git who you are

Replace with your real name and the email you'll use on GitHub:

```powershell
git config --global user.name "Andrey [your last name]"
git config --global user.email "your-email@abeeducation.edu.au"
```

Also tell Git which editor to use for commit messages:

```powershell
git config --global core.editor "code --wait"
```

And handle line endings properly (Windows-specific, important):

```powershell
git config --global core.autocrlf true
```

### 0.4 Connect Git to GitHub via SSH

This means you never type a password when pushing code.

**Generate an SSH key:**

```powershell
ssh-keygen -t ed25519 -C "your-email@abeeducation.edu.au"
```

Press Enter through all prompts (default location, no passphrase is fine).

**Copy the public key to your clipboard:**

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```

**Add it to GitHub:**

Go to **github.com/settings/keys** → **New SSH key** → title it "Windows desktop" or similar → paste → save.

**Test the connection:**

```powershell
ssh -T git@github.com
```

First time: it'll ask "Are you sure you want to continue?" — type `yes`. You should then see *"Hi [your-username]! You've successfully authenticated…"*.

If it complains, the SSH agent might not be running. Start it:

```powershell
Get-Service -Name ssh-agent | Set-Service -StartupType Manual
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

Then re-run the test.

### Phase 0 checkpoint ✅

All four should print versions / succeed:

```powershell
git --version
node --version
code --version
ssh -T git@github.com
```

If any fail, fix that one before moving on.

---

## Phase 1 — Create the Astro project locally

### 1.1 Pick a folder

PowerShell convention is `C:\Users\YourName\Sites\` or similar. Create it:

```powershell
mkdir $env:USERPROFILE\Sites
cd $env:USERPROFILE\Sites
```

### 1.2 Run the Astro project creator

```powershell
npm create astro@latest abe-site
```

Answer the questions:

| Question | Your answer |
|---|---|
| How would you like to start? | **Empty** |
| Plan to write TypeScript? | **Yes** |
| How strict? | **Strict** |
| Install dependencies? | **Yes** |
| Initialize a new git repository? | **Yes** |

This creates `~/Sites/abe-site/`.

### 1.3 Open in VS Code

```powershell
cd abe-site
code .
```

### 1.4 Run the dev server

In VS Code, open the integrated terminal: `Ctrl + ` ` (the backtick under Esc) — or `View → Terminal`.

Make sure it's set to **PowerShell**, not Command Prompt (top right of the terminal panel).

Run:

```powershell
npm run dev
```

You should see:

```
astro v5.x.x ready in 482 ms
┃ Local    http://localhost:4321/
```

Open that URL in your browser. You should see the empty Astro starter page.

To stop the server later: `Ctrl + C` in the terminal.

### Phase 1 checkpoint ✅

- [ ] Folder `~\Sites\abe-site\` exists
- [ ] You can open it in VS Code
- [ ] `npm run dev` runs and shows a page on localhost:4321

---

## Phase 2 — Add Tailwind, DaisyUI, and the ABE theme

Same as the Mac version — Node and npm work identically across operating systems.

### 2.1 Install Tailwind v4 + DaisyUI v5 + supporting integrations

```powershell
npm install tailwindcss @tailwindcss/vite daisyui
npm install @astrojs/mdx @astrojs/sitemap
```

### 2.2 Configure Astro

Replace `astro.config.mjs` with:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://abeeducation.edu.au',
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'en-AU', locales: { 'en-AU': 'en-AU' } },
      changefreq: 'weekly',
      priority: 0.7
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

### 2.3 Create `src/styles/global.css`

In VS Code: right-click `src/` → New Folder → `styles` → right-click `styles/` → New File → `global.css`. Paste the ABE theme from build spec section 3.2 (the OKLCH theme block).

### 2.4 Set up the path alias

Replace `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

### 2.5 Test the theme renders

Replace `src/pages/index.astro` with the test page from the build spec (the maroon button check). Run `npm run dev`, verify the page shows the maroon styling.

### Phase 2 checkpoint ✅

- [ ] Maroon heading + maroon button visible at localhost:4321
- [ ] No errors in browser console (F12 → Console)

---

## Phase 3 — Push to GitHub

### 3.1 Create the GitHub repo

github.com → **+** top right → **New repository**.

| Field | Value |
|---|---|
| Name | `abe-site` |
| Visibility | **Private** |
| README, .gitignore, license | All **off** |

Click **Create**.

### 3.2 Connect local to GitHub

GitHub shows you the commands. In your VS Code terminal, run:

```powershell
git remote add origin git@github.com:YOURUSERNAME/abe-site.git
git branch -M main
git add .
git commit -m "Initial Astro setup with DaisyUI theme"
git push -u origin main
```

Replace `YOURUSERNAME` with yours.

### Phase 3 checkpoint ✅

Refresh your GitHub repo page — all files visible.

---

## Phase 4 — Connect Cloudflare Pages

### 4.1 Create the Pages project

dash.cloudflare.com → **Workers & Pages** (left sidebar) → **Create application** → **Pages** tab → **Connect to Git**.

### 4.2 Authorise GitHub

- **Connect GitHub**
- Choose **Only select repositories** → pick `abe-site`
- **Install & Authorize**

### 4.3 Configure the build

| Field | Value |
|---|---|
| Project name | `abe-site` |
| Production branch | `main` |
| Framework preset | **Astro** |
| Build command | `npm run build` (auto) |
| Build output directory | `dist` (auto) |

**Add environment variable:**

| Name | Value |
|---|---|
| `NODE_VERSION` | `22` |

Click **Save and Deploy**.

### 4.4 Watch the build

1–3 minutes. If it fails, the logs tell you why. Most likely first-time errors:

- **Missing dependency** → you forgot to commit `package.json` after `npm install`
- **Wrong Node version** → add `NODE_VERSION = 22` env var

### 4.5 Visit the live site

Cloudflare gives you `abe-site.pages.dev`. The maroon button should appear there too.

### Phase 4 checkpoint ✅

- [ ] First Cloudflare build succeeded
- [ ] `abe-site.pages.dev` shows your test page

---

## Phase 5 — Verify the deploy pipeline

Edit `src/pages/index.astro`, change the heading text, save.

```powershell
git add .
git commit -m "Test deploy pipeline"
git push
```

Watch Cloudflare auto-deploy. Refresh the live site — your change should appear within 60–90 seconds.

**This is the entire workflow you'll use forever.**

---

## Phase 6 — Install Claude Code on Windows

Claude Code runs natively on Windows now (the WSL requirement was lifted in 2025).

### 6.1 Install

```powershell
npm install -g @anthropic-ai/claude-code
```

Verify:

```powershell
claude --version
```

If `claude` isn't recognised, your npm global path isn't on your PATH. Fix:

```powershell
npm config get prefix
```

Add the resulting path (plus `\bin` or just the path itself) to your Windows PATH:
- Press `Win + R`, type `sysdm.cpl`, Enter
- Advanced tab → Environment Variables
- Under "User variables", select `Path` → Edit → New → paste the path → OK

Close and reopen Terminal. Try `claude --version` again.

### 6.2 Sign in

```powershell
claude
```

First run prompts you to sign in. Follow the link, authenticate, paste the token back.

### 6.3 Open Claude Code in your project

```powershell
cd $env:USERPROFILE\Sites\abe-site
claude
```

### 6.4 Test it

In the Claude Code prompt:

```
Change the test heading on the homepage to say "ABE Education — Powered by Claude Code"
and commit the change with a clear message, then push to GitHub.
```

Watch it edit, commit, push. Refresh the live site — change should appear.

### Phase 6 checkpoint ✅

- [ ] Claude Code runs from your project folder
- [ ] It can edit, commit, and push successfully

---

## Phase 7 — Repair the existing skeleton, then continue

This is where your situation differs from a fresh setup. You already have most of section 4–9 of the build spec done. What's missing is what we identified at the top:

### 7.1 Save the docs into the project

Create `docs/` folder in your project, drop in:

- `build-spec.md`
- `hero-course-example.md`
- `windows-setup-guide.md` (this file)

### 7.2 Brief Claude Code

Open Claude Code in the project. Paste:

```
You're working on the ABE Education Astro site. Read these files first:

1. docs/build-spec.md — architecture and rules
2. docs/hero-course-example.md — reference block
3. The existing src/ to understand what's already built

Standing rules:
- DaisyUI semantic classes only — no hardcoded Tailwind colours
- Zero JavaScript by default — no React, no client:* directives
  unless we discuss first
- Australian English in all content
- Never use the word "comprehensive"
- ABE is NOT an RTO — never claim ASQA approval for ABE itself
- Reviewers: Dominic Ogburn (CEO, licensed NSW builder),
  Warwick Smith (compliance specialist, CDRG)
- Commit messages prefixed with build phase, e.g.
  "[Phase 7.3] Add BaseLayout component"

Confirm you've read everything, then we'll fix the missing pieces.
```

### 7.3 First Claude Code task — fix the broken build

```
The build is currently broken because:

1. src/pages/courses/[...slug].astro imports four schema components
   but only CourseSchema and FaqSchema exist.
2. It imports CourseLayout which doesn't exist.
3. The compare page imports BaseLayout which doesn't exist.
4. nsw-owner-builder.md references reviewer "dominic-ogburn",
   jurisdiction "nsw", and four FAQs that don't exist as content
   files yet.
5. FaqAccordion uses faq.rendered.html which is not the Astro 5 API
   for collection content rendering.

Fix in this order:
1. Create the missing content collection entries:
   - src/content/experts/dominic-ogburn.md (use the Notion Experts DB
     via MCP — pull credentials, headshot, bios)
   - src/content/experts/warwick-smith.md (same)
   - src/content/jurisdictions/nsw.md (regulator: NSW Fair Trading,
     permit form, fees, legislation refs to Home Building Act 1989)
   - src/content/faqs/nsw-ob-do-i-need-course.md (and three others
     referenced by nsw-owner-builder.md)
2. Cache reviewer headshots locally to public/images/experts/
3. Create src/layouts/BaseLayout.astro (loads global.css, fonts,
   has slot for content)
4. Create src/layouts/CourseLayout.astro (extends BaseLayout, has
   schema slot, header, footer, sticky enrol bar slot)
5. Create src/components/seo/BreadcrumbSchema.astro
6. Create src/components/seo/PersonSchema.astro (uses the experts
   collection, includes credentials, sameAs, prohibitedClaims awareness)
7. Fix FaqAccordion to use the correct Astro 5 render API
8. Run npm run build and confirm zero errors

Stop after step 8. Don't build the HeroCourse block or other pages yet.
I want to verify the foundation works before going further.
```

### 7.4 Second task — build the HeroCourse block

After the build succeeds:

```
Build src/components/blocks/HeroCourse.astro exactly per
docs/hero-course-example.md. Then wire it into [...slug].astro
above the <Content /> render.

Run npm run dev and check that:
- /courses/nsw-owner-builder-course/ renders
- The maroon CTA appears
- The reviewer headshot loads from public/images/experts/
- View Source shows the JSON-LD schema in the head

Do not optimise or refactor. Just build per the example.
```

### 7.5 Third task — replicate

After HeroCourse works on NSW:

```
Replicate the Owner Builder course to all remaining states:
WA, VIC, QLD, TAS, ACT.

For each:
- Create src/content/jurisdictions/[state].md (use real regulator
  data — research via web_fetch from each state's regulator site if
  you don't have it)
- Create src/content/courses/[state]-owner-builder.md (same template
  as NSW, state-specific values)
- Reuse FAQs where universal, create state-specific ones where
  required (e.g. permit fees, regulator name)

Pause after each state and let me review.
```

---

## Phase 8 — Custom domain (when ready to launch)

In Cloudflare Pages → your project → **Custom domains** → **Set up a custom domain** → enter `abeeducation.edu.au` (or `astro.abeeducation.edu.au` for staging first).

If your DNS is on Cloudflare (which it likely is): auto-configures. Wait 5–15 minutes for SSL.

Before pointing the production domain at the new site, make sure you have:

1. **A redirect map** in `public/_redirects` — every old URL → new URL with 301 status. Tell Claude Code to generate this from your existing site's URL list.
2. **All ranking pages migrated** — pull the top 50 pages by traffic from Search Console and confirm each has an Astro equivalent
3. **A staging URL test pass** — full Lighthouse + schema validation + click-through to LearnWorlds checkout

---

## Windows-specific gotchas to watch for

**File paths** — Astro and Node use forward slashes, even on Windows. Don't manually edit imports to use backslashes.

**Line endings** — Git config `core.autocrlf true` (set in 0.3) handles this automatically. If you ever see weird "all lines changed" diffs, this is why; check your config.

**Long path errors** — If you ever get an error about a path being too long (rare with Astro, common with deeply nested node_modules), enable long paths:

```powershell
# Run as Administrator
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1
```

Then restart.

**PowerShell execution policy** — If a script ever fails with "running scripts is disabled on this system":

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**npm permissions** — Don't run npm as Administrator. If you ever get permission errors on global installs, the fix is to set npm's prefix to a user-writable location:

```powershell
npm config set prefix "$env:USERPROFILE\AppData\Roaming\npm"
```

**Antivirus slowdowns** — Windows Defender can slow npm installs dramatically. Add an exclusion for your projects folder: Settings → Privacy & security → Windows Security → Virus & threat protection → Manage settings → Exclusions → Add `C:\Users\YourName\Sites`.

---

## Daily working rhythm (after setup)

Open Terminal:

```powershell
cd $env:USERPROFILE\Sites\abe-site
git pull              # if you committed from another machine
claude                # start Claude Code session
```

Tell Claude what to build. Approve commits as they're proposed. Push when ready. Watch Cloudflare deploy.

Suggested aliases — paste these into your PowerShell profile so you don't retype paths:

```powershell
# Open your profile for editing
code $PROFILE
```

If the file doesn't exist, PowerShell creates it. Add:

```powershell
function abe { cd $env:USERPROFILE\Sites\abe-site; claude }
function abe-dev { cd $env:USERPROFILE\Sites\abe-site; npm run dev }
function abe-build { cd $env:USERPROFILE\Sites\abe-site; npm run build }
```

Save, close, reopen Terminal. Now you can just type `abe` to jump straight into Claude Code in the project, or `abe-dev` to start the local server.

---

## Where you are right now (reading your uploaded files)

You're effectively at **Phase 7 step 7.3**. The skeleton is there but the build is broken. Get the missing collection entries and layouts in, the build will go green, and from there it's progressive layering.

Suggested next 3 actions:

1. **Verify Phases 0–6 are complete** — can you run `npm run build` (it'll fail, but the *toolchain* should at least try to build)? Does Cloudflare see the GitHub repo?
2. **Drop these three docs into `docs/` in your repo** and commit them — gives Claude Code the full context.
3. **Run the Phase 7.3 prompt above** — let Claude Code repair the broken build before adding anything new.

Once the green build hits Cloudflare and you can see *something* live (even if it's incomplete), the rest is iteration.
