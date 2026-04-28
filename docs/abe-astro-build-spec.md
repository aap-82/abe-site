# ABE Education — Astro Migration & Programmatic SEO Build Spec

**Purpose:** Adapt the two proposals you were shown to ABE's actual situation, fix the gaps, and give Claude Code a buildable plan.

**Stack:** Astro 5 · Tailwind CSS v4 · DaisyUI v5 · HyperUI · Content Collections (Zod) · Cloudflare Pages · GitHub · Notion (Experts DB) · LearnWorlds (checkout only)

**Design system rule:** Zero-JS by default. All components ship as pure Astro + Tailwind + DaisyUI. JavaScript is opt-in per island, only where genuine interactivity demands it.

---

## 1. What's different about ABE's situation

The generic proposals assumed a single product, hardcoded authority data, and one page template. ABE has:

- **Three product lines** — Owner Builder (state-specific), White Card (state-specific), CPD (often category-specific)
- **Six+ jurisdictions** with different regulators, forms, fees, legislation, and currency dates
- **Non-RTO authority model** — ABE must never claim ASQA registration; authority flows from the delivery RTO (Blue Dog Training, AlertForce) and from ABE's reviewers (Dominic Ogburn, Warwick Smith)
- **A live Notion Experts database** that already holds reviewer credentials, headshots, and prohibited-claim lists
- **An existing SEO content engine skill** (`abe-seo-content-engine`) with established page structure, schema patterns, and E-E-A-T rules
- **LearnWorlds as the checkout destination** — the Astro site markets; LearnWorlds handles enrolment

Every design decision below is shaped by those five facts.

---

## 2. Repository structure (v1)

```
abe-site/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── robots.txt
│   ├── favicon.svg
│   └── images/
│       └── experts/              ← cached headshots (Notion URLs expire)
├── src/
│   ├── styles/
│   │   ├── global.css            ← @import "tailwindcss" + @plugin "daisyui" + ABE theme
│   │   └── tokens.css            ← brand-only tokens (fonts, custom utilities)
│   ├── content/
│   │   ├── config.ts             ← Zod schemas (the source of truth)
│   │   ├── courses/              ← one .md per course × state
│   │   │   ├── nsw-owner-builder.md
│   │   │   ├── wa-owner-builder.md
│   │   │   ├── vic-white-card.md
│   │   │   └── ...
│   │   ├── jurisdictions/        ← one .md per state with regulator/legislation data
│   │   │   ├── nsw.md
│   │   │   ├── wa.md
│   │   │   └── ...
│   │   ├── experts/              ← mirror of Notion Experts DB
│   │   │   ├── dominic-ogburn.md
│   │   │   └── warwick-smith.md
│   │   ├── faqs/                 ← reusable FAQ entries (tagged by course/state)
│   │   │   └── *.md
│   │   └── cpd-categories/       ← for CPD programmatic pages
│   │       └── *.md
│   ├── components/
│   │   ├── seo/                  ← schema components (zero-JS, head-only)
│   │   │   ├── BaseHead.astro
│   │   │   ├── CourseSchema.astro
│   │   │   ├── BreadcrumbSchema.astro
│   │   │   ├── OrganizationSchema.astro
│   │   │   ├── PersonSchema.astro
│   │   │   └── FaqSchema.astro
│   │   ├── blocks/               ← page sections (DaisyUI + HyperUI, zero-JS)
│   │   │   ├── HeroCourse.astro
│   │   │   ├── TrustBar.astro
│   │   │   ├── PricingCard.astro
│   │   │   ├── FeatureGrid.astro
│   │   │   ├── CtaBanner.astro
│   │   │   ├── StatsBand.astro
│   │   │   └── TestimonialGrid.astro
│   │   ├── content/              ← ABE-specific content components (zero-JS)
│   │   │   ├── AnswerCapsule.astro
│   │   │   ├── ExpertCard.astro
│   │   │   ├── RegulatoryPanel.astro
│   │   │   ├── FaqAccordion.astro    ← native <details>/<summary>
│   │   │   ├── ComparisonTable.astro
│   │   │   └── StickyEnrolBar.astro
│   │   └── layout/
│   │       ├── Header.astro          ← DaisyUI navbar, mobile menu via <details>
│   │       └── Footer.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── CourseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── courses/
│   │   │   └── [...slug].astro   ← generates every course page
│   │   ├── experts/
│   │   │   └── [slug].astro      ← one page per reviewer, Person schema
│   │   ├── compare/
│   │   │   └── owner-builder.astro  ← state comparison hub
│   │   ├── sitemap.xml.ts
│   │   └── llms.txt.ts
│   └── lib/
│       ├── schema-builders.ts
│       ├── notion-sync.ts
│       └── abe-authority.ts
├── scripts/
│   ├── sync-experts-from-notion.ts
│   └── cache-expert-images.ts
└── .github/
    └── workflows/
        └── deploy.yml
```

