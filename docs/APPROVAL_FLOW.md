# Approval Flow — Finventree

---

## Part 1 — Developer Reference

### Architecture Overview

The approval flow involves four components working together:

```
Tenant fills /register (web)
        ↓
  submit-tenant-request (Edge Fn)  →  tenant_requests table
        ↓
  Admin reviews at admin.finventree.com/approvals
        ↓
  approve-tenant (Edge Fn)
    ├─ creates tenant row
    ├─ creates profile row
    ├─ inviteUserByEmail (Supabase Auth)  →  email with magic link
    └─ marks request as "approved"
        ↓
  Tenant clicks link  →  finventree.com/activate
        ↓
  Tenant sets password  →  redirected to app.finventree.com
```

---

### Step-by-Step Code Path

#### 1. Signup Request — `submit-tenant-request` edge function
- Called by `apps/web/src/app/register/page.tsx` on form submit
- Captures `full_name`, `org_name`, `email`, `phone`, `device_fingerprint` (FingerprintJS), `request_ip` (server-side from `req.headers`)
- Inserts a row into `public.tenant_requests` with `status = 'pending'`
- Does NOT create a Supabase Auth user yet

#### 2. Admin Review — `apps/admin/src/app/approvals/page.tsx`
- Lists all `tenant_requests` where `status = 'pending'`
- Displays: name, org, email, phone, IP address, and a duplicate-device warning badge if the same device fingerprint was seen before
- Approve / Reject / Reset buttons

#### 3. Approval — `approve-tenant` edge function
Called from the admin page's `handleApprove()`:

```
POST supabase.functions.invoke("approve-tenant", {
  body: { requestId, redirectTo }
})
```

The function does the following in order:
1. Fetches the `tenant_request` row by `requestId`
2. Derives a URL slug from `org_name`
3. Creates (or finds existing) `tenants` row with `plan = 'trial'`, `plan_expires_at = now + 180 days`, and the anti-abuse provenance fields (`signup_phone`, `signup_device_fingerprint`, `signup_ip`)
4. Runs duplicate-device-fingerprint check — returns `duplicateWarnings[]` to the admin UI if any matches found
5. Deletes any existing Supabase Auth user for the email (to ensure a fresh token is issued)
6. Calls `supabase.auth.admin.inviteUserByEmail(email, { redirectTo, data: { tenant_id, role: 'admin' } })`
7. Upserts the `profiles` row linking the new user to the tenant
8. Updates `tenant_requests.status = 'approved'`

#### 4. Invite Email
Supabase sends the invite email from its own mailer. The email contains a link like:
```
https://[SUPABASE_PROJECT].supabase.co/auth/v1/verify?token=...&type=invite&redirect_to=https://finventree.com/activate
```
Supabase will append the token as a URL hash on redirect, giving:
```
https://finventree.com/activate#access_token=...&refresh_token=...&type=invite
```

#### 5. Activate Page — `apps/web/src/app/activate/page.tsx`
- Parses `#access_token` + `#refresh_token` from the URL hash (manually, because the Supabase client uses `flowType: "pkce"` which ignores hash tokens by default)
- Calls `supabase.auth.setSession()` to establish the session
- Shows a password-set form
- On success, generates a handoff token and redirects the user to `app.finventree.com`

---

### Known Bug — Invite Email Links to `app.finventree.com` Instead of `finventree.com/activate`

#### Root Cause

The `redirectTo` URL passed to `inviteUserByEmail` is only honoured by Supabase if it is in the **"Redirect URLs" whitelist** in the Supabase Auth settings for the production project.

The code correctly constructs `redirectTo = "https://finventree.com/activate"`, but the **production Supabase project's whitelist does not include this URL**. When Supabase sees an unrecognised `redirectTo`, it silently falls back to the project's configured **Site URL** — which is currently `https://app.finventree.com`. That is why the tenant ends up on the app instead of the password-set page.

The `supabase/config.toml` only controls local development settings; production URL config lives exclusively in the Supabase Dashboard and is not tracked in source code.

#### Fix (do this now in the Supabase Dashboard)

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Confirm **Site URL** is set to `https://app.finventree.com` (the app) — leave it
3. Under **Redirect URLs**, add ALL of the following:

