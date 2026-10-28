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

`/admin` provides a single-administrator login, statistics, recent submissions, a paginated obituary table,
editing, moderation, recoverable deletion, and a paginated activity log. The interface uses the existing
Mantine theme and typography. Search, status, source, sort, and deleted-record filters stay in the URL.

New manual submissions pass the existing validation, Turnstile, origin, honeypot, token-reuse,
rate-limit, and duplicate checks, then enter `pending`. The form acknowledges review in Estonian or English.
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

The `Ad` schema adds `status` (`pending | published | rejected | archived`, default `pending`) and nullable
`deletedAt`. AI creation explicitly assigns `published`. Indexes support status/source plus creation ordering.
Search escapes regular-expression metacharacters; substring name search can still scan matching database records.
Admin edits allow only existing validated form fields and preserve slug, source, status, and creation time.
The existing `__v` field protects against stale or concurrent mutations. Dates can be cleared intentionally.

Transitions are centralized in `src/lib/moderation.ts` and applied in `src/lib/adminAds.ts`:
pending may be published/rejected; published may be archived; rejected may return to pending;
archived may return to pending or published. Deletion records `deletedAt` without removing data.
The deleted-record filter offers restoration into `archived`, requiring an explicit later publication action.
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

Files created: the admin page/API/component directories and their tests; the six supporting library files above;
`src/lib/admin.integration.test.ts`; `src/views/AddAdPage.test.tsx`; `.env.example`; and the three admin scripts
(including `scripts/admin-browser-smoke.mjs`). Files modified: `README.md`, `next.config.mjs`, `package.json`,
`package-lock.json`, `vitest.setup.ts`, `src/lib/ads.ts`, `src/lib/ads.test.ts`, `src/app/api/ads/route.ts`,
`src/app/api/ads/route.test.ts`, `src/app/kuulutused/[slug]/page.tsx`, `src/app/robots.ts`,
`src/components/AddAdForm.tsx`, `src/context/language.ts`, `src/views/AddAdPage.tsx`, and `src/style.css`.
