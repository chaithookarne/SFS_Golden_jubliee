# SFS Alumni Golden Jubilee Portal

Source code for the St. Francis de Sales (SFS), Shanti Nagar, Secunderabad alumni portal.

This repository is being populated from the existing public source repository and the Supabase-connected working copy. Never commit `.env.local`, `.env`, Supabase service-role keys, access tokens, or other secrets.

## Local development

1. Install Node.js (LTS).
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set the Supabase URL and publishable/anon key.
4. Run `npm run dev`.

## Database

Supabase SQL migrations are in `supabase/migrations/`. Review and apply migrations in the intended project before deploying.
