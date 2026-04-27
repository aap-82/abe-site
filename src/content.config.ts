import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// ---------- JURISDICTIONS ----------
const jurisdictions = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/jurisdictions' }),
  schema: z.object({
    code: z.enum(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']),
    name: z.string(),
    regulator: z.object({
      name: z.string(),
      url: z.string().url(),
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
      url: z.string().url(),
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

// ---------- EXPERTS (mirrored from Notion Experts DB) ----------
// Schema mirrors the Notion data source at
// https://www.notion.so/a8dc3f4c431c420092266cf73ab4067b
// — properties from the DB columns, the rest extracted from the page body.
// scripts/sync-experts-from-notion.ts is the source of truth for shape.
const experts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/experts' }),
  schema: z.object({
    notionPageId: z.string(),

    // ── Notion properties ──
    name: z.string(),
    role: z.enum([
      'Course Developer',
      'Compliance & Currency Reviewer',
      'Subject Matter Expert',
      'Technical Reviewer'
    ]),
    organisation: z.string().optional(),
    status: z.enum(['Active', 'Inactive', 'Draft']),
    verificationStatus: z.enum(['All Verified', 'Partially Verified', 'Pending']),
    yearsInIndustry: z.number().int().nonnegative().optional(),
    headshotUrl: z.string().url().optional(),
    linkedIn: z.string().url().optional(),
    profileUrl: z.string(),
    lastVerified: z.string(), // ISO date
    specialistAreas: z.array(z.string()),
    coursesReviewed: z.array(z.string()),

    // ── Derived from coursesReviewed multi-select ──
    credentialMatrix: z.object({
      ownerBuilder: z.boolean(),
      whiteCard: z.boolean(),
      cpd: z.boolean()
    }),

    // ── Extracted from page body sections ──
    bios: z.object({
      ultraShort: z.string(),
      short: z.string(),
      medium: z.string(),
      long: z.string()
    }),
    credentials: z.array(z.object({
      title: z.string(),
      body: z.string(),
      verified: z.boolean()
    })),
    prohibitedClaims: z.array(z.string()), // from "What NOT to Claim" section
    expertCardCopy: z.object({
      credentialPills: z.array(z.string()),
      inlineAttribution: z.string(),
      reviewerAttribution: z.string().optional()
    }),

    // ── Aliases for the build spec's components (option B reconciliation) ──
    // The HeroCourse worked example and PersonSchema in the spec use a
    // flatter expert shape (title, headshotPath, credentialPills, sameAs).
    // Keeping these alongside the rich Notion-derived fields means existing
    // spec components keep working AND the rich data is available.
    title: z.string().optional(),                             // alt for `role` (e.g. "CEO & Course Developer")
    headshotPath: z.string().optional(),                      // local path under public/, e.g. /images/experts/dominic-ogburn.webp
    credentialPills: z.array(z.string()).optional(),          // top-level pills (mirrors expertCardCopy.credentialPills)
    sameAs: z.array(z.string().url()).optional()              // typically [linkedIn, ...]
  })
});

// ---------- COURSES ----------
const courses = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/courses' }),
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
    enrolUrl: z.string().url(),
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

// ---------- FAQS ----------
const faqs = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/faqs' }),
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
