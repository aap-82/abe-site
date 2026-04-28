# Claude Code Handoff — ABE Education Astro Site

**Project:** ABE Education marketing site
**Owner:** Andrey
**Repo:** GitHub `abe-site`
**Live:** https://abe-site.andrey-p-personal.workers.dev/ (Cloudflare Workers preview)
**Date:** 27 April 2026

This document gives you everything you need to take the project from its current state to a complete, production-ready v1. It's structured so you can read top to bottom, then begin work without further questions.

---

## 1. What's already built (verified live)

The site is deployed and serving three pages:

| URL | Status |
|---|---|
| `/` (homepage) | ✅ Renders, lists NSW course, has non-RTO disclosure |
| `/courses/nsw-owner-builder-course/` | ✅ Renders, shows reviewer, RTO partnership, price |
| `/compare/owner-builder/` | ✅ Renders, table shows NSW row |
| `/experts/dominic-ogburn` | ⚠️ Linked from course page — confirm it exists or build it |

**Architectural pieces confirmed working:**
- Astro project on Cloudflare Workers (the `.workers.dev` URL implies the Workers adapter is in use — see Critical Decision #1 below)
- Content Collections wired up (jurisdictions, experts, courses, faqs all referenced in working pages)
- Dynamic route `[...slug].astro` generating course pages from frontmatter
- Programmatic comparison page reading from collections
- Non-RTO authority disclosure appearing on every page
- Reviewer credit linking to expert profile
- Delivery RTO disclosure (`Blue Dog Training (RTO 40984)`)

**What's clearly missing in the current build:**

1. **No styling at all** — the rendered HTML uses default browser CSS. No DaisyUI classes, no Tailwind, no maroon brand colour, no fonts loaded
2. **No hero block** — the course page is plain markdown; no visual hierarchy, no pricing card, no CTAs
3. **No JSON-LD schema in the head** — Course / FAQPage / Person / BreadcrumbList all missing
4. **Markdown body of the course is the placeholder** ("[Content body in markdown...]")
5. **Only NSW exists** — WA, VIC, QLD, TAS, ACT not built
6. **No FAQs rendered** anywhere
7. **No sitemap.xml visible** — needs verification
8. **No `robots.txt` or `llms.txt`** visible
9. **No image optimisation** — no images on the page yet, but no `<Image>` setup confirmed

This is actually a good state to hand off from. The structure works; we now need the styling, schema, hero block, and content layers.

---

## 2. Critical decisions to confirm before starting

### Decision 1: Hosting target — Workers vs Pages

The current preview URL is `*.workers.dev`, which means the project is using `@astrojs/cloudflare` and deploying to **Cloudflare Workers**, not Cloudflare Pages.

**This is a deviation from the original build spec**, which targeted Cloudflare Pages with a fully static site (`output: 'static'` and no adapter).

Both approaches work for ABE. Briefly:

| Option | Pros | Cons |
|---|---|---|
| **Cloudflare Workers** (current) | More flexible, can add server functions later, `astro:env` works at runtime | Slightly more complex deploy, Workers may bill if traffic grows |
| **Cloudflare Pages** (original spec) | Simpler, fully static, generous free tier, no adapter needed | Server functions require Pages Functions (different API) |

**Action for Claude Code:** Don't change this without asking Andrey. Confirm he's happy staying on Workers, or whether to revert to static + Pages. **Default assumption: keep Workers as-is** — it's working, and the Astro 6 + Cloudflare Workers combination is now a first-class integration.

If staying on Workers, the build spec needs one update: section 3.5 of the build spec shows `output: 'static'` and no adapter. The reality should be:

```js
import cloudflare from '@astrojs/cloudflare';
// ...
export default defineConfig({
  output: 'static',  // or 'server' if dynamic features added later
  adapter: cloudflare(),
  // ... fonts, integrations, csp, vite as previously specified
});
```

### Decision 2: Astro version

Confirm with `npm list astro`. If it's anything below `6.0.0`, run `npx @astrojs/upgrade` and apply the patches in `docs/abe-astro-6-patch.md` (this should already exist in the repo per earlier handoffs).

### Decision 3: Tailwind / DaisyUI installed?

The bare HTML output strongly suggests neither is wired up correctly. First action after starting work: open `package.json` and check whether `tailwindcss`, `@tailwindcss/vite`, and `daisyui` are in dependencies. If not, install per build spec section 3.6.

---

## 3. Standing rules for this project

These apply to every commit, every component, every line of content you write. They are **non-negotiable**.

### Stack
- **Astro 6.x** (latest stable). Use `npx @astrojs/upgrade` if older.
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin. Do NOT use `@astrojs/tailwind` — it's deprecated for v4.
- **DaisyUI v5** as the primary component library.
- **HyperUI** (raw HTML/Tailwind snippets) for marketing-page sections not in DaisyUI.
- **Zero JavaScript shipped by default.** No React, no Vue, no Alpine, no shadcn, no Radix. No `client:*` directives without explicit user approval.
- **Zod 4** for content collection schemas.

### Authority model (CRITICAL — legal/regulatory)
- **ABE Education is NOT a Registered Training Organisation.** Never claim ASQA approval for ABE itself.
- **RTO 40984 is Blue Dog Training**, not ABE. Never display "RTO 40984" alongside ABE branding.
- **Accredited delivery flows through partner RTOs only** (Blue Dog Training, AlertForce). Always disclose this on course pages.
- **Reviewers** are real people from the Notion Experts DB:
  - Dominic Ogburn (CEO, licensed NSW builder, course reviewer)
  - Warwick Smith (compliance specialist, CDRG)
- **Build-time guards** in `src/lib/abe-authority.ts` define `prohibitedClaims` — never bypass these. If the build fails because a prohibited claim is detected, FIX THE CONTENT, don't disable the guard.

### Content
- **Australian English** in all content. "Organisation" not "organization". "Licence" (noun) / "license" (verb). "Specialise". "Centre". "Programme" not "program" except for software.
- **Never use the word "comprehensive."**
- **No fabricated testimonials.** If asked to add testimonials, request real ones from Andrey first.
- **Currency:** Australian dollars, formatted with `Intl.NumberFormat('en-AU')`.
- **Dates:** ISO 8601 in frontmatter (`2026-04-15`); display format via `Intl.DateTimeFormat('en-AU')`.

### Design system
- **DaisyUI semantic classes only** (`btn`, `card`, `badge`, `alert`, `hero`, `navbar`, `footer`, `collapse`, `table`, `stats`).
- **Theme tokens only** for colours: `bg-base-100`, `text-base-content`, `bg-primary`, `text-primary-content` etc. — never `bg-red-700` or `text-zinc-900`.
- **The ABE theme is defined in `src/styles/global.css`** with the Classic Maroon palette. If it doesn't exist, create it per build spec section 3.2.
- **Native HTML for interactivity wherever possible** — `<details>/<summary>` for accordions and mobile menus, `<dialog>` for modals.
- **Mobile-first responsive.** All components must work at 375px width.

### Performance
- **Lighthouse 100/100/100/100** is the target for every page in production.
- **Total JS shipped per page: 0 bytes** unless explicitly justified.
- **Images via `<Image>`** from `astro:assets` only. WebP, lazy by default, eager only for above-fold LCP candidates.
- **Fonts via the Astro 6 Fonts API** in `astro.config.mjs`, loaded via `<Font>` component in `BaseLayout`. Never `<link href="fonts.googleapis.com…">` in a component.

### Workflow
- **Commit messages prefixed with the build phase**, e.g. `[Phase 7.4] Build HeroCourse component`.
- **Small commits.** One concern per commit.
- **Run `npm run build` before pushing.** Don't push a broken build.
- **Confirm with Andrey before destructive changes** — deleting files, renaming routes, switching adapters.

---

## 4. The build plan — what to do, in order

Work through this top to bottom. Each phase has a clear stopping point. **Stop after each phase and let Andrey verify before proceeding to the next.**

### Phase A: Audit and stabilise the existing project

Goal: understand the current state, fix anything broken, get the toolchain on Astro 6.

1. Run `npm list astro` — confirm version
2. Run `npm list tailwindcss daisyui @tailwindcss/vite` — confirm what's installed
3. Open `astro.config.mjs` — confirm Workers adapter, Fonts API, integrations, CSP
4. Open `src/content/config.ts` — confirm Content Layer API (`glob` loaders), not legacy `type: 'content'`
5. Run `npm run build` — confirm zero errors
6. If Astro is below 6.0.0, run `npx @astrojs/upgrade` and apply `docs/abe-astro-6-patch.md`
7. If Tailwind/DaisyUI missing, install per build spec section 3.6
8. Commit a "Phase A complete" marker
9. **Stop. Report findings to Andrey.** What version, what's installed, what failed, what was fixed.

### Phase B: Apply the design system

Goal: make the site visually correct — ABE maroon, DM Sans/Archivo fonts, DaisyUI components.

1. Verify `src/styles/global.css` exists with the ABE theme block. If not, create per build spec section 3.2.
2. Wire `astro.config.mjs` Fonts API for DM Sans, Archivo, DM Mono (per Astro 6 patch document).
3. Update `src/layouts/BaseLayout.astro` to:
   - Import `global.css`
   - Use `<Font cssVariable="--font-sans" preload />` and `<Font cssVariable="--font-display" preload />`
   - Set `<html lang="en-AU" data-theme="abe">`
   - Have a named `<slot name="schema" />` in `<head>`
4. Build a DaisyUI navbar in `src/components/layout/Header.astro` — use `<details>` for mobile menu (no JS).
5. Build a DaisyUI footer in `src/components/layout/Footer.astro` — include the non-RTO disclosure.
6. Verify `npm run dev` shows the homepage in maroon with proper fonts.
7. Commit and push.
8. **Stop.** Confirm with Andrey that the visual identity matches expectations before continuing.

### Phase C: Build the HeroCourse block

Goal: replace the bare markdown rendering on course pages with a proper hero.

1. Read [`hero-course-worked-example.md`](../hero-course-worked-example.md) (at the repo root). Build `src/components/blocks/HeroCourse.astro` exactly per that spec.
2. Update `src/pages/courses/[...slug].astro` to render `<HeroCourse>` above `<Content />`.
3. Confirm headshot for Dominic exists at `public/images/experts/dominic-ogburn.webp` (cached locally — Notion file URLs expire).
4. If the headshot isn't there, write the prebuild script (or run it) to fetch from Notion.
5. Run `npm run build` and `npm run preview` — confirm the NSW course page now has a proper hero with maroon CTA, pricing card, reviewer trust signal.
6. Commit and push.
7. **Stop.** Andrey reviews the live page.

### Phase D: Add the schema layer

Goal: make every course page emit valid JSON-LD for Course, BreadcrumbList, Person (reviewer), FAQPage.

1. Confirm `src/components/seo/CourseSchema.astro` exists and is correct (it should — earlier handoff produced it).
2. Build `src/components/seo/BreadcrumbSchema.astro` — generates `BreadcrumbList` JSON-LD from the page hierarchy.
3. Build `src/components/seo/PersonSchema.astro` — generates `Person` JSON-LD from an expert collection entry, including `sameAs`, `jobTitle`, credentials.
4. Confirm `src/components/seo/FaqSchema.astro` exists and emits `FAQPage` JSON-LD.
5. Wire all four into `src/pages/courses/[...slug].astro` via the `<Fragment slot="schema">` pattern.
6. Validate the live page using https://validator.schema.org/ — expect zero errors.
7. Validate with Google Rich Results Test — expect Course, FAQPage, BreadcrumbList all detected.
8. Commit and push.
9. **Stop.** Report validator output to Andrey.

### Phase E: Replace placeholder content with real content

Goal: real course body content, real FAQs, real entity coverage for the NSW Owner Builder page.

1. The current course markdown body is `[Content body in markdown...]`. Replace with proper content.
2. Suggested structure for the body (in this order):
   - "Who needs a NSW Owner Builder Permit?" (H2)
   - "What does the course cover?" (H2)
   - "How to apply for your Owner Builder Permit" (H2) — step-by-step, links to NSW Fair Trading
   - "Costs explained" (H2) — course price + permit application fee
   - "What happens after the course" (H2)
3. Source content: Andrey has an `abe-seo-content-engine` skill. **Ask him to either run that skill himself and paste the output, or share the existing NSW Owner Builder content from his current LearnWorlds/Framer site.** Do not write it from scratch without source material.
4. Create `src/content/faqs/` entries for the four FAQs referenced in the NSW course frontmatter:
   - `nsw-ob-do-i-need-course.md`
   - `nsw-ob-how-long.md`
   - `nsw-ob-permit-cost.md`
   - `nsw-ob-can-i-sell.md`
   - Each must include `question`, `answer`, `appliesTo`, `lastReviewed`, `reviewedBy`. See build spec section 4 for the schema.
5. Build `src/components/content/FaqAccordion.astro` per `docs/abe-astro-6-patch.md` Patch 7 (DaisyUI `collapse collapse-arrow`, async render with `Promise.all`).
6. Wire the FaqAccordion into the course page below the main content.
7. Commit and push.
8. **Stop.** Andrey reviews the complete NSW page.

### Phase F: Replicate to remaining states

Goal: WA, VIC, QLD, TAS, ACT Owner Builder pages all live, all using the same template.

1. For each state, create:
   - `src/content/jurisdictions/{state-code-lowercase}.md` — regulator, permit form, fees, threshold, legislation references
   - `src/content/courses/{state}-owner-builder.md` — same frontmatter shape as NSW, state-specific values
   - State-specific FAQs where required (e.g. permit fees differ)
2. Source data: search the regulator's official website. WA = Department of Mines, Industry Regulation and Safety. VIC = VBA. QLD = QBCC. TAS = CBOS. ACT = Access Canberra. Cite the URL in the `legislationReferences[].url` field.
3. **Do not invent fees, thresholds, or form names.** If a value can't be confirmed, ask Andrey.
4. After each state is added, run `npm run build` to confirm the comparison page picks it up automatically.
5. Commit one state at a time: `[Phase F] Add WA Owner Builder course`, `[Phase F] Add VIC...`, etc.
6. After all six states, run schema validation on each.
7. **Stop.** Andrey reviews the comparison page (should now have 6 rows) and at least 2 of the new state pages.

### Phase G: Polish and SEO completeness

Goal: tie everything off so the site is launch-ready.

1. Confirm `@astrojs/sitemap` is installed and `astro.config.mjs` is configured for it. Visit `/sitemap-index.xml` after build to verify.
2. Create `public/robots.txt`:
   ```
   User-agent: *
   Allow: /
   Sitemap: https://abeeducation.edu.au/sitemap-index.xml
   ```
3. Create `src/pages/llms.txt.ts` — generates an `llms.txt` listing all published courses for AI crawlers (ChatGPT, Perplexity, Claude). Format: see https://llmstxt.org/.
4. Add Open Graph + Twitter Card meta to `BaseLayout.astro` — pull from page props (`title`, `description`, optional `ogImage`).
5. Add a canonical URL to `BaseLayout.astro` based on `Astro.url`.
6. Run Lighthouse on the NSW course page. Target: 100/100/100/100. If anything is below 100, fix before moving on.
7. Run Schema.org validator + Google Rich Results Test on at least 3 pages (homepage, NSW course, comparison hub).
8. Commit and push.
9. **Stop.** Final review with Andrey before any custom domain switch.

### Phase H: Custom domain (Andrey-driven, you assist)

Don't initiate this — Andrey will tell you when. When he does:
1. He configures the custom domain in Cloudflare Workers/Pages dashboard.
2. You build the redirect map (`public/_redirects`) from the old URL structure to the new one. Andrey provides the old URL list (likely from Search Console or his current LearnWorlds setup).
3. You verify SSL is active and all redirects resolve.

---

## 5. Files you should already find in the repo

Before starting, confirm these exist. If any are missing, that's the first thing to flag.

```
docs/
  abe-astro-build-spec.md        ← architecture and rules
  abe-astro-6-patch.md           ← Astro 6 migration patches
  abe-windows-setup.md           ← Andrey's setup guide
  abe-claude-code-handoff.md     ← this file
  CLAUDE.md                      ← project context loaded by Claude Code

hero-course-worked-example.md    ← at repo root (not in docs/) — reference for HeroCourse.astro

src/
  content/
    config.ts                    ← Zod schemas, must use Content Layer API
    courses/
      nsw-owner-builder.md       ← exists (verified)
    experts/
      dominic-ogburn.md          ← inferred to exist (linked from live page)
    jurisdictions/
      nsw.md                     ← inferred to exist (data appears on compare page)
    faqs/                        ← unclear; check
  components/
    seo/
      CourseSchema.astro         ← drafted earlier
      FaqSchema.astro            ← drafted earlier
    content/
      FaqAccordion.astro         ← drafted earlier (has bug — see Patch 7)
  layouts/
    BaseLayout.astro             ← may exist; check styling
    CourseLayout.astro           ← may exist; check
  pages/
    index.astro                  ← exists (homepage)
    courses/
      [...slug].astro            ← exists, working
    compare/
      owner-builder.astro        ← exists, working
    experts/
      [slug].astro               ← unclear; check
  lib/
    abe-authority.ts             ← drafted earlier
  styles/
    global.css                   ← may or may not exist
```

---

## 6. The ABE brand theme — exact values

If `src/styles/global.css` doesn't have it, create it. This is the canonical version:

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: abe --default;
  logs: false;
}

