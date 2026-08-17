# HirelyStreet — Full-Stack App (Customer / Provider / Admin)

A real backend (Node + Express + SQLite, with bcrypt password hashing and JWT
authentication) and a mobile-ready React frontend that you can package into an
Android **.apk** using Capacitor. Three login types share one codebase:

- **Customer** — browse providers, book appointments, view/cancel/review bookings
- **Provider** — view incoming bookings, move them through upcoming → active → completed
- **Admin** — view all users/providers/bookings, suspend users, verify providers

> ⚠️ **Why there's no `.apk` file attached:** compiling a real Android app
> requires the Android SDK + Gradle (a multi-gigabyte toolchain) and a live
> connection to Google's Maven repositories. I built and validated this project
> in an offline sandbox, so I can't run that compile step myself. Everything
> below is written, syntax-checked source code — building the actual APK takes
> about 10 minutes once you have Android Studio installed. Steps are below.

---

## 1. Run the backend

```bash
cd backend
npm install
cp .env.example .env      # edit JWT_SECRET before going to production
npm run seed               # creates admin + demo customer + 3 demo providers
npm start                  # runs on http://localhost:4000
```

Demo accounts created by the seed script:

| Role     | Email                        | Password      |
|----------|-------------------------------|---------------|
| Admin    | admin@hirelystreet.com        | admin123      |
| Customer | customer@hirelystreet.com     | customer123   |
| Provider | arjun@hirelystreet.com        | provider123   |

The seed script also adds 10 starter **work categories** (Web Development,
Electrician, AC Repair, etc.) and gives each demo provider a UPI ID, so the
payment flow works immediately without extra setup.

Data is stored in `backend/hirelystreet.db` (a real SQLite file — inspect it
anytime with `sqlite3 hirelystreet.db` or a GUI tool like DB Browser for SQLite).
Passwords are hashed with bcrypt; nothing is stored in plaintext. All protected
routes require a valid JWT in the `Authorization: Bearer <token>` header.

> If you already ran this project before the profile-customization update,
> delete `backend/hirelystreet.db*` and re-run `npm run seed` — this update
> added a `portfolio_images` table that won't exist in an older DB file.

## 11. Interactivity pass (no dead buttons, services hierarchy, support email)

This update turned the customer app into something you can actually click
through end-to-end, and adapted the "make everything interactive" brief to
this project's real backend rather than a pure mock-data prototype.

**Real (backed by the database, same as everything else in this app):**
- `Services → Online/Offline → Sub-service → Providers` hierarchy:
  `/services` (two big Online/Offline cards) → `/services/:mode` (sub-service
  grid with live price ranges) → `/explore` (filtered results)
- Provider profile actions all do something real: Save (see below), Message
  (opens a conversation), Send Request (notifies + opens a conversation),
  Share (copies a real link built from `SITE_URL`)
- **Provider "Your Next Steps"** checklist on the provider dashboard — computed
  from actual profile data (skills, services, portfolio, UPI ID, verification
  status), each item clickable and takes you straight to fix it
- **Admin "Action Required"** panel — real counts (unverified providers,
  suspended users, missing categories), clickable, jumps to the right tab
- **Personal Information** page (`/account`) — genuinely saves to the database
  via a new `PATCH /api/auth/me` endpoint
- **Help & Support** (`/help`) — FAQ + `mailto:hirelystreet@gmail.com` contact
  buttons, using the new central `src/config.js` (`SUPPORT_EMAIL`, `SITE_URL`)
  so there's one place to update if/when a real domain is purchased
- One-click demo login — "Continue as Customer/Provider/Admin" on the login
  page logs in immediately instead of just filling the form

**Working, but client-side only (no backend table exists for these yet —
see `savedStore.js`, `messagesStore.js`, `notificationsStore.js` for exactly
what a real backend version would need):**
- **Saved providers** (`/saved`) — tap ❤️ on any provider, it persists across
  reloads on that device, shows in Saved, removable. Per-device, not synced
  across a customer's devices, since there's no `saved_providers` table.
- **Messages** (`/messages`) — real conversation UI, sending appends
  immediately, but stored in `localStorage`, so a provider on a different
  device won't see it. No `messages` table/websocket layer yet.
