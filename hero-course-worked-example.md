# `HeroCourse.astro` — Worked Example

**Purpose:** The single most-reused block on the ABE site. Every course page leads with it. It carries the H1, the answer capsule (for AI Overviews), the price, the primary CTA to LearnWorlds, the reviewer trust signal, and the regulator badge — all from the course frontmatter, with zero JavaScript shipped.

**Stack compatibility:** Astro 6 · Tailwind v4 · DaisyUI v5. Uses the Astro 6 Fonts API (configured in `astro.config.mjs`, loaded via `<Font>` in `BaseLayout`) — no per-component font loading. Uses Astro 6's standalone `render()` from `astro:content` in the example route below.

This document is the reference. Every other block on the site follows the same pattern: pull from collections, render with DaisyUI classes, ship no JS.

---

## What it looks like (visual structure)

```
┌──────────────────────────────────────────────────────────────────┐
│  Breadcrumbs › Courses › Owner Builder › NSW                     │
│                                                                  │
│  ┌────────────────────────────────┐  ┌─────────────────────────┐ │
│  │  [Regulator badge: NSW Fair    │  │                         │ │
│  │   Trading approved]             │  │   COURSE PRICING CARD   │ │
│  │                                 │  │                         │ │
│  │  H1: NSW Owner Builder Course  │  │   $179                  │ │
│  │  — Online, Fair Trading        │  │   one-off · GST inc.    │ │
│  │  Approved                       │  │                         │ │
│  │                                 │  │   ✓ 5–7 hours           │ │
│  │  Answer capsule (the bit       │  │   ✓ Online, self-paced  │ │
│  │  optimised for AI Overviews,   │  │   ✓ Statement of        │ │
│  │  3–4 lines)                     │  │     Attainment          │ │
│  │                                 │  │                         │ │
│  │  [ Enrol now → ]  [ Learn more]│  │   [ Enrol now ]         │ │
│  │                                 │  │                         │ │
│  │  Reviewed by Dominic Ogburn,   │  │                         │ │
│  │  Licensed NSW Builder ·         │  │                         │ │
│  │  Last reviewed 15 Apr 2026     │  │                         │ │
│  └────────────────────────────────┘  └─────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## The component (`src/components/blocks/HeroCourse.astro`)

```astro
---
import { Image } from 'astro:assets';
import Breadcrumbs from '@/components/content/Breadcrumbs.astro';

// ───────────────────────────────────────────────────────────
// Props — receive the resolved course entry plus its references
// ───────────────────────────────────────────────────────────
interface Props {
  course: import('astro:content').CollectionEntry<'courses'>;
  jurisdiction: import('astro:content').CollectionEntry<'jurisdictions'>;
  reviewer: import('astro:content').CollectionEntry<'experts'>;
}

const { course, jurisdiction, reviewer } = Astro.props;
const c = course.data;
const j = jurisdiction.data;
const r = reviewer.data;

// ───────────────────────────────────────────────────────────
// Format helpers — keep presentation logic local to the block
// ───────────────────────────────────────────────────────────
const formattedPrice = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: c.priceCurrency,
  maximumFractionDigits: 0
}).format(c.price);

const formattedReviewDate = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
}).format(new Date(c.lastReviewed));

// ───────────────────────────────────────────────────────────
// Reviewer headshot — synced locally from Notion (path stable)
// ───────────────────────────────────────────────────────────
const headshotPath = r.headshotPath; // e.g. "/images/experts/dominic-ogburn.webp"

// ───────────────────────────────────────────────────────────
// Build-time integrity checks — fail loud if data is missing
// ───────────────────────────────────────────────────────────
if (!c.enrolUrl) {
  throw new Error(`HeroCourse: missing enrolUrl on course "${c.slug}"`);
}
if (!r.credentialPills || r.credentialPills.length === 0) {
  throw new Error(`HeroCourse: reviewer "${r.name}" has no credentialPills`);
}
---