This is what both proposals were missing: **Content Collections** (the data layer) + **DaisyUI** (the design system). That combination is what makes Astro genuinely superior for SEO at scale — type-safe content, semantic CSS classes, zero JS by default.

---

## 3. Design system — DaisyUI + HyperUI (zero-JS by default)

Both proposals you saw skipped this entirely. The design system is what determines whether your beautiful programmatic pages actually rank — because Core Web Vitals is a ranking factor and AI crawlers (Google AI Overviews, ChatGPT, Perplexity) heavily weight fast-loading pages.

### 3.1 Why DaisyUI + HyperUI (and only these)

| Requirement | DaisyUI | HyperUI | Why it matters for ABE |
|---|---|---|---|
| Bundle cost | ~10–20 KB CSS, **0 KB JS** | **0 KB** (raw HTML snippets) | Lighthouse 100 by default |
| Framework dependency | None — pure Tailwind plugin | None — copy-paste HTML | No React runtime, no hydration |
| Astro compatibility | Native, official Astro guide | Drop-in, no integration | Works with `.astro` files directly |
| Theming | CSS variables + `data-theme` | Tailwind classes only | One brand theme covers everything |
| Licence | MIT (free, commercial OK) | MIT (free, commercial OK) | No spend required |
| Accessibility | Semantic markup, ARIA-ready | Hand-rolled but solid | Important for E-E-A-T |

**DaisyUI does the design system work** — buttons, cards, alerts, badges, navbars, tables, modals, accordions — with consistent semantic classes (`btn`, `card`, `alert`, etc.) and theme-aware colour tokens.

**HyperUI does the marketing-page sections** — heroes, pricing tables, feature grids, testimonials, CTA banners — as raw HTML+Tailwind snippets you adapt into `.astro` files.

Together they cover roughly 95% of what you'd otherwise reach for shadcnblocks for, with zero JavaScript shipped.

### 3.2 ABE brand theme (`src/styles/global.css`)

This is the single source of truth for ABE's visual identity. DaisyUI v5 uses Tailwind v4's CSS-first configuration — no `tailwind.config.js`.

```css
/* src/styles/global.css */

@import "tailwindcss";
@plugin "daisyui" {
  themes: abe --default;
  logs: false;
}

/* ABE Education brand theme — Classic Maroon palette + DM Sans */
@plugin "daisyui/theme" {
  name: "abe";
  default: true;
  prefersdark: false;
  color-scheme: light;

  /* Surfaces */
  --color-base-100: oklch(99% 0.003 60);          /* page background — near-white warm */
  --color-base-200: oklch(96% 0.005 60);          /* card / subtle band */
  --color-base-300: oklch(92% 0.008 60);          /* dividers, borders */
  --color-base-content: oklch(20% 0.02 280);      /* body text — near-black with slight cool */

  /* Brand — Classic Maroon */
  --color-primary: oklch(38% 0.12 15);            /* ABE maroon */
  --color-primary-content: oklch(98% 0.005 60);   /* text on maroon */

  /* Accent — warm complement */
  --color-secondary: oklch(55% 0.12 40);          /* warm tan/copper */
  --color-secondary-content: oklch(98% 0.005 60);

  /* Highlight — for trust badges, callouts */
  --color-accent: oklch(70% 0.15 85);             /* gold */
  --color-accent-content: oklch(20% 0.02 280);

  /* Neutral — deep grey for footers */
  --color-neutral: oklch(25% 0.015 280);
  --color-neutral-content: oklch(95% 0.005 60);

  /* Status colours */
  --color-info: oklch(60% 0.14 230);
  --color-info-content: oklch(98% 0.005 230);
  --color-success: oklch(55% 0.14 145);
  --color-success-content: oklch(98% 0.005 145);
  --color-warning: oklch(75% 0.16 75);
  --color-warning-content: oklch(20% 0.02 75);
  --color-error: oklch(55% 0.20 25);
  --color-error-content: oklch(98% 0.005 25);

  /* Geometry — slightly tighter than DaisyUI defaults for editorial feel */
  --radius-selector: 0.5rem;
  --radius-field: 0.375rem;
  --radius-box: 0.75rem;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 1;
  --noise: 0;
}

/* Typography — DM Sans body, Archivo headings (matches existing Framer system) */
@theme {
  --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Archivo", "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, "SF Mono", Menlo, monospace;
}

/* Apply Archivo to headings globally */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.01em;
}
```

