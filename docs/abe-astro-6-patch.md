# Astro 6 Patch — Updates to the ABE Build Spec

**Patch level:** v1.0 → v1.1
**Reason:** Astro 6.0 stable shipped on 10 March 2026. Several patterns in the original spec are now broken or superseded.
**Apply this patch:** before Claude Code starts building, or as the first migration task if you've already started.

This document is a delta — only the sections that changed. Apply each patch to the corresponding section of the main build spec. Everything not mentioned here stays identical.

---

## Patch 0 — Stack header (top of build spec)

**Replace:**

> **Stack:** Astro 5 · Tailwind CSS v4 · DaisyUI v5 · HyperUI · Content Collections (Zod) · Cloudflare Pages · GitHub · Notion (Experts DB) · LearnWorlds (checkout only)

**With:**

> **Stack:** Astro 6 · Tailwind CSS v4 · DaisyUI v5 · HyperUI · Content Layer API (Zod 4) · Cloudflare Pages · GitHub · Notion (Experts DB) · LearnWorlds (checkout only)

The change matters because Astro 6 made the Content Layer API mandatory (legacy collections removed) and added native Fonts and CSP APIs that supersede our manual setup.

---

## Patch 1 — Section 3.5 (`astro.config.mjs`)

**Replace the entire `astro.config.mjs` example with:**

```js
import { defineConfig, fontProviders } from 'astro/config';
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

  // ── Built-in Fonts API (Astro 6) ───────────────────────────
  // Replaces the manual Google Fonts <link> in BaseLayout.
  // Astro downloads font files at build time, self-hosts them,
  // and generates optimised fallbacks + preload links automatically.
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
  ],

  // ── Content Security Policy (Astro 6) ───────────────────────
  // Auto-hashes scripts and styles, generates CSP headers/meta.
  // Single flag for default protection — covers our schema JSON-LD
  // blocks and any future inline styles.
  experimental: {
    csp: true
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
```

**What changed and why:**

- **Fonts API replaces the manual `<link>` in BaseLayout.** Astro now self-hosts the font files (no third-party requests at runtime), generates optimised fallback fonts to prevent layout shift, and emits the right preload links automatically.
- **CSP added as `experimental: { csp: true }`.** As of Astro 6 stable it's actually marked stable, but it currently sits behind the `experimental` config key in some 6.0.x releases — check the release notes for your installed version. If your Astro 6 version exposes it as top-level `security: { csp: true }`, use that instead. Either way, it's a one-line enable.
- Removed the `image:` block — Astro 6's defaults are sensible and Sharp is the default for static builds.
- Cloudflare adapter is **not** required for our static site. Don't install `@astrojs/cloudflare` — it now targets Workers, not Pages, and a fully static site doesn't need it.

---

## Patch 2 — Section 3.6 (`package.json`)

**Replace the dependency block with:**

```json
{
  "dependencies": {
    "astro": "^6.0.0",
    "@astrojs/mdx": "^5.0.0",
    "@astrojs/sitemap": "^4.0.0",
    "@astrojs/rss": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "@tailwindcss/typography": "^0.5.15",
    "daisyui": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@notionhq/client": "^2.2.15",
    "tsx": "^4.19.0",
    "zod": "^4.0.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "prebuild": "tsx scripts/sync-experts-from-notion.ts"
  }
}
```

**What changed:**

- `astro` bumped to `^6.0.0`
- Official integrations bumped to match Astro 6 (mdx 5, sitemap 4, rss 5)
- `zod` bumped to `^4.0.0` — Astro 6 uses Zod 4 internally; pin yours to match
- Confirmed: still **no React, no Vue, no Radix, no shadcn**

**Don't add:**
- `@astrojs/cloudflare` — not needed for static sites, and now targets Workers
- `astro-seo` — Astro 6's built-in head handling is enough
- `@astrojs/tailwind` — superseded by `@tailwindcss/vite`

---

## Patch 3 — Section 4 (`src/content/config.ts`)

This is the biggest change. **Astro 6 removed legacy content collections entirely.** The file Andrey already has in his repo will fail to build.

**Replace the entire `config.ts` example with:**

