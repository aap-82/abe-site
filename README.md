# abe-site

[abeeducation.edu.au](https://abeeducation.edu.au) — Astro 6 static site, deployed to Cloudflare Pages.

## Local development

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run preview  # serves the built site locally
```

## Project context

See [CLAUDE.md](CLAUDE.md) for the authority model (ABE is not an RTO),
content collection schema, and the rules that the build-time guard enforces.

## Deployment

Cloudflare Pages picks up `main` and runs `npm run build`. Output: `dist/`.
No Cloudflare adapter is used — the site is `output: 'static'`.

The site lives at (https://abe-site.andrey-p-personal.workers.dev/)](https://abe-site.andrey-p-personal.workers.dev/)) until
DNS is cut over to the apex domain.
