/**
 * Runs before every build (locally and in CI).
 * Pulls each expert entry from the Notion Experts DB,
 * writes one Markdown file per expert to src/content/experts/*.md,
 * downloads each headshot to public/images/experts/ (Notion file URLs expire),
 * and validates every record against the Zod schema — failing loudly if a field
 * is missing.
 *
 * Wire into package.json:
 *   "prebuild": "tsx scripts/sync-experts-from-notion.ts"
 *
 * Environment variables:
 *   NOTION_TOKEN          — integration secret with read access to the DB
 *   NOTION_EXPERTS_DB_ID  — the Experts database id
 *
 * Notion property mapping (case-sensitive):
 *   Name                    → title
 *   Title                   → rich_text
 *   Ultra Short Bio         → rich_text  (≤200 chars)
 *   Short Bio               → rich_text  (≤500 chars)
 *   Credentials             → rich_text  ("credential | issuer | YYYY-MM-DD | https://verify"
 *                                          one row per line, last two columns optional)
 *   Credential Pills        → multi_select
 *   Reviews Owner Builder   → checkbox
 *   Reviews White Card      → checkbox
 *   Reviews CPD             → checkbox
 *   Reviews Regulatory      → checkbox
 *   Prohibited Claims       → multi_select
 *   Headshot                → files (single file)
 *   Same As                 → rich_text  (one URL per line)
 *   Last Verified           → date
 *
 * The page body becomes the long bio (rendered as Markdown in the .md output).
 */

