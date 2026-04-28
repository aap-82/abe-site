# Phase A — Audit & Stabilise — Complete

Per [abe-claude-code-handoff.md](abe-claude-code-handoff.md) section 4, Phase A
goal: "understand the current state, fix anything broken, get the toolchain
on Astro 6". Done.

## Stack confirmed (matches spec section 3.6 + Patch 2)

| Dependency | Spec | Installed | Notes |
|---|---|---|---|
| `astro` | `^6.0.0` | `6.1.9` | ✓ |
| `@astrojs/mdx` | `^5.0.0` | `^5.0.4` | ✓ |
| `@astrojs/sitemap` | `^4.0.0` | `^3.7.2` | one major behind, works on Astro 6.1 |
| `@tailwindcss/vite` | `^4.0.0` | `~4.1.18` | pinned: `4.2.x` pulls Vite 8 which breaks Astro 6's Vite 7 |
| `tailwindcss` | `^4.0.0` | `~4.1.18` | same pin |
| `@tailwindcss/typography` | `^0.5.15` | `^0.5.19` | ✓ |
| `daisyui` | `^5.0.0` | `^5.5.19` | ✓ |
| `zod` | `^4.0.0` | `^4.3.6` | ✓ canonical `z.url()` syntax |
| `@notionhq/client` | n/a | `^4.0.2` | pinned: v5 renamed `databases.query` |
| `tsx`, `js-yaml`, `@types/js-yaml` | dev | ✓ | sync script deps |

## Architecture decisions (per section 9 answers)

| # | Decision |
|---|---|
| 1 | **Hosting:** stay on Cloudflare Workers + Static Assets (current). `output: 'static'` + `wrangler.jsonc` with `assets.directory: ./dist`. No `@astrojs/cloudflare` adapter. URL: [abe-site.andrey-p-personal.workers.dev](https://abe-site.andrey-p-personal.workers.dev) |
| 2 | **Notion sync:** wired as `prebuild` script, with graceful skip when `NOTION_TOKEN` missing. Local dev and CI without the secret continue to work; existing `src/content/experts/*.md` is the source of truth in that case |
| 3 | **Headshots:** stored locally at `public/images/experts/<slug>.webp`. Schema accepts `headshotPath` (local) alongside `headshotUrl` (CDN fallback) |
| 4 | **Brand maroon:** `#800000` → `oklch(38% 0.13 29)` in DaisyUI theme |
| 5 | **Course content:** placeholder; user will provide Phase E |
| 6 | **Custom domain:** out of scope ("don't use custom") |
| 7 | **Experts schema reconciliation (option B):** kept rich Notion-derived shape; added optional alias fields (`title`, `headshotPath`, `credentialPills`, `sameAs`) so spec components (HeroCourse, PersonSchema) work without forking |
| 8 | **`@tailwindcss/typography`:** installed |
| 9 | **Zod 4 upgrade:** done; canonical `z.url()` everywhere |
| 10 | **Workflow:** direct-to-main on green builds |

## What's broken or missing (deferred)

These are all out of scope for Phase A — they're handled by their named phases.

| Item | Phase |
|---|---|
| DaisyUI navbar / footer / mobile menu (Header.astro / Footer.astro) | B |
| HeroCourse block | C |
| Real reviewer headshot file at `public/images/experts/dominic-ogburn.webp` | B (user uploads) |
| BreadcrumbSchema and PersonSchema wired into `[...slug].astro` | D |
| Real NSW course body content (currently placeholder) + 4 FAQs | E (user provides source) |
| FaqAccordion Patch 7 fix (uses old `faq.rendered.html` API; not yet exercised because `faqRefs: []`) | E |
| Other states (VIC/QLD/WA/SA/TAS/ACT/NT) | F |
| `OrganizationSchema.astro` | G |
| `src/pages/experts/[slug].astro` profile page | G |
| `llms.txt` | G |
| Warwick Smith expert sync (will populate on first run with `NOTION_TOKEN` set) | E (when user runs sync) |

## Build state at end of Phase A

- `npm run build` → 0 errors, 0 warnings, 5 hints
- 3 pages built: `/`, `/courses/nsw-owner-builder-course/`, `/compare/owner-builder/`
- `sitemap-index.xml` emitted
- Bundled CSS contains `--color-primary: oklch(38% .13 29)` (the `#800000` maroon)
- HTML `<html data-theme="abe">` confirmed
- One non-blocking warning: Shiki + CSP (no code blocks in current content; will revisit if/when content adds them)

## Phase A commits

| SHA | Title |
|---|---|
| `cb14346` | [Phase A] Install DaisyUI v5 + theme; wire @tailwindcss/typography |
| `d7d9b05` | [Phase A] Add experts schema aliases for spec components (option B) |
| `d600080` | [Phase A] Upgrade zod to v4, switch to z.url() canonical syntax |
| `9cb39e7` | [Phase A] Wire prebuild sync with graceful skip when NOTION_TOKEN missing |

Next: Phase B — visual identity (DaisyUI navbar/footer, fonts confirmed via local dev).
