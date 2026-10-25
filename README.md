# SFS Alumni Golden Jubilee Portal

Source code for the St. Francis de Sales High School, Shanti Nagar, Secunderabad alumni portal.

## Local development
1. Install Node.js 18.17 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and configure the Supabase project URL and publishable/anon key.
4. Run `npm run dev` and open http://localhost:3000.

## Environment
Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` locally and in the deployment platform. Never commit `.env.local`, service-role keys, access tokens, or secrets.

## Database
The initial portal migration is in `supabase/migrations/20261025_sfs_alumni_portal.sql`. Review it against the target project's current schema and existing RLS policies before applying. The registration flow also references pre-registration and event-registration schema/RPCs that require separate validation.

## Main routes
- `/registration` — Golden Jubilee event registration
- `/signup` and `/login` — account access
- `/member` — verified member home
- `/directory` — verified alumni directory
- `/events`, `/stories`, `/memories` — alumni content
- `/admin` — membership review for authorised administrators

## Deployment checklist
Configure environment variables, run type-check/build, verify Supabase Auth redirects and email confirmation, test RLS for anonymous/pending/verified/admin users, and use a Vercel preview before production deployment.
