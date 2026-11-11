# PIXY

PIXY is a responsive social-network starter built with HTML, CSS and vanilla JavaScript, with Supabase Auth, Postgres, Storage and RLS foundations.

## Current foundation
- Animated PIXY launch screen and responsive social UI
- Email/password registration and sign-in, email OTP confirmation and password recovery flows
- Profiles, public feed, image/video upload (60-second video rule in UI), follow/search foundations
- Starter schema for stories, reactions, comments, conversations, messages, XION ledger and shop catalog
- Row Level Security policies and per-user media upload folders

## Setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Copy the project URL and publishable (or legacy anon) key into `config.js`.
4. In Supabase Auth, enable email confirmations, configure the site URL and redirect URLs, and configure SMTP before inviting real users. Use the email OTP template with `{{ .Token }}` if you want a numeric confirmation code.
5. Enable Realtime for the message tables when the chat client is implemented.
6. Deploy this repository to Vercel as a static site (no build command; output is repository root).

## Important security notes
- Never put a Supabase service-role key, database password, AWS secret, or SMTP password in `config.js`.
- XION balances are not client-editable. Reward issuance and purchases need trusted server-side validation and anti-abuse limits before they are enabled.
- Messaging and voice-note UI are planned; the schema includes conversation/message foundations but client-side chat delivery is not implemented yet.
- Add moderation, blocking, reporting, rate limits, abuse handling, and age-appropriate community rules before opening the network to the public.

## Files
- `index.html` — app shell and auth screens
- `styles.css` — PIXY visual design and responsive layout
- `app.js` — front-end interactions and Supabase client calls
- `config.js` — public Supabase client configuration placeholders
- `supabase/schema.sql` — initial database schema and RLS policies


## Current production limits

- Post media: maximum 50 MB per file; JPEG, PNG, WebP, GIF, MP4, WebM.
- Short videos: maximum 60 seconds (browser-side duration validation).
- Profile avatar: maximum 5 MB; JPEG, PNG, WebP.
- Post caption: maximum 2,200 characters.
- Profile display name: maximum 40 characters; bio: maximum 160 characters.
- Posts: 10 per user per day.
- Stories: 20 per user per rolling 24 hours; each story expires within 24 hours.
- Comments: 30 per user per hour.
- Messages: 60 per user per minute.
- Database-side activity limits are enforced by PostgreSQL triggers; media file-size and MIME limits are enforced by Supabase Storage.
- Vercel Firewall is enabled. Advanced OWASP Core Ruleset is unavailable on the current Vercel plan and requires a plan upgrade.
- Supabase security advisor currently reports no security lints after the rate-limit function permissions were restricted.

These are initial anti-abuse limits and should be reviewed before a larger public launch.