- **Notifications** (`/notifications`) — seeded with a few samples, plus real
  app events add to it (e.g. booking confirmed), read/unread state works, but
  it's local to the device, not pushed from the server.

**Not built in this pass (see "what's real vs. simplified" above for the
original list, plus these from the more recent interactivity spec):**
- Smart Requests / proposals system — there's no `smart_requests` or
  `proposals` table yet; this is the single biggest missing piece if you want
  the full "post a request, get competing proposals" flow.
- Admin disputes workflow, revenue drill-downs/reports, platform settings
  page beyond the read-only support-email/website display now on the
  overview tab.
- Provider "Today's Activity" timeline, analytics with tooltips, multi-step
  guided service-creation wizard (the provider profile page already lets you
  add/edit/delete services in one form, just not as a step-by-step wizard).

If you want any of these built out next, the pattern to follow is already
established: add a table in `db.js`, a route file in `backend/routes/`, wire
it into `api.js`, then a page in `frontend/src/pages/`.

## 2. Run the frontend (in the browser first)

```bash
cd frontend
npm install
npm run dev                # opens on http://localhost:5173
```

Log in with any of the demo accounts above and confirm the customer/provider/
admin flows work in the browser before packaging for Android.

## 3. Point the app at your backend

Before building for a phone, edit **`frontend/src/api.js`** (or set env var
`VITE_API_BASE`) so the app can reach your backend:

