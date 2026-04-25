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
