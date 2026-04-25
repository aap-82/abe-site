// Runs before every build (locally and in CI)
// Pulls each expert entry from Notion Experts DB
// Writes to src/content/experts/*.md
// Downloads headshot to public/images/experts/ (Notion URLs expire)
// Validates against the Zod schema — fails loudly if a field is missing

// Wire into package.json:
// "prebuild": "tsx scripts/sync-experts-from-notion.ts"