Tweak the OKLCH values once you confirm the exact ABE maroon hex with Dominic, but the structure is final.

### 3.3 Component sourcing rule (give this to Claude Code)

When building any page, follow this decision tree in order:

1. **Does DaisyUI have it?** Use the DaisyUI class (`btn`, `card`, `alert`, `navbar`, `accordion`, `badge`, `stats`, `hero`, `table`). Done.
2. **Is it a marketing section?** Grab a HyperUI snippet, wrap it in an `.astro` file, replace hardcoded values with props from frontmatter or content collections.
3. **Custom Astro component.** Only if neither covers it.
4. **Native HTML element with no JS.** For accordions use `<details>/<summary>`, for menus on mobile use `<details>` again, for dialogs use the `<dialog>` element with DaisyUI `modal` styling.
5. **React island — last resort only.** Mark with `client:visible` and only for components that genuinely need state (e.g. a multi-step calculator, an interactive course filter). Even then, try a lightweight Alpine.js or Astro's own client directives first.

**Forbidden:** importing React or any other JS framework "just in case". Every dependency added must justify its bundle cost.

### 3.4 Section-by-section component map for ABE pages

| Page section | DaisyUI class | HyperUI section | Notes |
|---|---|---|---|
| Top nav | `navbar` + `dropdown` | — | Mobile menu via `<details>`, no JS |
| Hero (course page) | `hero` | "Hero Sections" | Pull title/CTA/price from frontmatter |
| Trust bar (badges row) | `badge` + `stats` | — | Reviewer credentials, RTO logo, course count |
| Answer capsule | `alert alert-info` | — | For AI Overview targeting |
| Course features | — | "Feature Sections" | Adapted to course modules |
| Pricing card | `card` + `btn` | "Pricing Sections" | Single price + enrol CTA → LearnWorlds |
| Expert card | `card` + `avatar` | — | Pulls from experts collection |
| Regulatory panel | `card` + `badge` | — | Custom — pulls from jurisdictions collection |
| FAQ accordion | DaisyUI `collapse` | "FAQ Sections" | `<details>/<summary>`, paired with FAQPage JSON-LD |
| Comparison table | `table table-zebra` | — | State-by-state, built from collections |
| Testimonials | `card` + `avatar` | "Testimonial Sections" | Real students only — never fabricate |
| Sticky enrol bar | `btm-nav` (or custom) | — | Mobile-only, fixed bottom |
| CTA banner | `hero` variant | "CTA Sections" | One per page maximum |
| Footer | `footer` | "Footer Sections" | DaisyUI `footer` is excellent |

### 3.5 Astro config (`astro.config.mjs`)

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://abeeducation.edu.au',
  output: 'static',
  adapter: cloudflare(),
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

Note: Tailwind v4 uses the Vite plugin directly. The old `@astrojs/tailwind` integration is deprecated.

### 3.6 Package.json (the actual dependency list)

```json
{
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/cloudflare": "^11.0.0",
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/sitemap": "^3.2.0",
    "@astrojs/rss": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "@tailwindcss/typography": "^0.5.15",
    "daisyui": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@notionhq/client": "^2.2.15",
    "tsx": "^4.19.0",
    "zod": "^3.23.8"
  }
}
```

That's it. No React, no Vue, no shadcn, no Radix, no Framer Motion. If something needs to be added later for a specific island, it gets added then — not now.

---

## 4. Content Collection schemas (`src/content/config.ts`)

This is the single most important file in the whole project. It enforces — at build time, failing the build if violated — that every page has the E-E-A-T fields, regulatory data, and schema inputs it needs.