import { Client, isFullPage } from '@notionhq/client';
import type {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';
import yaml from 'js-yaml';
import { z } from 'zod';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIR = join(ROOT, 'src/content/experts');
const HEADSHOT_DIR = join(ROOT, 'public/images/experts');
const HEADSHOT_PUBLIC_PREFIX = '/images/experts';

const expertSchema = z.object({
  notionPageId: z.string(),
  name: z.string(),
  title: z.string(),
  ultraShortBio: z.string().max(200),
  shortBio: z.string().max(500),
  longBio: z.string(),
  credentials: z.array(
    z.object({
      credential: z.string(),
      issuer: z.string(),
      dateIssued: z.string().optional(),
      verificationUrl: z.string().url().optional(),
    }),
  ),
  credentialPills: z.array(z.string()),
  credentialMatrix: z.object({
    ownerBuilder: z.boolean(),
    whiteCard: z.boolean(),
    cpd: z.boolean(),
    regulatory: z.boolean(),
  }),
  prohibitedClaims: z.array(z.string()),
  headshotPath: z.string(),
  sameAs: z.array(z.string().url()),
  profileUrl: z.string(),
  lastVerified: z.string(),
});

type Expert = z.infer<typeof expertSchema>;

const NOTION_TOKEN = requireEnv('NOTION_TOKEN');
const EXPERTS_DB_ID = requireEnv('NOTION_EXPERTS_DB_ID');
const notion = new Client({ auth: NOTION_TOKEN });

async function main() {
  await mkdir(CONTENT_DIR, { recursive: true });
  await mkdir(HEADSHOT_DIR, { recursive: true });

  const pages = await queryAllPages(EXPERTS_DB_ID);
  console.log(`Found ${pages.length} expert pages in Notion.`);

  for (const page of pages) {
    const slug = slugify(getTitle(page, 'Name'));
    const headshotPath = await downloadHeadshot(getFileUrl(page, 'Headshot'), slug);
    const longBio = await renderPageBodyAsMarkdown(page.id);

    const expert: Expert = {
      notionPageId: page.id,
      name: getTitle(page, 'Name'),
      title: getRichText(page, 'Title'),
      ultraShortBio: getRichText(page, 'Ultra Short Bio'),
      shortBio: getRichText(page, 'Short Bio'),
      longBio,
      credentials: parseCredentials(getRichText(page, 'Credentials')),
      credentialPills: getMultiSelect(page, 'Credential Pills'),
      credentialMatrix: {
        ownerBuilder: getCheckbox(page, 'Reviews Owner Builder'),
        whiteCard: getCheckbox(page, 'Reviews White Card'),
        cpd: getCheckbox(page, 'Reviews CPD'),
        regulatory: getCheckbox(page, 'Reviews Regulatory'),
      },
      prohibitedClaims: getMultiSelect(page, 'Prohibited Claims'),
      headshotPath,
      sameAs: parseLines(getRichText(page, 'Same As')),
      profileUrl: `/experts/${slug}`,
      lastVerified: getDate(page, 'Last Verified'),
    };

    expertSchema.parse(expert);
    await writeExpertFile(slug, expert);
    console.log(`✓ ${slug}.md`);
  }
}

async function queryAllPages(databaseId: string): Promise<PageObjectResponse[]> {
  const out: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const r of res.results) {
      if (isFullPage(r)) out.push(r);
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return out;
}

async function renderPageBodyAsMarkdown(pageId: string): Promise<string> {
  const blocks = await listAllBlocks(pageId);
  return blocks.map(blockToMarkdown).filter(Boolean).join('\n\n').trim();
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

function blockToMarkdown(block: BlockObjectResponse): string {
  switch (block.type) {
    case 'paragraph':
      return richTextToMarkdown(block.paragraph.rich_text);
    case 'heading_1':
      return `# ${richTextToMarkdown(block.heading_1.rich_text)}`;
    case 'heading_2':
      return `## ${richTextToMarkdown(block.heading_2.rich_text)}`;
    case 'heading_3':
      return `### ${richTextToMarkdown(block.heading_3.rich_text)}`;
    case 'bulleted_list_item':
      return `- ${richTextToMarkdown(block.bulleted_list_item.rich_text)}`;
    case 'numbered_list_item':
      return `1. ${richTextToMarkdown(block.numbered_list_item.rich_text)}`;
    case 'quote':
      return `> ${richTextToMarkdown(block.quote.rich_text)}`;
    default:
      return '';
  }
}

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

function getProp(page: PageObjectResponse, name: string) {
  const p = page.properties[name];
  if (!p) throw new Error(`Notion property "${name}" missing on page ${page.id}`);
  return p;
}

function getTitle(page: PageObjectResponse, name: string): string {
  const p = getProp(page, name);
  if (p.type !== 'title') throw new Error(`"${name}" expected title, got ${p.type}`);
  return p.title.map((t) => t.plain_text).join('').trim();
}

function getRichText(page: PageObjectResponse, name: string): string {
  const p = getProp(page, name);
  if (p.type !== 'rich_text') throw new Error(`"${name}" expected rich_text, got ${p.type}`);
  return p.rich_text.map((t) => t.plain_text).join('').trim();
}

function getCheckbox(page: PageObjectResponse, name: string): boolean {
  const p = getProp(page, name);
  if (p.type !== 'checkbox') throw new Error(`"${name}" expected checkbox, got ${p.type}`);
  return p.checkbox;
}

function getMultiSelect(page: PageObjectResponse, name: string): string[] {
  const p = getProp(page, name);
  if (p.type !== 'multi_select') throw new Error(`"${name}" expected multi_select, got ${p.type}`);
  return p.multi_select.map((o) => o.name);
}

function getDate(page: PageObjectResponse, name: string): string {
  const p = getProp(page, name);
  if (p.type !== 'date') throw new Error(`"${name}" expected date, got ${p.type}`);
  if (!p.date?.start) throw new Error(`Date "${name}" missing on page ${page.id}`);
  return p.date.start;
}

function getFileUrl(page: PageObjectResponse, name: string): string {
  const p = getProp(page, name);
  if (p.type !== 'files') throw new Error(`"${name}" expected files, got ${p.type}`);
  const file = p.files[0];
  if (!file) throw new Error(`No file in "${name}" on page ${page.id}`);
  return file.type === 'external' ? file.external.url : file.file.url;
}

async function downloadHeadshot(url: string, slug: string): Promise<string> {
  const ext = (extname(new URL(url).pathname) || '.jpg').toLowerCase();
  const filename = `${slug}${ext}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download headshot ${url}: ${res.status}`);
  await writeFile(join(HEADSHOT_DIR, filename), Buffer.from(await res.arrayBuffer()));
  return `${HEADSHOT_PUBLIC_PREFIX}/${filename}`;
}

function parseCredentials(raw: string): Expert['credentials'] {
  return parseLines(raw).map((line) => {
    const [credential, issuer, dateIssued, verificationUrl] = line
      .split('|')
      .map((s) => s.trim());
    if (!credential || !issuer) throw new Error(`Malformed credential row: ${line}`);
    return {
      credential,
      issuer,
      ...(dateIssued ? { dateIssued } : {}),
      ...(verificationUrl ? { verificationUrl } : {}),
    };
  });
}

function parseLines(raw: string): string[] {
  return raw.split('\n').map((s) => s.trim()).filter(Boolean);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function writeExpertFile(slug: string, expert: Expert) {
  const { longBio, ...frontmatter } = expert;
  const body = `---\n${yaml.dump(frontmatter, { lineWidth: 120, noRefs: true })}---\n\n${longBio}\n`;
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