```
https://finventree.com/activate
https://finventree.com/**
https://www.finventree.com/**
http://localhost:5175/activate
http://localhost:3000/**
https://finventree-web.pages.dev/**
https://finventree-web-preview.pages.dev/**
```

4. Click **Save**

After saving, the next approval will correctly land the tenant on `finventree.com/activate`.

#### How `redirectTo` is Resolved in the Admin Page

`apps/admin/src/app/approvals/page.tsx` builds the URL dynamically based on where the admin panel is hosted:

| Admin hostname | `redirectTo` sent to edge fn |
|---|---|
| `localhost` / `127.0.0.1` | `http://localhost:5175/activate` |
| `admin.finventree.com` | `https://finventree.com/activate` ✅ |
| `finventree-admin.pages.dev` (preview) | `https://finventree-web.pages.dev/activate` |
| anything else | `https://finventree.com/activate` (default fallback) |

The code is correct. The Supabase whitelist is the only thing that needs updating.

---

### Database Tables Involved

| Table | Key Columns | Role in Flow |
|---|---|---|
| `public.tenant_requests` | `id`, `status`, `email`, `org_name`, `phone`, `device_fingerprint`, `request_ip` | Holds pending/approved/rejected signups |
| `public.tenants` | `id`, `slug`, `plan`, `plan_expires_at`, `is_active`, `signup_*` fields | The live tenant record, created on approval |
| `public.profiles` | `id` (= auth UID), `tenant_id`, `role`, `email` | Links Supabase Auth user to a tenant |
| `auth.users` (managed by Supabase) | `id`, `email`, `invited_at` | Created by `inviteUserByEmail` |

---

### Resending an Invite

If a tenant never received the email or the link expired:
1. In the admin panel, click **Reset** on the request (sets status back to `pending`)
2. Click **Approve** again
3. The edge function will delete the stale auth user and issue a fresh invite token

Alternatively, in Supabase Dashboard → Authentication → Users → find the user → click **Send Magic Link** (this does NOT go through your custom `redirectTo` logic, so the user will land on Site URL — only use as a last resort).

---

### Email Template Customisation

The invite email body is controlled by Supabase's email templates:
**Supabase Dashboard → Authentication → Email Templates → Invite user**

The default template includes `{{ .ConfirmationURL }}` which already incorporates the `redirectTo` you passed. You can customise the subject line and HTML body there.

---

## Part 2 — User-Facing Understanding

### How Does Someone Get Access to Finventree?

Finventree is invite-only. You cannot self-register — access is granted by the Finventree team after reviewing your request.

---

### Step 1 — Request Access

Go to **finventree.com/register** and fill in:
- Your full name
- Your business / organisation name
- Your email address
- Your phone number

Submit the form. You'll see a confirmation screen that says your request is under review.

---

### Step 2 — Wait for Review

The Finventree team reviews all requests manually. This typically takes 1–2 business days. You don't need to do anything during this time.

---

### Step 3 — Invitation Email

Once your request is approved, you'll receive an email from Finventree with the subject **"You have been invited"**.

The email contains a single button or link — **"Accept Invitation"** or **"Activate Account"**. Click it.

> **Important:** The link expires after **24 hours**. If it has expired, contact support to have a new one sent.

---

### Step 4 — Set Your Password

Clicking the link takes you to **finventree.com/activate** where you'll be asked to set a password for your account.

- Password must be at least 8 characters
- Choose something secure — this is your business account

Click **Activate Account**.

---

### Step 5 — Download the App

After setting your password you'll see a screen with links to download the Finventree mobile app:

- **Android** — Google Play Store
- **iOS** — App Store (coming soon)

Your account is now active. Log in to the app with the email you registered and the password you just set.

---

### I Didn't Receive the Email

Check your spam/junk folder — the email comes from Supabase's mailer and may land there.

If you still don't see it:
- Email **support@finventree.com** with the email address you used to register
- The team can resend the invitation

---

### My Invitation Link Didn't Work

If you see an error after clicking the link, the token has most likely expired (links are valid for 24 hours). Contact support to get a new one sent.

---

### Can I Log In Without Setting a Password First?

No. The invitation link is a one-time token that establishes your identity. You must set a password through the activation page before you can log in to the mobile app.

Once your password is set, you can log in from the app at any time using **email + password**.