@plugin "daisyui/theme" {
  name: "abe";
  default: true;
  prefersdark: false;
  color-scheme: light;

  --color-base-100: oklch(99% 0.003 60);
  --color-base-200: oklch(96% 0.005 60);
  --color-base-300: oklch(92% 0.008 60);
  --color-base-content: oklch(20% 0.02 280);

  --color-primary: oklch(38% 0.12 15);
  --color-primary-content: oklch(98% 0.005 60);

  --color-secondary: oklch(55% 0.12 40);
  --color-secondary-content: oklch(98% 0.005 60);

  --color-accent: oklch(70% 0.15 85);
  --color-accent-content: oklch(20% 0.02 280);

  --color-neutral: oklch(25% 0.015 280);
  --color-neutral-content: oklch(95% 0.005 60);

  --color-info: oklch(60% 0.14 230);
  --color-info-content: oklch(98% 0.005 230);
  --color-success: oklch(55% 0.14 145);
  --color-success-content: oklch(98% 0.005 145);
  --color-warning: oklch(75% 0.16 75);
  --color-warning-content: oklch(20% 0.02 75);
  --color-error: oklch(55% 0.20 25);
  --color-error-content: oklch(98% 0.005 25);

  --radius-selector: 0.5rem;
  --radius-field: 0.375rem;
  --radius-box: 0.75rem;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 1;
  --noise: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.01em;
}
```

**Note:** `--font-sans`, `--font-display`, `--font-mono` are set automatically by the Astro 6 Fonts API — don't add an `@theme` block redefining them.

**Note 2:** The maroon OKLCH values are placeholders that approximate ABE's Classic Maroon. Andrey will refine the exact hue when he confirms the brand spec — flag this as a question if the design ends up looking off.

---

## 7. The Astro 6 Fonts API setup

In `astro.config.mjs`:

```js
import { defineConfig, fontProviders } from 'astro/config';
// ... other imports