```ts
import { defineCollection, z, reference } from 'astro:content';

// ---------- JURISDICTIONS ----------
const jurisdictions = defineCollection({
  type: 'content',
  schema: z.object({
    code: z.enum(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']),
    name: z.string(),
    regulator: z.object({
      name: z.string(),              // e.g. "NSW Fair Trading"
      url: z.string().url(),
      shortName: z.string().optional() // e.g. "LGIRS" for WA
    }),
    ownerBuilder: z.object({
      required: z.boolean(),
      permitForm: z.string().optional(),       // "Form 75", "Form 412"
      applicationFee: z.number().optional(),   // AUD
      thresholdValue: z.number().optional(),   // value at which course is required
      courseRequired: z.boolean()
    }).optional(),
    whiteCard: z.object({
      legislation: z.string(),       // e.g. "Work Health and Safety Regulation 2017 (NSW)"
      issuingAuthority: z.string()
    }).optional(),
    legislationReferences: z.array(z.object({
      title: z.string(),
      section: z.string().optional(),
      url: z.string().url(),
      currency: z.string()           // ISO date — last verified current
    })),
    penalties: z.array(z.object({
      offence: z.string(),
      amount: z.number(),
      unit: z.enum(['AUD', 'penalty_units']),
      asAt: z.string()               // ISO date
    })).optional(),
    lastReviewed: z.string(),        // ISO date
    reviewedBy: reference('experts')
  })
});

// ---------- EXPERTS (mirrored from Notion) ----------
const experts = defineCollection({
  type: 'content',
  schema: z.object({
    notionPageId: z.string(),
    name: z.string(),
    title: z.string(),               // "CEO & Course Developer"
    ultraShortBio: z.string().max(200),
    shortBio: z.string().max(500),
    longBio: z.string(),
    credentials: z.array(z.object({
      credential: z.string(),
      issuer: z.string(),
      dateIssued: z.string().optional(),
      verificationUrl: z.string().url().optional()
    })),
    credentialPills: z.array(z.string()),  // short pill labels for cards
    credentialMatrix: z.object({            // which courses this expert can review
      ownerBuilder: z.boolean(),
      whiteCard: z.boolean(),
      cpd: z.boolean(),
      regulatory: z.boolean()
    }),
    prohibitedClaims: z.array(z.string()), // "What NOT to Claim" — build-time guard
    headshotPath: z.string(),              // local path, cached from Notion
    sameAs: z.array(z.string().url()),     // LinkedIn, author pages, etc.
    profileUrl: z.string(),                // /experts/dominic-ogburn
    lastVerified: z.string()               // ISO date
  })
});

// ---------- COURSES (the programmatic layer) ----------
const courses = defineCollection({
  type: 'content',
  schema: z.object({
    // IDENTITY
    productLine: z.enum(['owner-builder', 'white-card', 'cpd']),
    jurisdiction: reference('jurisdictions'),
    slug: z.string(),                       // "nsw-owner-builder-course"
    title: z.string(),                      // "NSW Owner Builder Course"
    h1: z.string(),
    metaTitle: z.string().max(60),
    metaDescription: z.string().max(155),
    answerCapsule: z.string().max(300),     // for AI Overview

    // AUTHORITY (non-RTO model)
    deliveryRto: z.object({
      name: z.enum(['Blue Dog Training', 'AlertForce']),
      rtoCode: z.string()
    }),
    reviewer: reference('experts'),
    lastReviewed: z.string(),               // ISO date
    contentVersion: z.string(),             // "2026.1"

    // COMMERCIAL
    price: z.number(),
    priceCurrency: z.literal('AUD'),
    duration: z.string(),                   // "3–5 hours"
    durationHours: z.number(),              // 5 (for schema)
    enrolUrl: z.string().url(),             // LearnWorlds checkout
    courseMode: z.enum(['online', 'blended', 'in-person']).default('online'),

    // SCHEMA INPUTS
    credentialAwarded: z.string().optional(), // "Statement of Attainment", "Certificate of Completion"
    courseCode: z.string().optional(),        // "10274NAT" for accredited
    unitCodes: z.array(z.string()).optional(),

    // CONTENT STRUCTURE
    faqRefs: z.array(reference('faqs')),
    relatedCourses: z.array(reference('courses')).optional(),

    // GEO / AI OVERVIEW
    entities: z.array(z.string()),          // key entities for topical authority

    // HOUSEKEEPING
    publishedAt: z.string(),
    updatedAt: z.string(),
    status: z.enum(['draft', 'review', 'published']).default('draft')
  })
});

// ---------- FAQS ----------
const faqs = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    answer: z.string(),                    // supports markdown
    appliesTo: z.object({
      productLines: z.array(z.enum(['owner-builder', 'white-card', 'cpd'])),
      jurisdictions: z.array(z.string()).optional() // state codes, omit if universal
    }),
    lastReviewed: z.string(),
    reviewedBy: reference('experts')
  })
});

export const collections = { jurisdictions, experts, courses, faqs };
```

**What this buys you:**

- Miss a `reviewer`? Build fails.
- Set a price without a currency? Type error.
- Reference an expert who doesn't exist? Build fails.
- FAQ with no reviewer? Build fails.
- Three years from now someone edits content and forgets `lastReviewed`? Build fails.

That's how you enforce E-E-A-T at scale instead of hoping it happens.

---

## 5. Example content file (`src/content/courses/nsw-owner-builder.md`)

