# Spec: Alumni portal clarity + moderated memories

**Status:** draft — awaiting review  

**Date:** 2026-10-27  
**Project:** SFS Alumni Golden Jubilee portal  
**Prior chat design:** approved (whole-portal pass C; members-only Memories; admin approval before publish; simplify nav + Home actions)

## Goal

Make the alumni portal easier to understand at a glance, and let verified members contribute photos/memories that only appear after committee approval.

## Non-goals

- Public (guest) browsing of Memories
- Redesigning the marketing homepage or Admin chrome beyond a Memories review submenu
- Full Stories CMS rewrite (Stories may stay as a secondary/linked page or fold into Memories copy later)
- Video uploads, albums, comments, or social reactions in v1
- Changing event registration / payment flows

## Actors

| Actor | Capabilities |
|---|---|
| Guest | Cannot open Memories or Directory content behind MemberGate; can still use public marketing + login/signup |
| Verified member | Portal nav; Home hub; browse published memories; submit memory (pending); see own submission statuses |
| Pending / rejected / suspended member | MemberGate rules unchanged |
| Admin | `/admin/memories` queue: Approve / Reject pending submissions; portal Admin link unchanged |

## Success criteria

1. Portal primary nav is short and task-named: **Home · People · Events · Memories** (+ Admin when applicable). Association is secondary, not a peer tab.
2. Home leads with venue pass / registration, then three clear CTAs (Find people, Events, Share a memory).
3. Memories is **members-only**; published grid only shows `status=published`.
4. Member can upload image + title (+ optional caption/batch) with consent; row starts as `pending` and never appears in the published grid until approved.
5. Admin can approve/reject pending items; approve sets `published` and reviewer metadata; reject sets `rejected`.
6. Member can see **My submissions** (pending / rejected / published) so they are not left guessing.
7. Visual language stays SFS navy / gold / surface (no new blue/purple theme).

---

## Information architecture

### Portal nav (`PortalShell`)

| Label | Route | Notes |
|---|---|---|
| Home | `/member` | Hub |
| People | `/directory` | Rename from “Alumni directory” |
| Events | `/events` | Unchanged |
| Memories | `/memories` | Members only |
| Admin | `/admin` | Admins only |

**Association** (`/about-association`): remove from primary chip row; link from Home footer or page intro “About the association”.

**Stories** (`/stories`): keep route for now; remove from primary nav (discoverable later or from Memories intro). Avoid two competing “content” tabs.

### Admin nav

Add **Memories** under AdminShell alongside Membership / Events / Registrations.

---

## Home (`/member`)

Order:

1. Existing `MemberVenuePass` (registration / venue pass).
2. Action cards (same destinations, clearer verbs):
   - **Find people** → `/directory`
   - **Events** → `/events`
   - **Share a memory** → `/memories#share` (or opens share panel)
3. Optional: “Your memory submissions” — up to 3 recent own rows with status chips.
4. Jubilee banner can stay, shortened; include link to Association.

Copy: replace vague “Explore ↗” with the action name.

---

## Memories (members only)

### Browse

- `MemberGate` required.
- Load published memories via **service-role API** (table-auth), not browser Supabase Auth RLS against old `users` policies.
- Card: image, title, optional caption, batch label.

### Share a memory

Fields:

- Image (required) — jpeg/png/webp; reasonable size cap (e.g. 5 MB)
- Title (required)
- Description / caption (optional)
- Batch label (optional text or year)
- Consent checkbox (required) — “I have the right to share this and agree the committee may publish it”

On submit: upload to Storage → insert row with `status=pending`, `submitted_by` = alumni account id, `consent_confirmed=true`.

### My submissions

List own rows with status: Pending · Published · Rejected. Rejected may show a short admin note if we store one (optional `review_note` column).

---

## Data & storage

### Table

Prefer evolving `public.alumni_memories`:

| Change | Why |
|---|---|
| `submitted_by` → FK `alumni_accounts(id)` (or parallel column if migration safer) | Match table-auth |
| Keep `status` in (`pending`,`published`,`rejected`) | Already correct |
| Keep `image_url`, `storage_path`, `title`, `description`, `batch_label`, `consent_confirmed` | |
| `reviewed_by` → `alumni_accounts`; `reviewed_at` | Committee audit |
| Optional `review_note text` | Reject reason for member |

RLS that depends on `auth.uid()` / `public.users` is **not** the write path for the app. App uses session cookie + service role APIs (same as events/registrations). Optionally tighten RLS to deny anon/authenticated direct writes.

### Storage

- Bucket e.g. `alumni-memories` (private preferred; signed URLs for display, or public read-only object paths after publish).
- Upload only through authenticated API that checks verified member.
- On reject/delete, optional cleanup of storage object (nice-to-have; not blocking).

---

## APIs

| Endpoint | Who | Behavior |
|---|---|---|
| `GET /api/memories` | Verified member | Published list |
| `GET /api/memories/mine` | Verified member | Own submissions |
| `POST /api/memories` | Verified member | Multipart or URL-after-upload; creates `pending` |
| `GET /api/admin/memories?status=` | Admin | Queue |
| `PATCH /api/admin/memories/[id]` | Admin | `{ status: 'published' \| 'rejected', review_note? }` |

Committee accounts do not need to submit memories for v1 (optional allow).

---

## Admin Memories UI

`/admin/memories`:

- Tabs: Pending (default) · Published · Rejected
- Row/card: thumbnail, title, caption, submitter name, batch, date
- Actions: Approve · Reject (reject may prompt for optional note)

---

## Display & intuition principles (whole portal)

- One primary action per section.
- Labels are verbs or nouns people already use (People, not “Alumni directory”).
- Empty states tell the next step (“No published memories yet — share one for the committee to review”).
- Pending never looks “live” in the archive grid.

---

## Testing

- Member cannot list pending of others; published-only on main grid.
- Submit without consent → 400.
- Approve → appears on `GET /api/memories`; reject → does not.
- Guest hitting Memories → gated to login.
- Nav snapshot: Stories/Association not in primary chip row.

## Out of scope follow-ups

- Fold Stories fully into Memories
- Public marketing gallery of selected memories
- Bulk admin import of archive photos