export default defineConfig({
  // ... site, output, adapter, integrations, vite
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'DM Sans',
      cssVariable: '--font-sans',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext']
    },
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-display',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext']
    },
    {
      provider: fontProviders.google(),
      name: 'DM Mono',
      cssVariable: '--font-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin']
    }
  ]
});
```

In `src/layouts/BaseLayout.astro`:

```astro
---
import '@/styles/global.css';
import { Font } from 'astro:assets';

interface Props {
  title?: string;
  description?: string;
  canonicalUrl?: string;
}

const {
  title = 'ABE Education',
  description = 'Australian online training for owner builders, White Card, and CPD.',
  canonicalUrl = new URL(Astro.url.pathname, Astro.site).href
} = Astro.props;
---

<!doctype html>
<html lang="en-AU" data-theme="abe">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />

    <Font cssVariable="--font-sans" preload />
    <Font cssVariable="--font-display" preload />
    <Font cssVariable="--font-mono" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta name="twitter:card" content="summary_large_image" />

    <slot name="schema" />
  </head>
  <body class="bg-base-100 text-base-content font-sans antialiased min-h-screen flex flex-col">
    <slot />
  </body>
</html>
```

---

## 8. SEO requirements checklist

Every published page must satisfy all of these. Use this as the QA gate before marking any phase complete.

**Meta**
- [ ] `<title>` set, ≤ 60 characters
- [ ] `<meta name="description">` set, ≤ 155 characters
- [ ] `<link rel="canonical">` present and absolute
- [ ] Open Graph: `og:type`, `og:title`, `og:description`, `og:url`, optional `og:image`
- [ ] Twitter: `twitter:card` set
- [ ] `<html lang="en-AU">`

**Structured data (JSON-LD)**
- [ ] BreadcrumbList on every page below the homepage
- [ ] Course on every course page (with `hasCourseInstance`, `offers`, `educationalCredentialAwarded`, `provider`)
- [ ] FAQPage on every page with FAQs
- [ ] Person on every page that cites a reviewer (links to the expert's `@id`)
- [ ] Organization in the global layout (ABE Education, with `sameAs` pointing to LinkedIn etc.)
- [ ] All schema validates with zero errors at validator.schema.org
- [ ] Google Rich Results Test detects the expected rich result types

**Content / E-E-A-T**
- [ ] H1 present, single, matches `course.data.h1` from frontmatter
- [ ] Reviewer name + credential + link visible on the page (not just in schema)
- [ ] Last reviewed date visible (`<time datetime="...">`) and matches `course.data.lastReviewed`
- [ ] Delivery RTO disclosure visible on accredited course pages
- [ ] Non-RTO disclosure in footer

**Performance / Core Web Vitals**
- [ ] Lighthouse Performance ≥ 95 (target 100)
- [ ] Lighthouse Accessibility 100
- [ ] Lighthouse Best Practices 100
- [ ] Lighthouse SEO 100
- [ ] Total JS shipped: 0 bytes (verify in DevTools Network tab, filter "JS")
- [ ] LCP < 1.5s on a fast connection
- [ ] CLS = 0 (no layout shift)

**Crawl / discovery**
- [ ] `/sitemap-index.xml` exists and includes all published pages
- [ ] `/robots.txt` exists, allows all, references sitemap
- [ ] `/llms.txt` exists, lists key URLs for AI crawlers

---

## 9. Things to ask Andrey before you start

Don't begin Phase A without answers to these:

1. **Adapter:** stay on Cloudflare Workers (current) or revert to static + Pages?
2. **Notion sync:** is the prebuild script for syncing Experts from Notion implemented and working? If not, are the existing `src/content/experts/*.md` files manually maintained for now?
3. **Headshot for Dominic:** is `public/images/experts/dominic-ogburn.webp` already in the repo? If not, do you need access to the Notion Experts DB via MCP to fetch it?
4. **Brand maroon:** the OKLCH placeholder is approximate. Is there an exact hex code from the existing Framer/Canva brand guide?
5. **Course content:** do you have the existing NSW Owner Builder content from LearnWorlds or Framer to migrate, or should I generate fresh content via the `abe-seo-content-engine` skill outputs?
6. **Custom domain:** when (if ever in this engagement) are you planning to point `abeeducation.edu.au` at this site? Affects how aggressive to be on Phase G.

---

## 10. How to work with Andrey

- Andrey is non-technical but understands architecture at a high level. He runs the business, oversees content, and treats Claude Code as the implementation layer.
- He prefers small, verifiable steps over big batches.
- He'll catch you if you skip standing rules — especially the non-RTO authority rules and Australian English. He cares deeply about both.
- He's actively running an investigation into a competitor (Edway) for content theft and false credential claims. The non-RTO discipline is not academic for ABE.
- When in doubt about content authority, regulatory accuracy, or business decisions: stop and ask. Don't guess.
- Australian English. Australian dollars. Australian regulators. Don't drift to American defaults.

---

## 11. First message to send back

After reading this document, your first response to Andrey should be:

1. Confirmation you've read this handoff and the four supporting docs ([`abe-astro-build-spec.md`](abe-astro-build-spec.md), [`hero-course-worked-example.md`](../hero-course-worked-example.md), [`abe-astro-6-patch.md`](abe-astro-6-patch.md), [`abe-windows-setup.md`](abe-windows-setup.md)).
2. The output of the Phase A audit (Astro version, what's installed, what's missing, what failed in build).
3. Answers required from Andrey to the questions in section 9.
4. A proposed first commit — usually applying the Astro 6 patches if needed, or installing missing dependencies.

**Do not begin any code changes until Andrey confirms the audit results and answers section 9.** This is the standing rule that protects against churn.

---

## 12. Success criteria for v1

You are done with v1 when:

- [ ] All eight states with Owner Builder requirements have a course page (NSW, VIC, QLD, WA, SA, TAS, ACT, NT — even if SA/NT just say "no permit course required")
- [ ] Every page passes Lighthouse 100/100/100/100
- [ ] Every page validates schema with zero errors
- [ ] The comparison hub shows all states
- [ ] Both reviewers (Dominic, Warwick) have profile pages
- [ ] Robots.txt, sitemap, llms.txt all live
- [ ] Total JS shipped per page: 0 bytes (verified)
- [ ] All standing rules in section 3 are upheld across the codebase
- [ ] Andrey has signed off on the visual identity, content, and SEO setup

White Card, CPD, hub pages, and blog migration are **v1.5 and beyond** — out of scope for this handoff unless Andrey says otherwise.

Good luck. Ask questions; don't guess.