```ts
import { defineCollection, z, reference } from 'astro:content';
import { glob } from 'astro/loaders';

// ──────────────────────────────────────────────────────────────
// JURISDICTIONS
// ──────────────────────────────────────────────────────────────
const jurisdictions = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/jurisdictions'
  }),
  schema: z.object({
    code: z.enum(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']),
    name: z.string(),
    regulator: z.object({
      name: z.string(),
      url: z.url(),
      shortName: z.string().optional()
    }),
    ownerBuilder: z.object({
      required: z.boolean(),
      permitForm: z.string().optional(),
      applicationFee: z.number().optional(),
      thresholdValue: z.number().optional(),
      courseRequired: z.boolean()
    }).optional(),
    whiteCard: z.object({
      legislation: z.string(),
      issuingAuthority: z.string()
    }).optional(),
    legislationReferences: z.array(z.object({
      title: z.string(),
      section: z.string().optional(),
      url: z.url(),
      currency: z.string()
    })),
    penalties: z.array(z.object({
      offence: z.string(),
      amount: z.number(),
      unit: z.enum(['AUD', 'penalty_units']),
      asAt: z.string()
    })).optional(),
    lastReviewed: z.string(),
    reviewedBy: reference('experts')
  })
});

// ──────────────────────────────────────────────────────────────
// EXPERTS (mirrored from Notion via prebuild script)
// ──────────────────────────────────────────────────────────────
const experts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/experts'
  }),
  schema: z.object({
    notionPageId: z.string(),
    name: z.string(),
    title: z.string(),
    ultraShortBio: z.string().max(200),
    shortBio: z.string().max(500),
    longBio: z.string(),
    credentials: z.array(z.object({
      credential: z.string(),
      issuer: z.string(),
      dateIssued: z.string().optional(),
      verificationUrl: z.url().optional()
    })),
    credentialPills: z.array(z.string()),
    credentialMatrix: z.object({
      ownerBuilder: z.boolean(),
      whiteCard: z.boolean(),
      cpd: z.boolean(),
      regulatory: z.boolean()
    }),
    prohibitedClaims: z.array(z.string()),
    headshotPath: z.string(),
    sameAs: z.array(z.url()),
    profileUrl: z.string(),
    lastVerified: z.string()
  })
});

// ──────────────────────────────────────────────────────────────
// COURSES (the programmatic layer)
// ──────────────────────────────────────────────────────────────
const courses = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/courses'
  }),
  schema: z.object({
    productLine: z.enum(['owner-builder', 'white-card', 'cpd']),
    jurisdiction: reference('jurisdictions'),
    slug: z.string(),
    title: z.string(),
    h1: z.string(),
    metaTitle: z.string().max(60),
    metaDescription: z.string().max(155),
    answerCapsule: z.string().max(300),

    deliveryRto: z.object({
      name: z.enum(['Blue Dog Training', 'AlertForce']),
      rtoCode: z.string()
    }),
    reviewer: reference('experts'),
    lastReviewed: z.string(),
    contentVersion: z.string(),

    price: z.number(),
    priceCurrency: z.literal('AUD'),
    duration: z.string(),
    durationHours: z.number(),
    enrolUrl: z.url(),
    courseMode: z.enum(['online', 'blended', 'in-person']).default('online'),

    credentialAwarded: z.string().optional(),
    courseCode: z.string().optional(),
    unitCodes: z.array(z.string()).optional(),

    faqRefs: z.array(reference('faqs')),
    relatedCourses: z.array(reference('courses')).optional(),

    entities: z.array(z.string()),

    publishedAt: z.string(),
    updatedAt: z.string(),
    status: z.enum(['draft', 'review', 'published']).default('draft')
  })
});

// ──────────────────────────────────────────────────────────────
// FAQS
// ──────────────────────────────────────────────────────────────
const faqs = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/faqs'
  }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    appliesTo: z.object({
      productLines: z.array(z.enum(['owner-builder', 'white-card', 'cpd'])),
      jurisdictions: z.array(z.string()).optional()
    }),
    lastReviewed: z.string(),
    reviewedBy: reference('experts')
  })
});

export const collections = { jurisdictions, experts, courses, faqs };
```

**What changed:**