<section class="bg-base-200 border-b border-base-300">
  <div class="max-w-6xl mx-auto px-4 py-8 lg:py-12">

    {/* ── Breadcrumbs ─────────────────────────────────────── */}
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/' },
        { label: 'Courses', href: '/courses/' },
        { label: c.productLine === 'owner-builder' ? 'Owner Builder' : 'White Card', href: `/courses/${c.productLine}/` },
        { label: j.code, href: null }
      ]}
    />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">

      {/* ── Left column: title, capsule, CTAs, trust signal ── */}
      <div class="lg:col-span-7">

        {/* Regulator badge — DaisyUI badge, theme-aware */}
        <div class="flex flex-wrap gap-2 mb-4">
          <span class="badge badge-primary badge-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-1">
              <path fill-rule="evenodd" d="M10 1.5l8 4v5c0 4-3.5 7.5-8 8-4.5-.5-8-4-8-8v-5l8-4zm-1 12.5l5-5-1.5-1.5L9 11l-2-2L5.5 10.5 9 14z" clip-rule="evenodd" />
            </svg>
            Meets {j.regulator.name} requirements
          </span>
          {c.deliveryRto && (
            <span class="badge badge-outline badge-lg">
              Delivered by {c.deliveryRto.name} (RTO {c.deliveryRto.rtoCode})
            </span>
          )}
        </div>

        {/* H1 — only h1 on the page */}
        <h1 class="text-4xl lg:text-5xl font-display font-semibold tracking-tight text-base-content mb-4">
          {c.h1}
        </h1>

        {/* Answer capsule — for AI Overviews. Marked up so AI parsers
            can identify it as the canonical answer. */}
        <div class="prose prose-lg max-w-none mb-6" data-answer-capsule>
          <p class="text-lg leading-relaxed text-base-content/80">
            {c.answerCapsule}
          </p>
        </div>

        {/* CTAs — primary goes to LearnWorlds, secondary scrolls to detail */}
        <div class="flex flex-col sm:flex-row gap-3 mb-8">
          <a
            href={c.enrolUrl}
            class="btn btn-primary btn-lg"
            data-cta="hero-enrol"
            data-course={c.slug}
          >
            Enrol now — {formattedPrice}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 ml-1">
              <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" />
            </svg>
          </a>
          <a href="#course-details" class="btn btn-ghost btn-lg">
            See what's included
          </a>
        </div>

        {/* Trust signal — reviewer credential, last reviewed date */}
        <div class="flex items-center gap-3 pt-4 border-t border-base-300">
          <Image
            src={headshotPath}
            alt={`${r.name}, ${r.title}`}
            width={48}
            height={48}
            class="rounded-full ring-2 ring-base-300"
            loading="eager"
            decoding="async"
          />
          <div class="text-sm leading-tight">
            <div class="text-base-content">
              <span>Reviewed by </span>
              <a
                href={r.profileUrl}
                class="font-semibold text-primary hover:underline"
                rel="author"
              >
                {r.name}
              </a>
              <span class="text-base-content/70">, {r.credentialPills[0]}</span>
            </div>
            <div class="text-base-content/60 mt-0.5">
              <time datetime={c.lastReviewed}>
                Last reviewed {formattedReviewDate}
              </time>
              <span class="mx-1.5">·</span>
              <span>Content version {c.contentVersion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right column: pricing card ──────────────────────── */}
      <aside class="lg:col-span-5">
        <div class="card bg-base-100 shadow-md border border-base-300 sticky top-24">
          <div class="card-body p-6 lg:p-8">

            <div class="flex items-baseline gap-2 mb-1">
              <span class="text-4xl font-display font-semibold text-base-content">
                {formattedPrice}
              </span>
              <span class="text-base-content/60 text-sm">AUD</span>
            </div>
            <p class="text-base-content/60 text-sm mb-6">
              one-off payment · GST included
            </p>

            <ul class="space-y-3 mb-6">
              <li class="flex gap-2 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-success flex-none mt-0.5">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
                <span class="text-base-content">
                  <strong>{c.duration}</strong> · self-paced online
                </span>
              </li>
              <li class="flex gap-2 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-success flex-none mt-0.5">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
                <span class="text-base-content">
                  Available on any device
                </span>
              </li>
              {c.credentialAwarded && (
                <li class="flex gap-2 items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-success flex-none mt-0.5">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-base-content">
                    {c.credentialAwarded} on completion
                  </span>
                </li>
              )}
              <li class="flex gap-2 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-success flex-none mt-0.5">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
                <span class="text-base-content">
                  Lifetime access to course materials
                </span>
              </li>
            </ul>

            <a
              href={c.enrolUrl}
              class="btn btn-primary btn-block btn-lg"
              data-cta="hero-pricing-enrol"
              data-course={c.slug}
            >
              Enrol now
            </a>

            <p class="text-xs text-base-content/60 text-center mt-3">
              Secure checkout via LearnWorlds
            </p>
          </div>
        </div>
      </aside>

    </div>
  </div>