```markdown
---
productLine: owner-builder
jurisdiction: nsw
slug: nsw-owner-builder-course
title: NSW Owner Builder Course
h1: NSW Owner Builder Course — Online, Fair Trading Approved
metaTitle: NSW Owner Builder Course Online | ABE Education
metaDescription: Complete your NSW Owner Builder course online. Meets NSW Fair Trading requirements. Reviewed by licensed builder Dominic Ogburn.
answerCapsule: |
  The NSW Owner Builder course is a mandatory training requirement for anyone
  applying for an Owner Builder Permit through NSW Fair Trading for work
  valued over $10,000. ABE Education delivers the course online, with
  certification issued by our RTO partner. Most students complete it in 5–7
  hours.

deliveryRto:
  name: Blue Dog Training
  rtoCode: "40984"

reviewer: dominic-ogburn
lastReviewed: "2026-04-15"
contentVersion: "2026.1"

price: 179
priceCurrency: AUD
duration: "5–7 hours"
durationHours: 7
enrolUrl: "https://learn.abeeducation.edu.au/course/nsw-owner-builder"
courseMode: online

credentialAwarded: "Statement of Attainment"
courseCode: "10274NAT"
unitCodes: ["OBPPBP001"]

faqRefs:
  - nsw-ob-do-i-need-course
  - nsw-ob-how-long
  - nsw-ob-permit-cost
  - nsw-ob-can-i-sell
  # ...

relatedCourses:
  - vic-owner-builder
  - qld-owner-builder

entities:
  - "NSW Fair Trading"
  - "Owner Builder Permit"
  - "Home Building Act 1989"
  - "Statement of Attainment"

publishedAt: "2025-11-01"
updatedAt: "2026-04-15"
status: published
---

## Who needs a NSW Owner Builder Permit?

[Content body in markdown. The frontmatter drives schema, meta, E-E-A-T. The body
is where the actual page content lives. Components can be imported via MDX if
richer elements are needed.]
```

Adding WA? Copy the file, change the frontmatter, change the body. That's the whole workflow.

---

## 6. The dynamic route (`src/pages/courses/[...slug].astro`)

This is the piece both proposals got wrong. Here's the correct Astro pattern:

```astro
---
import { getCollection, getEntry } from 'astro:content';
import CourseLayout from '@/layouts/CourseLayout.astro';
import CourseSchema from '@/components/seo/CourseSchema.astro';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema.astro';
import PersonSchema from '@/components/seo/PersonSchema.astro';
import FaqSchema from '@/components/seo/FaqSchema.astro';

export async function getStaticPaths() {
  const published = await getCollection('courses', (c) =>
    c.data.status === 'published'
  );

  return published.map((course) => ({
    params: { slug: course.slug },
    props: { course }
  }));
}

const { course } = Astro.props;
const { Content } = await course.render();

// Resolve references
const jurisdiction = await getEntry(course.data.jurisdiction);
const reviewer = await getEntry(course.data.reviewer);
const faqs = await Promise.all(course.data.faqRefs.map((ref) => getEntry(ref)));

// Build-time guard: prevent any prohibited claims from slipping into meta
for (const phrase of reviewer.data.prohibitedClaims) {
  if (course.data.metaDescription.toLowerCase().includes(phrase.toLowerCase())) {
    throw new Error(
      `Prohibited claim "${phrase}" found in meta description for ${course.slug}`
    );
  }
}
---

<CourseLayout course={course} jurisdiction={jurisdiction} reviewer={reviewer}>
  <Fragment slot="schema">
    <CourseSchema course={course} jurisdiction={jurisdiction} reviewer={reviewer} />
    <BreadcrumbSchema course={course} jurisdiction={jurisdiction} />
    <PersonSchema expert={reviewer} />
    <FaqSchema faqs={faqs} />
  </Fragment>

  <Content />
</CourseLayout>
```

Three important things this does that the proposals didn't:

1. **`getStaticPaths` is actually present** — without it, `[slug].astro` fails to build
2. **References are resolved** — jurisdiction data, reviewer data, FAQ data all flow in automatically
3. **Prohibited claims are enforced at build time** — if anyone tries to write "ABE is ASQA approved" or similar, the build dies

---

## 7. Schema component example (`CourseSchema.astro`)

This is where the Course + Offer + CreativeWork + Provider tree gets built from frontmatter. Compare to the broken version in the first proposal.

