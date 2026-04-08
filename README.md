# UniPod LMS

UniPod LMS is a role-based learning management platform built for course delivery, cohort-based programs, learner progress, messaging, and assignment workflows.

## Core Capabilities

- Authentication with role-aware access (`LEARNER`, `INSTRUCTOR`, `ADMIN`)
- Course catalog and lesson-based learning experience
- Instructor dashboard for course management and learner oversight
- Admin program management (programs, cohorts, phases, memberships)
- Notifications center and header notification tray
- Assignment submission and review flows
- Media and asset handling under `public/`

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Prisma ORM](https://www.prisma.io/) + PostgreSQL
- [NextAuth v5 beta](https://authjs.dev/)
- TypeScript + ESLint

## Project Structure

- `app/` - routes, pages, server actions, and API endpoints
- `components/` - shared UI components
- `lib/` - server-side helpers and domain logic
- `prisma/` - schema, migrations, and seed scripts
- `public/` - static assets and uploaded files
- `types/` - shared type declarations

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database (local or remote)

## Environment Variables

Create a `.env` file in the project root (or update the existing one) with values matching your environment:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
NEXTAUTH_SECRET="replace-with-a-secure-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Add any additional variables required by your deployment target.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Generate Prisma client:

   ```bash
   npm run db:generate
   ```

3. Apply database migrations:

   ```bash
   npm run db:migrate
   ```

4. (Optional) Seed sample data:

   ```bash
   npm run db:seed
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Database Utility Scripts

- `npm run db:up` - starts PostgreSQL via Docker Compose
- `npm run db:down` - stops PostgreSQL container(s)
- `npm run db:push` - syncs schema without migration files
- `npm run db:migrate` - creates/applies migrations
- `npm run db:seed` - runs seed script

## Build and Run

```bash
npm run build
npm run start
```

## Notes

- Uploaded files are stored under `public/uploads/`.
- If your DB host is remote, make sure network/VPN access is available before running server-side Prisma features.