- **Android emulator** → `http://10.0.2.2:4000/api` (emulator's alias for your host machine)
- **Physical phone on same Wi-Fi** → `http://<your-computer's-LAN-IP>:4000/api`
- **Production** → deploy the `backend/` folder to any Node host (Render, Railway,
  a VPS, etc.) and use its public HTTPS URL

`localhost` will **not** work on a real device — it refers to the phone itself.

## 4. Build the Android APK

Requires [Android Studio](https://developer.android.com/studio) installed (it
bundles the Android SDK).

```bash
cd frontend
npm run build                    # produces frontend/dist
npx cap add android              # first time only — creates the android/ project
npx cap sync                     # copies dist/ into the native project
npx cap open android             # opens Android Studio
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
The finished file lands in `android/app/build/outputs/apk/debug/app-debug.apk`
— install it on a device with `adb install app-debug.apk`, or share the file
directly (enable "Install unknown apps" on the phone).

For a signed release build (needed for the Play Store), use **Build → Generate
Signed Bundle / APK** instead and follow Android Studio's signing wizard.

## 5. Project structure

```
backend/
  server.js            # Express entrypoint
  db.js                # SQLite schema (users, provider_profiles, services, bookings, reviews)
  seed.js               # creates admin + demo accounts
  middleware/auth.js    # JWT verification + role guard
  routes/auth.js        # signup, login, me
  routes/providers.js   # listing + provider profile management
  routes/bookings.js    # create/list/update bookings, reviews
  routes/admin.js       # admin-only: users, providers, bookings, overview stats

frontend/
  src/api.js             # fetch client (reads/writes JWT from localStorage)
  src/AuthContext.jsx     # React auth context (login/signup/logout/me)
  src/App.jsx             # role-based routing + route guards
  src/pages/               # Login, Signup, Explore, Provider Detail, Bookings,
                            # Provider Dashboard, Admin Dashboard
  capacitor.config.json   # Android app id/name + web asset dir
```

## 6. What's real vs. what's simplified

**Real:** password hashing (bcrypt), JWT auth with role-based route guards,
persistent SQLite storage, three genuinely separate login/permission types,
working booking lifecycle (upcoming → active → completed → paid → review),
admin moderation actions (suspend users, verify providers, manage work
categories).

**Simplified vs. the earlier HTML prototype:** this version focuses on the
core hire-and-book flow rather than every screen from the original mockup
(Smart Requests, in-app messaging, provider onboarding wizard, analytics
charts aren't wired to the database yet). The backend is structured so those
are straightforward to add — e.g. a `smart_requests` + `proposals` table
following the same pattern as `bookings`, or a `messages` table keyed by
booking/provider/customer. Ask if you'd like any of these added next.

## 7. How payment works (direct UPI QR, no escrow)

There is **no escrow** — HirelyStreet never touches the money. Instead:

1. Customer books a service → `bookings.payment_status = 'pending'`, `status = 'upcoming'`.
2. Provider does the work and moves the booking through their dashboard:
   `upcoming → active → completed`.
3. Once `status = 'completed'`, the customer's "My Bookings" page shows a
   **"Pay via UPI QR"** button. Tapping it calls `GET /api/bookings/:id/pay`,
   which builds a standard UPI deep link —
   `upi://pay?pa=<provider's UPI ID>&pn=<name>&am=<price>&cu=INR&tn=<note>` —
   and the frontend renders it as a scannable QR code (via the `qrcode`
   npm package, entirely client-side).
4. The customer scans it with **any** UPI app (GPay, PhonePe, Paytm, BHIM...)
   and pays the provider **directly**, peer-to-peer.
5. Since HirelyStreet isn't in the payment path, there's no webhook to confirm
   it automatically — the customer taps **"I've paid"**, which calls
   `PATCH /api/bookings/:id/confirm-payment` and marks it paid. (This is the
   honest tradeoff of not using a payment gateway/escrow: confirmation is
   self-reported. If you want gateway-verified payments later, swap this step
   for a real UPI payment gateway's webhook, e.g. Razorpay/Cashfree UPI intents.)

Providers set their UPI ID once from **Provider Dashboard → Payment settings**
(`PUT /api/providers/me/profile` with `{ upiId }`). A booking can't be paid
until the provider has one on file.

## 8. How admin adds "works" (service categories)

Admin → **Categories** tab:
- **Add** a category with a name and whether it's typically online/remote or
  offline/local work (`POST /api/admin/categories`).
- **Remove** one (`DELETE /api/admin/categories/:id`).

These categories power two things immediately: they show up as filter chips
on the customer Explore page, and providers pick from them (as a dropdown) on
their own profile page — see below.

## 9. Provider profile customization

Providers get a dedicated page — **Provider Dashboard → "Customize profile"**
(`/provider/profile`) — where they can:

- Edit their title, category (dropdown sourced from admin's categories),
  city, online/offline mode, starting price, "about" bio, and skill tags
- Add, edit and delete the individual services they offer (name, price,
  duration, description) — each becomes bookable on their public profile
- Upload portfolio photos directly from their device. Photos are read via
  the browser's file input, converted to a base64 data URI client-side, and
  POSTed to `POST /api/providers/me/portfolio`, which stores them in a new
  `portfolio_images` table. No external file storage/cloud bucket is needed
  for this — simplest possible setup — though if a provider base grows large
  you'd want to swap this for real object storage (S3, Cloudinary, etc.) since
  base64-in-SQLite doesn't scale to thousands of large images.
- All of this is reflected immediately on the public profile customers see
  at `/provider/:id` (skills badges, portfolio grid, services list).

Note: `server.js` raises the Express JSON body limit to 8mb to accommodate
base64-encoded photo uploads (Express defaults to 100kb, which would reject
them otherwise).

## 10. Guest browsing & navigation

The customer side no longer requires signing in just to look around — it
works like a typical consumer app:

- **Guests** can open the app and freely browse Home, Services, Explore, and
  individual provider profiles with zero login.
- Signing in is only prompted at the exact moment it's needed: tapping
  **Book** on a service, or opening **Bookings**/**Profile** shows a
  "Sign in to continue" banner instead of a hard redirect.
- Navigation is a bottom tab bar (Home / Bookings / Services / Profile) for
  guests and customers, matching a typical mobile app layout. Providers and
  admins keep a simpler top nav instead, since those are internal work tools,
  not something to browse anonymously.
- **Home** (`/`) — location header, search bar, promo banner, tappable offer
  codes, an online/offline toggle, and a "Top Categories" grid pulled from
  whatever categories admin has added, each showing a live price range
  computed from actual provider listings.
- **Services** (`/services`) — now a two-card Online/Offline hub (see section
  11 below for the full hierarchy); each card leads to `/services/:mode` for
  the actual sub-service list with price ranges.
- **Profile** (`/profile`) — shows a "Guest" card with a Sign in button when
  logged out, or your name/avatar and live stats (upcoming/completed
  bookings, total spent) when logged in.

All of this reuses the same backend endpoints as before — nothing new to run,
just `npm install` again in `frontend/` since a `qrcode`-adjacent dependency
list is unchanged, but do restart `npm run dev` to pick up the new pages.
