# Zynasty Ecosystem

Client and studio portal for Zynasty Design's — an interior design company.

## Structure

```
/public
  index.html            → Client Portal (client-facing, access-code login) — served at "/"
  studio-portal.html     → Studio Portal / Project Ledger (internal team tool: projects,
                            quotation builder, agreements, KYC review)
CHANGELOG.md              → History of fixes and features
README.md                 → This file
crm-portal.html → Zynasty CRM (prototype) — studio pipeline dashboard

## Deployment

Hosted on Cloudflare Pages, currently at:
https://zynastyportal.pages.dev/crm-portal once you wire up routing

- https://zynastyportal.pages.dev/ (Client Portal — served from `public/index.html`)
- https://zynastyportal.pages.dev/studio-portal (Studio Portal)

Cloudflare Pages serves static files directly from `/public` — connect this repo
in the Cloudflare Pages dashboard and set the build output directory to `public`
(no build step required, these are plain static HTML/JS/CSS files).

## Data storage

Both portals use the in-browser `window.storage` key/value API (Claude Artifacts
persistent storage) — there is no external backend or database. Project records,
quotations, generated PDFs, and item presets are all stored under keys like:
- `projects` (shared) — full project list
- `quotation:<projectId>` (shared) — quotation line items for a project
- `quotation-pdf:<projectId>` (shared) — generated quotation PDF data URL

## Notes for future edits

crm-portal.html is the new CRM prototype — auth is currently mocked, no real backend yet


- `studio-portal.html` is the internal tool — most feature work happens here.
- `index.html` is the client-facing read-only portal (access-code login).
- See `CHANGELOG.md` for a log of bug fixes and feature changes already made.