</section>
```

---

## Why every part is the way it is

### `interface Props` with `CollectionEntry<...>`
Type-safe props. If `[...slug].astro` passes the wrong shape, TypeScript catches it at build time. No runtime surprises.

### Build-time integrity checks (`if (!c.enrolUrl) throw`)
Belt-and-braces. The Zod schema already requires `enrolUrl`, but a thrown error here catches programming mistakes (e.g. someone forgetting to pass the prop) and points to *this component* in the stack trace, not somewhere downstream.

### `bg-base-200`, `text-base-content`, `btn-primary`, `badge-primary`
All semantic — tied to the DaisyUI `abe` theme. If you decide tomorrow that the maroon needs to be 5% darker, you change `--color-primary` in `global.css` and it propagates to every badge, button, and link site-wide. **Never use `bg-red-700` or `text-zinc-900` in components.**

### `font-display` on the H1
Resolves to Archivo via the `--font-display` CSS variable, which the Astro 6 Fonts API sets automatically (configured in `astro.config.mjs`). Body text inherits DM Sans through `--font-sans`. Matches the existing Framer system.

### `data-answer-capsule` attribute
Lets you target the AI-Overview-optimised paragraph for analytics, schema injection, or future AI crawler signalling. Costs nothing, gives you a hook.

### `<Image>` from `astro:assets`
Auto-generates WebP, responsive srcsets, lazy-load attributes. The `loading="eager"` is intentional — the headshot is above the fold, so we want it to start loading immediately for LCP.

### `rel="author"` on the reviewer link
Tiny, unfashionable, still works. Helps Google understand the author entity for E-E-A-T.

### `<time datetime={c.lastReviewed}>`
Machine-readable date. Required for proper schema and a small SEO signal.

### `data-cta="..."` and `data-course="..."` attributes
Wire your analytics to data attributes, not class names. Class names change when you redesign; data attributes don't. GA4 / Plausible / PostHog can all bind to these without touching component code.

### `sticky top-24` on the pricing card
Pure CSS, no JS. The card stays visible as the user scrolls — increasing conversion without a single byte of JavaScript.

### Zero `client:*` directives
This whole component ships as static HTML. The browser receives one `<section>` of pre-rendered markup. **That's the entire point.**

---

## How `[...slug].astro` calls it

```astro
---
import { getCollection, getEntry, render } from 'astro:content';
import CourseLayout from '@/layouts/CourseLayout.astro';
import HeroCourse from '@/components/blocks/HeroCourse.astro';
import CourseSchema from '@/components/seo/CourseSchema.astro';
// ... other schema components

export async function getStaticPaths() {
  const published = await getCollection('courses', (c) =>
    c.data.status === 'published'
  );
  return published.map((course) => ({
    params: { slug: course.data.slug },  // slug from frontmatter
    props: { course }
  }));
}

