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

// ---------- EXPERTS (mirrored from Notion) ----------
const experts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/experts' }),
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
      verificationUrl: z.string().url().optional()
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
    sameAs: z.array(z.string().url()),
    profileUrl: z.string(),
    lastVerified: z.string()
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