```astro
---
const { course, jurisdiction, reviewer } = Astro.props;
const d = course.data;

const schema = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": d.title,
  "description": d.answerCapsule,
  "url": `https://abeeducation.edu.au/courses/${d.slug}/`,
  "inLanguage": "en-AU",
  "educationalLevel": "Vocational",
  "provider": {
    "@type": "Organization",
    "name": "ABE Education",
    "url": "https://abeeducation.edu.au",
    "sameAs": ["https://www.linkedin.com/company/abe-education"]
  },
  "hasCourseInstance": [{
    "@type": "CourseInstance",
    "courseMode": d.courseMode === 'online' ? 'Online' : 'Blended',
    "courseWorkload": `PT${d.durationHours}H`,
    "inLanguage": "en-AU",
    "instructor": {
      "@type": "Person",
      "@id": `https://abeeducation.edu.au${reviewer.data.profileUrl}#person`
    }
  }],
  "offers": [{
    "@type": "Offer",
    "price": d.price,
    "priceCurrency": d.priceCurrency,
    "category": "Paid",
    "availability": "https://schema.org/InStock",
    "url": d.enrolUrl
  }],
  ...(d.credentialAwarded && {
    "educationalCredentialAwarded": {
      "@type": "EducationalOccupationalCredential",
      "name": d.credentialAwarded,
      "credentialCategory": d.credentialAwarded === 'Statement of Attainment'
        ? "Certificate"
        : "CompletionCertificate",
      "recognizedBy": {
        "@type": "Organization",
        "name": d.deliveryRto.name,
        "identifier": d.deliveryRto.rtoCode
      }
    }
  }),
  "review": {
    "@type": "Review",
    "author": {
      "@type": "Person",
      "@id": `https://abeeducation.edu.au${reviewer.data.profileUrl}#person`
    },
    "reviewBody": `Reviewed for regulatory currency on ${d.lastReviewed}`,
    "datePublished": d.lastReviewed
  }
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

Note: `set:html={JSON.stringify(schema)}` — the proposals had `{JSON.stringify(schema)}` which renders as literal text. This is the actual working pattern.

---

## 8. FAQ with proper FAQPage schema

Both proposals shipped FAQs as `<details>` / `<summary>` with no JSON-LD, which defeats the point. Correct pattern:

```astro
---
// src/components/content/FaqAccordion.astro
const { faqs } = Astro.props;
---

{faqs.map((faq) => (
  <details class="faq-item">
    <summary>{faq.data.question}</summary>
    <div set:html={faq.rendered.html} />
  </details>
))}
```

Paired with:

```astro
---
// src/components/seo/FaqSchema.astro
const { faqs } = Astro.props;

const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.data.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.data.answer
    }
  }))
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

Reality check on FAQ schema: Google rolled back FAQ rich results for most sites in August 2023, but FAQPage schema is still actively consumed by AI Overviews, ChatGPT, Perplexity, and Google's SGE. Keep it.

---

## 9. Comparison hub (`src/pages/compare/owner-builder.astro`)

The second proposal had a static comparison table. Yours builds itself from the jurisdictions collection:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '@/layouts/BaseLayout.astro';

const jurisdictions = await getCollection('jurisdictions', (j) =>
  j.data.ownerBuilder?.required === true
);

const courses = await getCollection('courses', (c) =>
  c.data.productLine === 'owner-builder' && c.data.status === 'published'
);

const rows = jurisdictions.map((j) => {
  const course = courses.find((c) => c.data.jurisdiction.id === j.slug);
  return {
    state: j.data.code,
    regulator: j.data.regulator.name,
    permitForm: j.data.ownerBuilder.permitForm,
    applicationFee: j.data.ownerBuilder.applicationFee,
    threshold: j.data.ownerBuilder.thresholdValue,
    coursePrice: course?.data.price,
    courseSlug: course?.slug
  };
});
---

<BaseLayout title="Owner Builder Requirements by State — Compare">
  <table>
    <thead>
      <tr>
        <th>State</th>
        <th>Regulator</th>
        <th>Permit Form</th>
        <th>Application Fee</th>
        <th>Work Value Threshold</th>
        <th>Course</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr>
          <td>{r.state}</td>
          <td>{r.regulator}</td>
          <td>{r.permitForm}</td>
          <td>${r.applicationFee}</td>
          <td>${r.threshold?.toLocaleString()}</td>
          <td>
            {r.courseSlug && (
              <a href={`/courses/${r.courseSlug}/`}>${r.coursePrice}</a>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</BaseLayout>
```

Add a new state's data file → this page updates automatically. That's actual programmatic SEO.

---

## 10. Notion sync (the ABE-specific gap)

Neither proposal covered this, and it's critical for ABE because the Experts data lives in Notion, not in the repo.