const { course } = Astro.props;
const jurisdiction = await getEntry(course.data.jurisdiction);
const reviewer = await getEntry(course.data.reviewer);
const faqs = await Promise.all(
  course.data.faqRefs.map((ref) => getEntry(ref))
);
const { Content } = await render(course);   // Astro 6 — standalone render()
---

<CourseLayout course={course} jurisdiction={jurisdiction} reviewer={reviewer}>
  <Fragment slot="schema">
    <CourseSchema {course} {jurisdiction} {reviewer} />
    {/* breadcrumb, person, faq schemas */}
  </Fragment>

  <HeroCourse {course} {jurisdiction} {reviewer} />

  <main id="course-details">
    <Content />
  </main>

  {/* Other blocks: feature grid, FAQ accordion, comparison, CTA banner */}
</CourseLayout>
```

That's how all blocks consume collection data: route resolves the references once, blocks receive the resolved entries as props.

---

## Performance budget for this block

| Metric | Target | This block |
|---|---|---|
| HTML size (gzipped) | < 5 KB | ~2 KB |
| CSS shipped (incremental) | 0 new bytes | 0 — all DaisyUI classes |
| JS shipped | 0 bytes | **0 bytes** |
| Images above fold | 1 (headshot) | 1, 48×48 WebP, ~3 KB |
| LCP candidate | H1 | H1 (text, paint-fast) |
| Layout shift | 0 | 0 — fixed dimensions on image |

---

## Variants you'll need (and how to handle them)

**White Card course pages** — same component, different `productLine`. Already handled via the breadcrumb logic. Switch the regulator badge text to read "WHS Regulation compliant" via a small helper.

**CPD course pages** — the pricing model is sometimes per-CPD-point or bundled. Consider adding an optional `pricingModel` field to the courses schema and a small switch in the pricing card. Don't fork the component — extend it.

**Bundle pages** — for "All Owner Builder courses for $XXX" style pages. Make a separate `HeroBundle.astro` rather than overloading this one. Different intent, different conversion logic.

**Hub pages (e.g. `/courses/owner-builder/`)** — these need a `HeroHub.astro` that lists state options instead of a single price. Again, separate component.

The rule: when a block starts needing more than two `if` statements to handle different shapes, fork it. Components stay simple, data stays clean.

---

## What to do once this is built

1. View the rendered NSW Owner Builder page in the browser.
2. Open Chrome DevTools → Network → filter "JS". Total JS for the page: **should be 0 bytes**. If it's not, something has crept in. Check `client:*` directives.
3. Run Lighthouse. Target: Performance 100, Accessibility 100, Best Practices 100, SEO 100.
4. Validate the Course schema: https://validator.schema.org/ (paste the page URL).
5. Validate the FAQPage schema: same validator.
6. Test the pricing CTA flow end-to-end: click "Enrol now" → land on LearnWorlds → confirm tracking fires.

If all six pass, the template is good. Then replicate to WA, VIC, QLD, TAS, ACT — and you have six pages from one component.

---

## Common mistakes to avoid

❌ **Importing `useState` or any React hook.** This is `.astro`, not `.tsx`. There is no client-side state.

❌ **Adding inline styles.** Use Tailwind utilities. If a utility doesn't exist, extend the theme — don't reach for `style="..."`.

❌ **Hardcoding the price as a string.** Always use `Intl.NumberFormat` for currency. Australian formatting matters for trust.

❌ **Forgetting the `alt` text on the headshot.** The `Image` component will not silently allow it — it will fail the build. Good.

❌ **Putting the H1 inside the pricing card.** The H1 is the page title. The pricing card has a `<span>` for the price, not a heading. Heading hierarchy is an SEO signal.

❌ **Wiring analytics through class selectors.** Use `data-cta` attributes. Decouple analytics from styling.

❌ **Loading a font from Google Fonts via `<link>` in this component.** Fonts are configured once in `astro.config.mjs` via the Astro 6 Fonts API and loaded via the `<Font>` component in `BaseLayout.astro`. Astro self-hosts the files, generates fallback fonts to prevent layout shift, and emits preload links automatically. Never load fonts per-component.
