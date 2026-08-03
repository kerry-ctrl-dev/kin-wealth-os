# Security Policy for MalinGu

This document describes the security model of MalinGu and how we handle sensitive data. It is a living document and should be updated as the app evolves.

## What we protect

- **Financial data**: income, expenses, assets, loans, goals, and reports are owned by a single user and isolated from other users.
- **Authentication**: handled by Lovable Cloud / Supabase Auth. Passwords are never stored in application code.
- **Files**: avatars and documents are stored in private storage buckets. Avatars are served through short-lived signed URLs scoped to the owner.
- **Secrets**: API keys and service credentials are stored as environment secrets and never committed to the repository.

## Current security measures

- **Row-Level Security (RLS)** is enabled on all user tables. Every policy scopes access to the authenticated user (`auth.uid()`).
- **GRANT statements** are issued alongside every new table so the authenticated role can access only what policies allow.
- **Server functions** that read or write sensitive data use `requireSupabaseAuth` middleware so they run with the user's own session.
- **Admin/privileged actions** are performed through `supabaseAdmin` only after authenticating the caller and verifying ownership.
- **Input validation** is applied to forms and server functions (Zod and helpers in `src/lib/validation.ts`).
- **Error messages** shown to users are generic; detailed error information is kept server-side.
- **MCP / agent access** is authenticated via OAuth. Tools forward the user's bearer token so RLS applies to agent queries too.

## What we do not do yet

This app does not currently provide:
- End-to-end encryption of financial records at rest.
- Built-in CSRF tokens or custom CSP headers (TanStack Start and the hosting platform handle baseline web security).
- Multi-factor authentication.
- Formal rate limiting beyond what the platform provides.
- Security incident response automation.

These are acceptable for a personal finance tracker at this stage but should be revisited as the user base grows.

## Responsible practices

- Never commit `.env` files or service keys.
- Keep dependencies updated and review audit output before deploying.
- Only grant `service_role` access to server-side code that needs it.
- Review new RLS policies carefully before applying migrations.
- Rotate the `LOVABLE_API_KEY` periodically.

## Reporting issues

If you discover a security issue, please contact the project owner directly. Do not open a public issue for sensitive vulnerabilities.