`scripts/sync-experts-from-notion.ts`:

```ts
// Runs before every build (locally and in CI)
// Pulls each expert entry from Notion Experts DB
// Writes to src/content/experts/*.md
// Downloads headshot to public/images/experts/ (Notion URLs expire)
// Validates against the Zod schema — fails loudly if a field is missing

// Wire into package.json:
// "prebuild": "tsx scripts/sync-experts-from-notion.ts"
```

This gives you: one source of truth (Notion), type-safe content (Zod), survivable headshots (local), and auto-updating pages when you edit the Notion record.

GitHub Action (`.github/workflows/deploy.yml`) runs this on every push, so Cloudflare always builds against the latest Notion data.

---

## 11. Authority model — the non-RTO guardrails

Build `src/lib/abe-authority.ts` as a single source for all authority boilerplate:

```ts
export const ABE_AUTHORITY = {
  organizationName: "ABE Education",
  isRto: false,
  // ABE must never display these claims anywhere:
  prohibitedClaims: [
    "ASQA approved",
    "ASQA registered",
    "RTO 40984",           // that's Blue Dog's code, not ABE's
    "nationally recognised training"  // only via partner RTO
  ],
  // Always display on course pages with accredited training:
  deliveryRtoDisclosure: (rto: string, code: string) =>
    `Training delivered by ${rto} (RTO ${code}) under partnership with ABE Education.`,
  // ASQA disclosure boilerplate
  asqaDisclosure: "ABE Education is not a Registered Training Organisation (RTO). Accredited course delivery and Statement of Attainment issuance is provided by our partner RTOs."
} as const;
```

Then wire a build-time lint check that scans every rendered page for prohibited claim strings and fails the build if found. You already know why this matters — the Edway investigation showed exactly how badly this can go wrong.

---

## 12. Image optimisation and additional integrations

The core `astro.config.mjs` is shown in section 3.5. Two additions worth noting:

**Image optimisation** — Astro ships with built-in Sharp-based image optimisation. For Cloudflare Pages, you can either let Astro optimise at build time (works for static images) or use Cloudflare Images for runtime optimisation of user-uploaded content. For ABE's case (mostly editorial images, course imagery, expert headshots), build-time optimisation is enough:

```js
// inside astro.config.mjs
image: {
  service: { entrypoint: 'astro/assets/services/sharp' },
  domains: ['files.notion.com']  // for synced Notion images during dev
}
```

Use the `<Image>` component from `astro:assets` for all images. It automatically generates responsive srcsets, WebP conversions, and lazy-loading attributes — all of which feed Core Web Vitals.

**RSS feed** — If you're migrating the ABE blog, add `@astrojs/rss` and create `src/pages/rss.xml.ts`. Keep it simple: pull from a `posts` content collection (same Zod-validated pattern as courses).

**llms.txt** — Already in the file tree at `src/pages/llms.txt.ts`. This file lists your high-value pages for AI crawlers (ChatGPT, Perplexity, Claude). Auto-generate it from the courses + jurisdictions collections so it stays in sync.

---

## 13. Build / deploy pipeline

```
┌─────────────────────┐
│ Edit content        │
│ (markdown + Notion) │
└──────────┬──────────┘
           │ git push
           ▼
┌─────────────────────┐
│ GitHub Actions      │
│  1. Sync Notion     │
│  2. Cache headshots │
│  3. astro build     │
│  4. Zod validates   │
│  5. Prohibited      │
│     claim scan      │
└──────────┬──────────┘
           │ on success
           ▼
┌─────────────────────┐
│ Cloudflare Pages    │
│ Auto-deploy         │
│ ~30–60 seconds      │
└─────────────────────┘
```

If any validation fails, the site doesn't deploy. You never ship a broken page.

---

## 14. What to build first (practical rollout)

**Week 1** — Foundations:
- Repo, Astro 5 + Tailwind v4 + DaisyUI v5 set up, Cloudflare Pages connected
- `src/styles/global.css` with the ABE theme (Classic Maroon + DM Sans + Archivo)
- `src/content/config.ts` with the five collections
- BaseLayout, CourseLayout, all SEO schema components
- Experts synced from Notion (Dominic + Warwick)
- One published course as proof: NSW Owner Builder
- Lighthouse audit on the proof page — target 100/100/100/100

**Week 2** — Replication:
- VIC, QLD, WA, TAS, ACT Owner Builder (6 pages from one template)
- Jurisdictions collection fully populated
- Comparison hub live
- FAQ bank at ~10 FAQs per state
- Block library built out: HeroCourse, TrustBar, PricingCard, FaqAccordion, CtaBanner, RegulatoryPanel

