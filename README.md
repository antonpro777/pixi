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
