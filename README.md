This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Testing expiration behavior

1. Start the dev server:

```powershell
npm install
npm run dev
```

2. (Optional) Run the quick DB test script to insert a short link that expires in 10 seconds:

```powershell
node ./scripts/test-expiry.js
```

This will print the inserted row including the `expiresAt` ISO timestamp.

3. In the app, create a URL short link and set an expiration a few seconds/minutes in the future. After the expiration time passes, visiting the short URL (`/r/<shortId>`) should show "This link has expired" and not redirect to the original URL.

If you still see a redirect after expiry, ensure your system clock/timezone is correct and that the stored `expiresAt` in `database.db` is an ISO string (e.g. `2025-10-20T07:30:00.000Z`).

## Deployment options

Here are three common ways to deploy this Next.js app. Choose one that fits your needs.

1) Vercel (recommended for Next.js)

- Create a Vercel account and install the Vercel CLI if you want to deploy from the terminal.
- In the Vercel dashboard, connect your GitHub repo and deploy. Vercel will build and serve the app.

Notes:
- Vercel's serverless environment doesn't persist a filesystem-based SQLite DB between invocations. If you deploy to Vercel and need persistent storage, use an external DB (Postgres, Supabase, Planetscale, etc.) and update `src/lib/db.ts` to connect to that DB.

2) Fly.io (simple for apps with SQLite)

- Initialize Fly project and deploy (requires Fly CLI):

```powershell
flyctl launch
flyctl deploy
```

- Mount a volume for the SQLite DB so the file persists. See Fly docs for `fly volumes create` and attach to the app.

3) Docker (self-host on any server)

- Build and run locally with Docker Compose (example, run in project root):

```powershell
docker compose build
docker compose up -d
```

- This will expose the app on port 3000 and persist the SQLite DB in `./data/database.db` on the host (see `docker-compose.yml`).

Environment variables

- `SQLITE_FILE` — path to the SQLite database file (default: `./database.db`). When using Docker Compose the service sets `SQLITE_FILE=/data/database.db`.

Switching to a managed DB

If you plan to deploy to serverless platforms (Vercel) or multiple instances, switch from SQLite to an external DB:

- Use Postgres (recommended): create a DB (Supabase, Railway, PlanetScale, etc.) and update `src/lib/db.ts` to use `pg` or an ORM like `Prisma`.

Need help picking an option? Tell me whether you want (A) easiest Next.js deployment (Vercel + external DB), (B) stick with SQLite and self-host Docker/Fly.io, or (C) I should add Postgres/Prisma wiring and migration scripts — I can implement it for you.