**Week 3** — Second product line:
- White Card × 8 states
- CPD category landing pages
- Expert profile pages (`/experts/dominic-ogburn`, `/experts/warwick-smith`)

**Week 4** — Polish:
- Sticky enrol bar, conversion tracking (GA4 + Plausible)
- Blog migration if applicable
- llms.txt, sitemap, robots.txt
- 301 redirect map from old URLs
- Final Lighthouse + Schema.org validator + PageSpeed audit across all templates

---

## 15. Known risks and how to handle them

**Risk — Notion sync fails in CI.** Cache the last-good JSON in the repo and fall back to it; fail loudly but don't block deploy if Notion is down.

**Risk — Reviewer credentials drift from Notion to repo.** The prebuild sync resolves this. Never hand-edit files in `src/content/experts/` — they're generated.

**Risk — Someone writes "ASQA approved" in content.** The prohibited-claim build scan catches it before deploy.

**Risk — Legislation goes out of date silently.** Every jurisdiction and every course has a `lastReviewed` field. Add a CI check that warns if any content is >6 months old.

**Risk — LearnWorlds URL structure changes.** Store enrol URLs in a single map (`src/lib/enrol-urls.ts`) rather than in frontmatter if you want centralised control.

---

## 16. What to hand Claude Code when you start

When you start building, give Claude Code this document plus:

1. The relevant outputs from your `abe-seo-content-engine` skill (schema patterns, E-E-A-T rules, prohibited claims list)
2. Read access to your Notion Experts database (it's already connected via MCP)
3. Your existing course page content from LearnWorlds or Framer to migrate
4. The exact ABE Classic Maroon hex code (or CSS values from your existing Framer system) so the DaisyUI theme uses the right colours

Then ask it to build in this order:

1. `astro.config.mjs` + `package.json` (sections 3.5 and 3.6)
2. `src/styles/global.css` with the ABE DaisyUI theme (section 3.2)
3. `src/content/config.ts` with all five Zod schemas (section 4)
4. One expert (`dominic-ogburn.md`) and one jurisdiction (`nsw.md`) hand-built to verify the schema works
5. The Notion sync script for experts (section 10)
6. `BaseLayout.astro` and `CourseLayout.astro` with DaisyUI navbar and footer
7. All schema components (sections 7 and 8)
8. The shared blocks: `HeroCourse`, `TrustBar`, `PricingCard`, `FaqAccordion`, `RegulatoryPanel`, `CtaBanner`
9. NSW Owner Builder as proof of concept
10. **Stop. Run Lighthouse. Check schema validators.** Then replicate.

**Standing rule for Claude Code:** "Use DaisyUI classes first. If DaisyUI doesn't have it, use a HyperUI snippet adapted as a `.astro` file. Do not import React, do not add `client:*` directives, do not install component libraries unless explicitly asked. Every kilobyte of JavaScript shipped to the browser must be justified."

---

## Summary of gaps fixed from the two proposals

| Gap | First proposal | Second proposal | This spec |
|-----|---------------|-----------------|-----------|
| Design system / component library | ❌ | ❌ | ✅ DaisyUI + HyperUI, zero-JS |
| Performance budget enforced | ❌ | ❌ | ✅ React forbidden by default |
| Brand theme defined | ❌ | ❌ | ✅ DaisyUI custom theme with ABE tokens |
| Content Collections | ❌ | ❌ | ✅ Zod-enforced |
| `getStaticPaths()` | ❌ | ❌ broken | ✅ correct pattern |
| Schema `set:html` fix | ❌ bug | ❌ | ✅ |
| Full Course schema (hasCourseInstance, credentialAwarded) | ❌ | ❌ | ✅ |
| FAQPage JSON-LD | ❌ | ❌ | ✅ |
| Person/reviewer schema | ❌ | ❌ | ✅ |
| Notion Experts sync | ❌ | ❌ | ✅ ABE-specific |
| Non-RTO authority guardrails | ❌ | ❌ | ✅ build-time check |
| Jurisdictions as data | ❌ | partial | ✅ full collection |
| Real-world data model | ❌ thin | ❌ thin | ✅ all regulatory fields |
| Image optimisation | ❌ | ❌ | ✅ Astro Sharp + WebP |
| Sitemap, robots, llms.txt | ❌ | ❌ | ✅ |
| CI/CD pipeline | ❌ | ❌ | ✅ |
| Tailwind v4 / DaisyUI v5 syntax | ❌ | ❌ | ✅ current 2026 syntax |
