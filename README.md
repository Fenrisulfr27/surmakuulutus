# Surmakuulutus

**Surmakuulutus** is a **free online web app** for creating and posting obituaries. It features a modern, responsive interface and a full-stack Next.js setup, making it easy to submit, view, and manage obituary announcements online.

**Live site:** [surmakuulutus.ee](https://surmakuulutus.ee/)

---

## Project Structure

| Part                           | Description                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **App** (`surmakuulutus`)      | Built with **Next.js + React + TypeScript**, includes responsive UI components from **Mantine** and App Router based navigation.                 |
| **API** (`src/app/api`)        | Next.js API routes connect to **MongoDB Atlas** for storing obituary data and handle validation, public listing, and individual obituary lookup. |

---

## Key Features

- Create and submit obituary posts via web form
- Display obituaries in a clean, readable layout
- Fully responsive UI for desktop and mobile devices
- Next.js API routes handle data storage and retrieval
- Hosted online for instant access

---

## Technologies Used

Next.js, React, TypeScript, Mantine, MongoDB Atlas, ESLint, Vitest

---

## Development Setup

```bash
git clone https://github.com/Fenrisulfr27/surmakuulutus.git
cd surmakuulutus
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

### Environment

Set `MONGO_URI` in your environment to connect the Next.js API routes to MongoDB Atlas.

If Atlas connections fail with `querySrv ECONNREFUSED`, check the DNS resolver used by Node.
For local networks whose DNS refuses SRV queries, set `MONGO_DNS_SERVERS=1.1.1.1,1.0.0.1`
in `.env`, then restart the development server. This optional setting changes Node's process-wide
DNS resolver, including the setup/migration commands; it does not change Windows DNS settings.
Leave it unset on hosts with working DNS. Failed connection attempts are cleared so later requests can retry.

### Administration and moderation

#### Import from Surmakuulutused.ee

`POST /api/import-obituaries` imports the public text archive at
`https://www.surmakuulutused.ee/kuulutused/`. The current archive includes all notices in one HTML response;
each run makes one upstream request. Names, dates, poems, introductory text and mourners are imported as
plain text, preserving line breaks. Photos and decorative frames are not imported. Each run publishes
at most one previously unimported notice, preferring the newest notice in the source archive. If there
are no new notices, the next unpublished older notice is selected. If all notices have already been
imported, nothing is published. The original URL is retained privately for duplicate detection and
administration; it is excluded from public pages and APIs. Imported records have a separate source filter in `/admin`.
No submitter email or IP is collected or invented. Imported texts retain their original length (up to
10,000 characters per field); the manual submission form keeps its existing limits.

The importer uses the existing `AI_GENERATION_SECRET`, shared with the AI generation endpoint. Set the
same value in Netlify's production Functions environment and GitHub Actions repository secrets, then deploy.
If AI generation is already configured, no additional secret is needed. To check the source without
writing to MongoDB, call from a trusted terminal:

```bash
curl --fail --request POST \
  --header "Authorization: Bearer $AI_GENERATION_SECRET" \
  "$SITE_URL/api/import-obituaries?dryRun=true"
```

Set `SITE_URL` to your site's origin. To publish the imported notices, remove `?dryRun=true`.
Preview returns `found` and `invalid` counts; publication returns `created`, `existing`, `remaining` and `invalid`.
HTTP 207 indicates some source cards were invalid and skipped. An empty/unrecognizable archive fails
without writing; upstream and database failures return a generic 502. Duplicate detection makes retrying
the same notice safe. Requests have a 25-second upstream timeout, an 8 MiB
response limit, and do not follow upstream redirects.

The GitHub Actions workflow `.github/workflows/import-obituaries.yml` runs every 12 hours at **05:30 and 17:30 UTC**
(07:30 and 19:30 Estonian winter time, 08:30 and 20:30 summer time). Configure repository variable `SITE_URL` and repository
secret `AI_GENERATION_SECRET` with the same value as hosting. Manual workflow runs default to preview;
turn off `dry_run` to publish. The workflow fails if any source cards were invalid. No import runs during
installation, build or tests. Deployment and secret configuration are required to activate the schedule.

A unique partial MongoDB index on `sourceUrl` prevents duplicates, including concurrent runs. The database
account needs index-creation permission. Existing databases need no data migration. Repeat imports only
insert missing source URLs: they never overwrite edits, change timestamps, republish rejected notices or
restore deleted notices. Separate source URLs remain separate notices even when the deceased's name matches.
Original source edits and removals are not synchronized. Creation time records the import time. Scheduling
controls the 12-hour interval; an explicit manual publication run can publish an additional notice.

Verification uses an isolated test MongoDB instance. To additionally check a previously downloaded live
archive, set `IMPORT_LIVE_HTML` to its absolute HTML path and run
`npx vitest run src/lib/obituaryImport.test.ts` (the live-HTML assertion is otherwise skipped).

`/admin` provides a single-administrator login, statistics, recent submissions, a paginated obituary table,
editing, moderation, recoverable deletion, and a paginated activity log. The interface uses the existing
Mantine theme and typography. Search, status, source, sort, and deleted-record filters stay in the URL.

New manual submissions pass the existing validation, Turnstile, origin, honeypot, token-reuse,
rate-limit, duplicate, and IP-ban checks, then enter `published` automatically. The form confirms publication in Estonian or English.
AI submissions continue to publish automatically with `aiGenerated: true`; their schedule and endpoint secret are unchanged.
Only published, non-deleted records are returned by public listings, detail lookups, APIs, and the sitemap.
Legacy records with **no status field** remain public until migrated. Explicit statuses are never inferred from payment data.

#### Administrator setup

1. Copy the configuration names from `.env.example` into your local or hosting environment.
   Keep existing application secrets. Configure `ADMIN_EMAIL`, `BETTER_AUTH_URL` (the exact site origin),
   and `BETTER_AUTH_SECRET` (at least 32 random characters). Production requires HTTPS.
2. Generate a secret locally:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```

3. Temporarily set `ADMIN_PASSWORD` to a unique password of 12–128 characters. Run:

   ```bash
   npm run admin:setup
   ```

4. Remove `ADMIN_PASSWORD` from the environment, restart the app, and sign in at `/admin`.
   The script creates the account using Better Auth's password hashing; repeating it preserves credentials.
   Public registration, email recovery, and other authentication routes are not exposed.

Better Auth is the sole authentication dependency. It stores sessions in the existing MongoDB database,
uses HTTP-only, SameSite=Strict cookies (Secure in production), and expires sessions after eight hours.
Logout deletes the server session, so replaying a previous cookie does not restore access. Cookie caching
and rolling session renewal are disabled. Only the account matching `ADMIN_EMAIL` is authorized; changing it
removes the previous account's administrative access. Never use a `NEXT_PUBLIC_` prefix for admin secrets.

Login is limited to **five attempts per 15 minutes across this single-admin installation**, with atomic
MongoDB checks and a unique rate-limit key. The shared bucket deliberately ignores spoofable client-IP headers.
An attacker can temporarily exhaust that bucket; there is no IP-dependent bypass. A database outage fails closed.
Authentication responses never return the session token in JSON. Mutations require the configured Origin as well as
an authorized server session. Admin responses use `private, no-store`, noindex, and deny framing.

Use a MongoDB Atlas database (or a local replica set) because content changes and their audit entries commit in
one transaction. The database account needs read/write, transaction, collection, and index creation permissions
for this application's database only; it does not need cluster administration. Existing AI index maintenance
still requires its existing index permissions. Auth initialization enforces unique indexes on user email,
session token, and rate-limit key; setup also creates a session-expiry TTL index.

For account recovery or password rotation, use trusted database access to back up then remove that administrator's
`user`, `account`, and `session` records, and rerun setup with the new password. Do not expose a recovery endpoint.
Removing session records also immediately revokes active sessions. Keep `BETTER_AUTH_SECRET` stable across instances.

#### Status migration

Back up the database and select the intended `MONGO_URI` before running either command:

```bash
npm run migrate:obituary-status
npm run migrate:obituary-status -- --apply
```

The first command only counts records missing `status`. `--apply` assigns `published` **only** to those records
and creates the moderation indexes. It preserves contents, assigned statuses, AI flags, creation dates, and modification dates.
It is safe to repeat. No migration or production operation runs automatically during installation, build, or tests.
Public visibility already handles missing statuses, so migration can follow deployment without hiding legacy posts.

The `Ad` schema adds `status` (`pending | published | rejected`, default `published`) and nullable
`deletedAt`. AI creation explicitly assigns `published`. Indexes support status/source plus creation ordering.
Search escapes regular-expression metacharacters; substring name search can still scan matching database records.
Admin edits allow only existing validated form fields and preserve slug, source, status, and creation time.
The existing `__v` field protects against stale or concurrent mutations. Dates can be cleared intentionally.

Transitions are centralized in `src/lib/moderation.ts` and applied in `src/lib/adminAds.ts`:
pending may be published/rejected; rejected may return to pending. Deletion records `deletedAt` without removing data.
The `Prügikast` navigation link and view filter list recoverable deleted records. Restoration clears `deletedAt`
and sets `published`, making the restored obituary public immediately. Archive actions and new archive status
assignments are disabled. Legacy `archived` records remain readable solely for compatibility and appear in the
trash bin, where they can be explicitly restored and published without a database migration or data loss.
Editing never implies approval. Publication status remains independent of future payment eligibility;
future verification belongs before the centralized publication transition. No payment features are included.

`admin_activity` records timestamps, action names, obituary IDs, administrator IDs, and success/failure.
Login attempts use the fixed identifier `admin`, rather than storing supplied email addresses or IP addresses.
Passwords, tokens, secrets, and obituary contents are excluded. Dashboard totals exclude soft-deleted records;
deleted records remain accessible through their separate management filter. Audit records have no automatic purge policy.

#### Verification

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
npm run test:admin-browser
```

`mongodb-memory-server` is a test-only dependency. Integration tests start an isolated replica set, exercise
real Better Auth cookies and database operations, and run setup/migration scripts against test data. The first run
may download a MongoDB binary. Browser smoke tests also create their own database and local development server;
they require Chrome (`CHROME_BINARY` can override its Windows path) and Selenium's Chrome driver.
They never accept a production site or database URL. The existing `test:selenium` command has its own production
target default and is not part of this isolated suite.

Implementation files are grouped under `src/app/admin`, `src/app/api/admin`, and `src/components/admin`.
Supporting files are `src/lib/adminAuth.ts`, `adminPage.ts`, `adminHttp.ts`, `adminAds.ts`, `adminAudit.ts`,
and `moderation.ts`. Setup and migration live in `scripts/setup-admin.mjs` and `scripts/migrate-obituary-status.mjs`.
Public integration changes affect `src/lib/ads.ts`, the submission API/form/page and translations, robots,
admin response headers, and obituary structured-data escaping. Tests cover access, sessions, CSRF, brute force,
publication visibility, migration, edits, soft deletion/recovery, search/pagination/sort, concurrency, audit rollback,
delete confirmation, and translated submission acknowledgment.

Next.js and Zod were patched within their existing release lines for reported security advisories.
Compatible lockfile updates also patch `source-map-js`, `baseline-browser-mapping`, and `yaml`.
Development-tool dependency audit findings remain; review `npm audit` separately before production rollout.

#### Faster moderation and submitter privacy

The dashboard shows eight recent activity entries and prioritizes pending submissions, then unviewed
submissions, then creation time. Links open pending and unviewed queues immediately. The administrative
navigation shows the current pending count; the separate full activity log remains available.

Each obituary keeps a private `viewedBy` array of administrator IDs. `UUS` indicates it has not been opened
by the signed-in administrator. Lists, filters, API reads and Next.js link prefetch do not mark it viewed.
The detail screen makes an authorized, same-origin POST after mounting. That update is idempotent and
does not change the obituary's content version or modification timestamp. Existing records with no view
history are unviewed; no historical views or submitter IPs are invented. No data migration is needed.

The management table displays sender email and retained IP, supports an exact-IP filter and an unviewed
filter alongside existing filters, and offers publish/reject/edit/confirmed soft-delete actions. Birth and
death years remain on the detail screen. Quick actions share the existing version checks, audit transaction,
error handling and recoverable deletion behavior with the editor. The table scrolls within its container on mobile.

**Netlify setup:** set `TRUST_NETLIFY_PROXY=true` in the Production **Functions** environment, then redeploy.
It is not a secret. It is unnecessary if Netlify already provides `NETLIFY=true` at runtime. Enable this
setting only when Netlify's ingress is the sole public entry point; never expose the underlying Next.js
server directly with this setting. Only Netlify's overwritten `x-nf-client-connection-ip` header is accepted.
IP values must validate as one IPv4 or IPv6 address and IPv6 values are normalized. `x-forwarded-for`,
`cf-connecting-ip`, `x-real-ip`, and form-supplied IPs are ignored. Without a trusted header no raw IP is
stored; the existing security mechanisms use the shared `unknown` bucket, never an attacker-chosen address.
Existing security logs still contain only hashed IPs, and rate limits, Turnstile, token reuse, and duplicate
protections remain active. Turnstile's optional remote IP parameter is omitted when no trusted address is known.

Manual submissions store a private `submitterIp` field on the obituary.
It is hidden by default in Mongoose, excluded from all public serializers/projections and available only
through authorized, uncached administrative reads. Admin pages use `Referrer-Policy: no-referrer` so IP filters
are not forwarded in referrer headers. IPs do not appear in activity logs.
Stored email addresses and IPs must stay out of analytics and exported public data.

Raw IPs have **no automatic expiry**. The previous expiry field is no longer written or enforced, and the
scheduled IP cleanup function has been removed. Redeploy to remove any previously deployed cleanup schedule.
Existing retained IPs remain available regardless of old expiry metadata; previously purged IPs cannot be recovered.
Never add a TTL index to the obituary collection: it would delete whole obituaries.

`/admin/ip-keelud` lists active bans with exact-IP search and server-side pagination. Administrators can add
an IP manually, ban a submitter from the obituary table/detail screen, or reverse a ban. Bans have no expiry
and apply to future manual submissions, leaving existing obituaries and AI generation untouched. Only a
validated address from the trusted Netlify header is checked; unknown or forged IP headers are not used.
The ban check precedes Turnstile; all other existing protections still apply after an unban.

The private `ip_bans` collection stores a unique normalized IP, its `blocked` state, and timestamps. Unbanning
keeps an inactive record for audit identity. Ban/unban writes and their audit entries commit in one transaction;
activity logs store the ban record's ID rather than the raw IP. All ban pages/APIs require the existing admin
session, mutation Origin checks, validation, and private/no-store responses. No public API exposes ban data.

New IP indexes support exact-IP filtering. Mongoose creates them on connection under
the existing index permissions. The only new deployment setting is `TRUST_NETLIFY_PROXY`; no new dependency,
payment feature, public account, or change to the AI schedule is included.

Files created: the admin page/API/component directories and their tests; the six supporting library files above;
`src/lib/admin.integration.test.ts`; `src/views/AddAdPage.test.tsx`; `.env.example`; and the three admin scripts
(including `scripts/admin-browser-smoke.mjs`). Files modified: `README.md`, `next.config.mjs`, `package.json`,
`package-lock.json`, `vitest.setup.ts`, `src/lib/ads.ts`, `src/lib/ads.test.ts`, `src/app/api/ads/route.ts`,
`src/app/api/ads/route.test.ts`, `src/app/kuulutused/[slug]/page.tsx`, `src/app/robots.ts`,
`src/components/AddAdForm.tsx`, `src/context/language.ts`, `src/views/AddAdPage.tsx`, and `src/style.css`.
