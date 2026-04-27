/**
 * Pulls every expert from the Notion Experts database (data source
 * 9e2e141b-1ebd-4077-8cf6-3317b16da24a) and writes one Markdown file per
 * expert to src/content/experts/<slug>.md.
 *
 * Reads:
 *  - Typed properties from the DB (Expert Name, Role, Organisation,
 *    Status, Verification Status, Years in Industry, Headshot URL,
 *    LinkedIn, Profile Page URL, Last Verified, Specialist Areas,
 *    Courses Reviewed).
 *  - Structured sections from the page body:
 *      ## Bio Variations
 *        ### Ultra-Short — first paragraph
 *        ### Short        — first paragraph
 *        ### Medium       — first paragraph
 *        ### Long         — full body (multi-paragraph)
 *      ## ✅ Verified Credentials (N)
 *        ### 1. <title>   — body markdown, ✅/⚠️ marker → verified flag
 *        ### 2. ...
 *      ## What NOT to Claim ⚠️
 *        - <one prohibited claim per bullet, leading ❌ stripped>
 *      ## Expert Card Copy (for Course Pages)
 *        ### Credential pills        — bullet list
 *        ### Inline attribution      — blockquote / paragraph
 *        ### Reviewer attribution variant (optional)
 *
 * Headshot URL is the URL property — it's a stable LearnWorlds CDN link,
 * not a Notion file attachment, so no download is needed.
 *
 * credentialMatrix is derived from the Courses Reviewed multi-select:
 *   ownerBuilder = any tag containing "Owner Builder"
 *   whiteCard    = any tag containing "White Card"
 *   cpd          = any tag containing "CPD"
 *
 * Wire into package.json:
 *   "sync:experts": "tsx scripts/sync-experts-from-notion.ts"
 *
 * Environment variables (load via .env, dotenv-cli, or shell export):
 *   NOTION_TOKEN          — internal integration secret (Read content)
 *   NOTION_EXPERTS_DB_ID  — 32-char hex id from the Experts DB URL
 */

import {
  Client,
  isFullPage,
  type BlockObjectResponse,
  type PageObjectResponse,
  type RichTextItemResponse,
} from '@notionhq/client';
import yaml from 'js-yaml';
import { z } from 'zod';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─────────────────────────────────────────────────────────────────────────
// Paths and schema (mirrors src/content.config.ts experts collection)
// ─────────────────────────────────────────────────────────────────────────

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIR = join(ROOT, 'src/content/experts');

const expertSchema = z.object({
  notionPageId: z.string(),

  name: z.string(),
  role: z.enum([
    'Course Developer',
    'Compliance & Currency Reviewer',
    'Subject Matter Expert',
    'Technical Reviewer',
  ]),
  organisation: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Draft']),
  verificationStatus: z.enum(['All Verified', 'Partially Verified', 'Pending']),
  yearsInIndustry: z.number().int().nonnegative().optional(),
  headshotUrl: z.url().optional(),
  linkedIn: z.url().optional(),
  profileUrl: z.string(),
  lastVerified: z.string(),
  specialistAreas: z.array(z.string()),
  coursesReviewed: z.array(z.string()),

  credentialMatrix: z.object({
    ownerBuilder: z.boolean(),
    whiteCard: z.boolean(),
    cpd: z.boolean(),
  }),

  bios: z.object({
    ultraShort: z.string(),
    short: z.string(),
    medium: z.string(),
    long: z.string(),
  }),
  credentials: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      verified: z.boolean(),
    }),
  ),
  prohibitedClaims: z.array(z.string()),
  expertCardCopy: z.object({
    credentialPills: z.array(z.string()),
    inlineAttribution: z.string(),
    reviewerAttribution: z.string().optional(),
  }),

  // Aliases for the build spec's components (option B reconciliation)
  title: z.string().optional(),
  headshotPath: z.string().optional(),
  credentialPills: z.array(z.string()).optional(),
  sameAs: z.array(z.url()).optional(),
});

type Expert = z.infer<typeof expertSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Notion client + main loop
// ─────────────────────────────────────────────────────────────────────────

const notion = new Client({ auth: requireEnv('NOTION_TOKEN') });
const EXPERTS_DB_ID = requireEnv('NOTION_EXPERTS_DB_ID');

