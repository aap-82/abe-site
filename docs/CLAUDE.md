# abe-site — Claude Code project context

abeeducation.edu.au — Astro 6 static site, deployed to Cloudflare Pages.

## Authority model — read first

**ABE Education is NOT an RTO.** Accredited training is delivered by partner
RTOs (Blue Dog Training RTO 40984, AlertForce). Anything that implies ABE is
an ASQA-registered RTO is a compliance failure.

The guard logic lives in [src/lib/abe-authority.ts](src/lib/abe-authority.ts):

- `ABE_AUTHORITY.prohibitedClaims` — never put these strings on a page
- `ABE_AUTHORITY.deliveryRtoDisclosure(rto, code)` — required on accredited course pages
- `ABE_AUTHORITY.asqaDisclosure` — boilerplate footer text

The build-time guard in [src/pages/courses/[...slug].astro](src/pages/courses/%5B...slug%5D.astro)
throws if any course's `metaDescription` contains a reviewer's prohibited claim.
Don't disable it.

## Architecture

- Astro 6, `output: 'static'` — Cloudflare Pages serves `dist/` directly, no adapter needed
- Tailwind v4 via `@tailwindcss/vite`
- MDX support via `@astrojs/mdx`
- Sitemap via `@astrojs/sitemap`
- Astro 6 built-in fonts API (DM Sans, Archivo, DM Mono) — see [astro.config.mjs](astro.config.mjs)
- CSP enabled via `experimental.csp`

## Content collections (src/content/config.ts)

Four collections, all wired with Zod schemas:

| Collection      | Purpose                                                         |
|-----------------|-----------------------------------------------------------------|
| `jurisdictions` | One per Australian state — regulator, owner-builder rules, etc. |
| `experts`       | Mirrored from the Notion Experts DB ([a8dc3f4c](https://www.notion.so/a8dc3f4c431c420092266cf73ab4067b)) by `scripts/sync-experts-from-notion.ts` |
| `courses`       | Programmatic layer — links a productLine to a jurisdiction      |
| `faqs`          | FAQ entries with applies-to filters                             |

### Experts content model — read before editing the schema

The Notion Experts page is the source of truth and is *richer* than the
old Astro schema. Each expert page in Notion has:

- **Typed properties** — Expert Name, Role, Organisation, Status,
  Verification Status, Years in Industry, Headshot URL (URL property,
  hosted on LearnWorlds CDN — do NOT use Notion file attachments,
  those URLs expire), LinkedIn, Profile Page URL, Last Verified,
  Specialist Areas (multi-select), Courses Reviewed (multi-select).
- **Page body sections** — `## Bio Variations` (with H3 sub-bios:
  Ultra-Short / Short / Medium / Long), `## ✅ Verified Credentials (N)`
  (each H3 is one structured credential), `## What NOT to Claim ⚠️`
  (bullets, the source of `prohibitedClaims`), `## Expert Card Copy`
  (with H3 sub-sections: Credential pills, Inline attribution, Reviewer
  attribution variant).

The sync script extracts both halves into the Astro frontmatter shape
defined in [src/content.config.ts](src/content.config.ts). `credentialMatrix` (`ownerBuilder` /
`whiteCard` / `cpd` booleans) is derived from the Courses Reviewed
multi-select — don't add it as a separate Notion column.

To run the sync:

```sh
$env:NOTION_TOKEN = "ntn_<your-internal-integration-token>"
$env:NOTION_EXPERTS_DB_ID = "a8dc3f4c431c420092266cf73ab4067b"
npm run sync:experts
```

Required Notion setup: an internal integration with **Read content**
scope, **shared with the Experts database** (database `···` →
Connections → add). Without sharing, the API returns zero pages.

References between collections are Zod-validated. Adding a course means
ensuring its `jurisdiction` and `reviewer` already exist as entries.

## Working on this codebase

- Path alias: `@/*` → `src/*` (configured in [tsconfig.json](tsconfig.json))
- Common commands: `npm run dev`, `npm run build`, `npm run sync:experts`
- Dev server: `http://localhost:4321`

## When generating page content

For SEO-optimised page content (homepage, state pages, course pages),
delegate to the **`abe-seo-content-engine`** skill. It enforces the ABE
authority model, generates schema markup, and is tuned for AI Overview / GEO.

## Out-of-scope reminders

- Don't add `@astrojs/cloudflare` adapter — `output: 'static'` is intentional
- Don't add Google Fonts `<link>` tags — Astro 6 fonts API self-hosts them
- Don't write "ASQA approved", "RTO 40984" (that's the partner's), or
  "nationally recognised training" anywhere ABE is the speaker