1. **Every collection now has a `loader`** instead of `type: 'content'`.
2. **`glob` import** is from `'astro/loaders'`.
3. **Zod 4 syntax tweaks:** `z.string().url()` → `z.url()`. Both technically still work, but `z.url()` is the canonical Zod 4 form.
4. **Schemas are otherwise identical** — every `reference()` call, every field, every constraint stays the same.

**For Andrey specifically:** your existing `src/content/config.ts` will need exactly these changes. The frontmatter in `nsw-owner-builder.md` does **not** change — content files stay identical.

---

## Patch 4 — Section 5 (Course content file)

**No changes.** Frontmatter for course markdown files is unaffected by the Content Layer migration. The schema enforces exactly the same shape; only the loader changed.

---

## Patch 5 — Section 6 (Dynamic route `[...slug].astro`)

**One small API change.** Astro 6 deprecated `course.render()` in favour of using the `render()` function imported from `astro:content`.

**Replace:**

```ts
const { course } = Astro.props;
const { Content } = await course.render();
```

**With:**

```ts
import { render } from 'astro:content';

const { course } = Astro.props;
const { Content } = await render(course);
```

The collection entry no longer carries a `render()` method on itself — you call the standalone `render()` and pass the entry. Same semantics, slightly different surface.

The rest of the file (the `getStaticPaths`, the prohibited-claim guard, the schema slot wiring) is unchanged.

---

## Patch 6 — Section 7 (`CourseSchema.astro`)

**No changes.** Pure JSON-LD generation, unaffected by the version bump.

---

## Patch 7 — Section 8 (FaqAccordion + FaqSchema)

The existing `FaqAccordion.astro` in Andrey's repo has a bug independent of the Astro 6 upgrade. Fix while we're here.

**Replace `src/components/content/FaqAccordion.astro`:**

```astro
---
import { render } from 'astro:content';

interface Props {
  faqs: import('astro:content').CollectionEntry<'faqs'>[];
}

const { faqs } = Astro.props;

// Pre-render each FAQ body so we can iterate synchronously below
const rendered = await Promise.all(
  faqs.map(async (faq) => {
    const { Content } = await render(faq);
    return { faq, Content };
  })
);
---

<div class="space-y-2">
  {rendered.map(({ faq, Content }) => (
    <details class="collapse collapse-arrow bg-base-100 border border-base-300 rounded-box">
      <summary class="collapse-title font-medium text-base-content">
        {faq.data.question}
      </summary>
      <div class="collapse-content prose max-w-none">
        <Content />
      </div>
    </details>
  ))}
</div>
```

**What changed from the original:**

1. Uses the new `render()` function (Patch 5)
2. `<Content />` instead of `set:html={faq.rendered.html}` — the `rendered` property never existed in any Astro version
3. DaisyUI `collapse collapse-arrow` classes for the chevron animation (still zero JS)
4. Pre-renders all FAQs in parallel via `Promise.all` so the JSX stays simple
5. Wraps the whole list in a container with `space-y-2` for consistent spacing

**`FaqSchema.astro` is unchanged** — pure JSON-LD, doesn't touch render APIs.

---

## Patch 8 — Section 9 (Comparison hub)

**One reference resolution change.** In Astro 6, the way you compare a course's `jurisdiction` reference to a jurisdiction entry's ID has slightly different syntax depending on whether you used the `reference()` helper.

**Replace:**

```ts
const course = courses.find((c) => c.data.jurisdiction.id === j.slug);
```

**With:**

```ts
const course = courses.find((c) => c.data.jurisdiction.id === j.id);
```

The collection entry's identifier is `j.id`, not `j.slug`, in the Content Layer API. (`j.id` resolves to the filename without extension by default for `glob` loaders, e.g. `nsw` for `nsw.md` — same value the `reference('jurisdictions')` field stores.)

---

## Patch 9 — `BaseLayout.astro` (referenced from Phase 7 of setup guide)

The `BaseLayout.astro` we drafted manually loads Google Fonts via `<link>`. With Astro 6's Fonts API, that's gone.

**Replace `src/layouts/BaseLayout.astro` with:**