async function main() {
  await mkdir(CONTENT_DIR, { recursive: true });
  const pages = await queryAllPages(EXPERTS_DB_ID);
  console.log(`Found ${pages.length} expert pages in Notion.`);

  for (const page of pages) {
    const status = getSelect(page, 'Status');
    if (status === 'Draft' || status === 'Inactive') {
      console.log(`· Skipping ${getTitle(page, 'Expert Name')} (status=${status})`);
      continue;
    }

    const name = getTitle(page, 'Expert Name');
    const slug = slugify(name);

    try {
      const blocks = await listAllBlocks(page.id);
      const role = getSelect(page, 'Role') as Expert['role'];
      const linkedIn = getUrlOptional(page, 'LinkedIn');
      const expertCardCopy = extractExpertCardCopy(blocks);
      const expert: Expert = {
        notionPageId: page.id,
        name,
        role,
        organisation: getRichTextOptional(page, 'Organisation'),
        status: status as Expert['status'],
        verificationStatus: getSelect(page, 'Verification Status') as Expert['verificationStatus'],
        yearsInIndustry: getNumberOptional(page, 'Years in Industry'),
        headshotUrl: getUrlOptional(page, 'Headshot URL'),
        linkedIn,
        profileUrl: getRichText(page, 'Profile Page URL'),
        lastVerified: getDate(page, 'Last Verified'),
        specialistAreas: getMultiSelect(page, 'Specialist Areas'),
        coursesReviewed: getMultiSelect(page, 'Courses Reviewed'),
        credentialMatrix: deriveCredentialMatrix(getMultiSelect(page, 'Courses Reviewed')),
        bios: extractBios(blocks),
        credentials: extractCredentials(blocks),
        prohibitedClaims: extractProhibitedClaims(blocks),
        expertCardCopy,

        // Aliases for the build spec's components — populated automatically
        // so consumers (HeroCourse, PersonSchema) don't have to know the
        // richer Notion-derived shape exists.
        title: role,
        headshotPath: `/images/experts/${slug}.webp`,
        credentialPills: expertCardCopy.credentialPills,
        sameAs: linkedIn ? [linkedIn] : [],
      };

      expertSchema.parse(expert);
      await writeExpertFile(slug, expert);
      console.log(`✓ ${slug}.md`);
    } catch (err) {
      console.error(`✗ ${slug}: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Notion API helpers
// ─────────────────────────────────────────────────────────────────────────

async function queryAllPages(databaseId: string): Promise<PageObjectResponse[]> {
  const out: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const r of res.results) if (isFullPage(r)) out.push(r);
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return out;
}

async function listAllBlocks(blockId: string): Promise<BlockObjectResponse[]> {
  const out: BlockObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const r of res.results) {
      if ('type' in r) out.push(r as BlockObjectResponse);
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Block / rich-text rendering
// ─────────────────────────────────────────────────────────────────────────

function richTextToMarkdown(rt: RichTextItemResponse[]): string {
  return rt
    .map((t) => {
      let s = t.plain_text;
      if (t.annotations.code) s = `\`${s}\``;
      if (t.annotations.bold) s = `**${s}**`;
      if (t.annotations.italic) s = `*${s}*`;
      if (t.href) s = `[${s}](${t.href})`;
      return s;
    })
    .join('');
}

function blockText(block: BlockObjectResponse): string {
  switch (block.type) {
    case 'paragraph':           return richTextToMarkdown(block.paragraph.rich_text);
    case 'heading_1':           return richTextToMarkdown(block.heading_1.rich_text);
    case 'heading_2':           return richTextToMarkdown(block.heading_2.rich_text);
    case 'heading_3':           return richTextToMarkdown(block.heading_3.rich_text);
    case 'bulleted_list_item':  return richTextToMarkdown(block.bulleted_list_item.rich_text);
    case 'numbered_list_item':  return richTextToMarkdown(block.numbered_list_item.rich_text);
    case 'quote':               return richTextToMarkdown(block.quote.rich_text);
    case 'callout':             return richTextToMarkdown(block.callout.rich_text);
    default:                    return '';
  }
}

function blockToMarkdown(block: BlockObjectResponse): string {
  const t = blockText(block);
  switch (block.type) {
    case 'heading_1':           return `# ${t}`;
    case 'heading_2':           return `## ${t}`;
    case 'heading_3':           return `### ${t}`;
    case 'bulleted_list_item':  return `- ${t}`;
    case 'numbered_list_item':  return `1. ${t}`;
    case 'quote':               return `> ${t}`;
    default:                    return t;
  }
}

function rangeToMarkdown(blocks: BlockObjectResponse[]): string {
  return blocks.map(blockToMarkdown).filter(Boolean).join('\n\n').trim();
}

// ─────────────────────────────────────────────────────────────────────────
// Section walking
// ─────────────────────────────────────────────────────────────────────────

/**
 * Returns the slice of blocks BETWEEN the H2 heading whose text matches
 * `match` and the next H2 (exclusive). Heading itself excluded.
 */
function sliceH2(blocks: BlockObjectResponse[], match: (text: string) => boolean): BlockObjectResponse[] {
  const startIdx = blocks.findIndex((b) => b.type === 'heading_2' && match(blockText(b)));
  if (startIdx < 0) return [];
  const endRel = blocks.slice(startIdx + 1).findIndex((b) => b.type === 'heading_2');
  const endIdx = endRel < 0 ? blocks.length : startIdx + 1 + endRel;
  return blocks.slice(startIdx + 1, endIdx);
}

/**
 * Within a slice (already bounded by H2), split into H3 subsections.
 * Returns map of { h3-title => blocks-under-it }.
 */
function splitByH3(blocks: BlockObjectResponse[]): Map<string, BlockObjectResponse[]> {
  const out = new Map<string, BlockObjectResponse[]>();
  let current: string | null = null;
  for (const b of blocks) {
    if (b.type === 'heading_3') {
      current = blockText(b);
      out.set(current, []);
    } else if (current) {
      out.get(current)!.push(b);
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Section extractors
// ─────────────────────────────────────────────────────────────────────────

function extractBios(blocks: BlockObjectResponse[]): Expert['bios'] {
  const slice = sliceH2(blocks, (t) => /^bio variations/i.test(t));
  const subs = splitByH3(slice);

  const findVariant = (predicate: (key: string) => boolean): string => {
    for (const [key, body] of subs) {
      if (predicate(key)) return rangeToMarkdown(body);
    }
    return '';
  };

  return {
    ultraShort: findVariant((k) => /ultra/i.test(k)),
    short:      findVariant((k) => /^short\b/i.test(k) || /^### short/i.test(k)),
    medium:     findVariant((k) => /medium/i.test(k)),
    long:       findVariant((k) => /^long\b/i.test(k)),
  };
}

function extractCredentials(blocks: BlockObjectResponse[]): Expert['credentials'] {
  const slice = sliceH2(blocks, (t) => /verified credentials/i.test(t));
  const subs = splitByH3(slice);
  const out: Expert['credentials'] = [];
  for (const [heading, body] of subs) {
    const bodyMd = rangeToMarkdown(body);
    out.push({
      title: heading.replace(/^\d+\.\s*/, '').trim(),
      body: bodyMd,
      verified: /✅/.test(heading) || /✅/.test(bodyMd) || (!/⚠️/.test(heading) && !/⚠️/.test(bodyMd)),
    });
  }
  return out;
}

function extractProhibitedClaims(blocks: BlockObjectResponse[]): string[] {
  const slice = sliceH2(blocks, (t) => /not to claim/i.test(t));
  return slice
    .filter((b) => b.type === 'bulleted_list_item')
    .map((b) => blockText(b).replace(/^❌\s*/, '').trim())
    .filter(Boolean);
}

function extractExpertCardCopy(blocks: BlockObjectResponse[]): Expert['expertCardCopy'] {
  const slice = sliceH2(blocks, (t) => /expert card copy/i.test(t));
  const subs = splitByH3(slice);

  const credentialPillsBlocks = pickSub(subs, (k) => /credential pills/i.test(k));
  const inlineBlocks = pickSub(subs, (k) => /inline attribution/i.test(k));
  const reviewerBlocks = pickSub(subs, (k) => /reviewer attribution/i.test(k));

  const credentialPills = credentialPillsBlocks
    .filter((b) => b.type === 'bulleted_list_item')
    .map(blockText)
    .filter(Boolean);

  const inlineAttribution = rangeToMarkdown(inlineBlocks).replace(/^>\s*/gm, '').trim();
  const reviewerAttribution = rangeToMarkdown(reviewerBlocks).replace(/^>\s*/gm, '').trim();

  return {
    credentialPills,
    inlineAttribution,
    ...(reviewerAttribution ? { reviewerAttribution } : {}),
  };
}

function pickSub(subs: Map<string, BlockObjectResponse[]>, match: (k: string) => boolean): BlockObjectResponse[] {
  for (const [k, v] of subs) if (match(k)) return v;
  return [];
}

// ─────────────────────────────────────────────────────────────────────────
// Property accessors
// ─────────────────────────────────────────────────────────────────────────

function getProp(page: PageObjectResponse, name: string) {
  const p = page.properties[name];
  if (!p) throw new Error(`Notion property "${name}" missing on page ${page.id}`);
  return p;
}

function getTitle(page: PageObjectResponse, name: string): string {
  const p = getProp(page, name);
  if (p.type !== 'title') throw new Error(`"${name}" expected title, got ${p.type}`);
  return p.title.map((t: RichTextItemResponse) => t.plain_text).join('').trim();
}

function getRichText(page: PageObjectResponse, name: string): string {
  const p = getProp(page, name);
  if (p.type !== 'rich_text') throw new Error(`"${name}" expected rich_text, got ${p.type}`);
  return p.rich_text.map((t: RichTextItemResponse) => t.plain_text).join('').trim();
}

function getRichTextOptional(page: PageObjectResponse, name: string): string | undefined {
  const v = getRichText(page, name);
  return v || undefined;
}

function getSelect(page: PageObjectResponse, name: string): string {
  const p = getProp(page, name);
  if (p.type !== 'select') throw new Error(`"${name}" expected select, got ${p.type}`);
  if (!p.select) throw new Error(`Select "${name}" empty on page ${page.id}`);
  return p.select.name;
}

function getMultiSelect(page: PageObjectResponse, name: string): string[] {
  const p = getProp(page, name);
  if (p.type !== 'multi_select') throw new Error(`"${name}" expected multi_select, got ${p.type}`);
  return p.multi_select.map((o: { name: string }) => o.name);
}

function getDate(page: PageObjectResponse, name: string): string {
  const p = getProp(page, name);
  if (p.type !== 'date') throw new Error(`"${name}" expected date, got ${p.type}`);
  if (!p.date?.start) throw new Error(`Date "${name}" missing on page ${page.id}`);
  return p.date.start;
}

function getNumberOptional(page: PageObjectResponse, name: string): number | undefined {
  const p = getProp(page, name);
  if (p.type !== 'number') throw new Error(`"${name}" expected number, got ${p.type}`);
  return p.number ?? undefined;
}

function getUrlOptional(page: PageObjectResponse, name: string): string | undefined {
  const p = getProp(page, name);
  if (p.type !== 'url') throw new Error(`"${name}" expected url, got ${p.type}`);
  return p.url ?? undefined;
}

// ─────────────────────────────────────────────────────────────────────────
// Misc utilities
// ─────────────────────────────────────────────────────────────────────────

function deriveCredentialMatrix(coursesReviewed: string[]): Expert['credentialMatrix'] {
  return {
    ownerBuilder: coursesReviewed.some((c) => /owner builder/i.test(c)),
    whiteCard: coursesReviewed.some((c) => /white card/i.test(c)),
    cpd: coursesReviewed.some((c) => /\bcpd\b/i.test(c)),
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[''']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function writeExpertFile(slug: string, expert: Expert) {
  // Long bio becomes the page body; everything else goes in frontmatter.
  const { bios, ...rest } = expert;
  const frontmatter = { ...rest, bios };
  const body = `---\n${yaml.dump(frontmatter, { lineWidth: 100, noRefs: true })}---\n\n${bios.long}\n`;
  await writeFile(join(CONTENT_DIR, `${slug}.md`), body, 'utf8');
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