```astro
---
import '@/styles/global.css';
import { Font } from 'astro:assets';

interface Props {
  title?: string;
  description?: string;
}

const { title = 'ABE Education', description = 'Australian online training' } = Astro.props;
---

<!doctype html>
<html lang="en-AU" data-theme="abe">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />

    {/* Astro 6 Fonts API — auto-loads, self-hosts, preloads, generates fallbacks */}
    <Font cssVariable="--font-sans" preload />
    <Font cssVariable="--font-display" preload />
    <Font cssVariable="--font-mono" />

    {/* Schema slot — populated by individual page layouts */}
    <slot name="schema" />
  </head>
  <body class="bg-base-100 text-base-content font-sans antialiased">
    <slot />
  </body>
</html>
```

**What changed:**

- Removed `<link rel="preconnect">` and `<link href="fonts.googleapis.com…">` entirely
- Imported the `Font` component from `astro:assets`
- One `<Font>` element per font family, referencing the `cssVariable` defined in `astro.config.mjs`
- `preload` attribute on the two fonts that load above the fold (sans body + display headings)
- Added a named slot for `schema` so layouts above can inject JSON-LD

**Note for `src/styles/global.css`:** since the Fonts API now sets the CSS variables (`--font-sans`, `--font-display`, `--font-mono`) automatically, you can **remove** the `@theme` block that previously set them manually:

```css
/* DELETE this block — Astro Fonts API now provides it: */
@theme {
  --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Archivo", "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
```

The DaisyUI theme block and the heading rules below it stay exactly as written.

---

## Patch 10 — Section 14 (Rollout plan)

**Add a Day 0 step before Week 1:**

> **Day 0 — Astro version migration (if upgrading existing project).**
> If the project was scaffolded on Astro 5 (as Andrey's currently is):
> 1. Run `npx @astrojs/upgrade` to bump Astro and all official integrations together
> 2. Apply Patches 1–9 from this document
> 3. Run `npm run build` and confirm zero errors before any other work begins
>
> If starting from a fresh `npm create astro@latest`, skip Day 0 — you'll get Astro 6 by default.

---

## Patch 11 — New section: Astro 6 features worth using later

Add this as section 17 of the build spec:

> ## 17. Astro 6 features to consider in v1.5
>
> These weren't in the original spec because they didn't exist when it was written. Worth evaluating once the v1 site is live and stable.
>
> **Live Content Collections** — pull Notion data at request time without rebuilding. The current setup syncs Notion → markdown via a prebuild script, which means a Notion edit requires a redeploy. Live Collections would let the Experts collection update in real time. Worth considering once you have a few thousand Notion edits a year and the redeploy lag becomes annoying. Until then, the prebuild sync is simpler and just as effective.
>
> **Astro Cloudflare Workers** — if at any point ABE wants server-side features (search, gated content, dynamic personalisation, A/B testing), the Astro–Cloudflare integration in v6 is now first-class. The dev server runs the actual `workerd` runtime locally. Not needed for the static marketing site, but it's the natural upgrade path if business requirements grow.
>
> **`astro:env` for type-safe env vars** — when you start integrating with LearnWorlds, MailerLite, or analytics APIs, define every env var in the Astro config with type and validation. Catches missing or malformed keys at build time, not runtime.
>
> **Experimental Rust compiler** — flag-gated, opt-in. Faster `.astro` compilation. Not needed at our scale yet, but worth flipping on once it's stable for free build-time savings.

---

## What to actually do with this patch document

1. **Save this file** into your repo at `docs/astro-6-patch.md` next to the build spec
2. **Open Claude Code** in the project
3. **Hand it this prompt:**

```
Read docs/astro-6-patch.md and apply every patch to the codebase
in the order they're listed (Patches 0–11). Don't skip any.

For each patch:
- Read the "Replace this" → "With this" instructions
- Apply the change
- Commit with a message like "[Astro 6] Apply Patch N — {short description}"

After Patch 9, stop and run `npm run build`. The build must succeed
with zero errors before continuing to any new feature work.

Patches 10 and 11 are documentation-only — append them to the
build spec at docs/build-spec.md.

Confirm before you start.
```

That's it. About 30 minutes of Claude Code's time, then you're on Astro 6 with a green build and your existing structural work intact.
