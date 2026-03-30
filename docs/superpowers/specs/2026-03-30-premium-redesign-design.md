# SkillSwap KNUST — Premium Redesign Spec
**Date:** 2026-03-30  
**Status:** Awaiting implementation approval

---

## PART 1 — FULL CODEBASE AUDIT

### Stack (skillswap-knust)
- **Framework:** Next.js 16.1.6 (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui (radix-ui primitives)
- **Backend:** Supabase (Postgres + Auth + Realtime + Storage)
- **Animation:** Framer Motion 12
- **Forms:** React Hook Form + Zod
- **Toasts:** Sonner
- **Push:** web-push (PWA-ready)
- **Themes:** next-themes (light/dark)
- **Font:** Geist Sans + Geist Mono

---

### Route Map

| Route | File | Status | Notes |
|-------|------|--------|-------|
| `/` | `app/page.tsx` | ✅ Built | Minimal hero + 3 feature cards |
| `/login` | `app/login/page.tsx` | ✅ Built | Card-centered, Zod validation, show/hide password |
| `/register` | `app/register/page.tsx` | ✅ Built | Name + email + faculty + password |
| `/onboarding` | `app/onboarding/page.tsx` | ⚠️ Stub | Just redirects to /profile |
| `/dashboard` | `app/dashboard/page.tsx` | ✅ Built | Stats grid, upcoming sessions, top matches, badges |
| `/search` | `app/search/page.tsx` | ✅ Built | Full-text + multi-filter (faculty/mode/category/level) |
| `/matches` | `app/matches/page.tsx` | ✅ Built | Scored match list with tabs (all/mutual/teach/learn) |
| `/sessions` | `app/sessions/page.tsx` | ✅ Built | CRUD: accept/decline/complete/rate + notes |
| `/messages` | `app/messages/page.tsx` | ✅ Built (77KB) | Realtime chat, voice/image/doc, reply, pin, react, forward |
| `/profile` | `app/profile/page.tsx` | ✅ Built | Edit profile, avatar upload, skills, availability |
| `/profile/[userId]` | `app/profile/[userId]/page.tsx` | ✅ Built | Public profile + Book Session dialog |
| `/api/push/send` | `app/api/push/route.ts` | ✅ Built | Web-push notification sender |

---

### Component Inventory

**Layout & Shell**
- `navbar.tsx` — Collapsible desktop sidebar (w-60 → w-68px) + mobile hamburger sheet
- `app-shell.tsx` — Content area padding wrapper (accounts for sidebar/topbar)
- `theme-provider.tsx` — next-themes wrapper
- `error-boundary.tsx` — React error boundary with fallback UI
- `push-prompt.tsx` — PWA push subscription prompt

**shadcn/ui Primitives (17 components)**
`avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `select`, `separator`, `sheet`, `skeleton`, `sonner`, `tabs`, `textarea`, `tooltip`

---

### Database Schema (Supabase)

```
profiles          id (uuid/FK auth.users), name, email, faculty, bio, avatar_url,
                  skills_to_teach (JSONB [{name, level, category}]),
                  skills_to_learn (JSONB), availability (text[]),
                  preferred_mode (online|offline|both), contact,
                  rating (numeric 3,2), total_ratings, xp, last_seen, created_at

sessions          id, teacher_id (FK), learner_id (FK), skill, date, time,
                  mode (online|offline), location, status (pending|accepted|completed|cancelled),
                  teacher_rating, learner_rating, teacher_feedback, learner_feedback,
                  notes, created_at

messages          id, sender_id (FK), receiver_id (FK), content, type (text|resource|audio|image|document),
                  read, delivered, reply_to, reply_preview, reply_sender_id,
                  deleted_at (soft-delete), pinned, edited_at, forwarded_from, created_at

message_reactions id, message_id (FK), user_id (FK), emoji, created_at

notifications     id, user_id (FK), type, title, message, link, read, created_at

storage: avatars  Public bucket for user avatar images
```

---

### Feature Completeness Matrix

| Feature | Exists | Quality |
|---------|--------|---------|
| Email auth (sign up / sign in) | ✅ | Good |
| Profile setup (skills/availability/faculty) | ✅ | Good |
| Avatar upload (Supabase Storage) | ✅ | Good |
| Smart peer matching algorithm | ✅ | Good |
| Peer search + filters | ✅ | Good |
| Session booking (from public profile) | ✅ | Good |
| Session lifecycle (accept/decline/complete) | ✅ | Good |
| Session ratings + reviews | ✅ | Good |
| Session notes | ✅ | Good |
| Real-time messaging (Supabase Realtime) | ✅ | Excellent |
| Message types (text/audio/image/doc) | ✅ | Excellent |
| Message reactions, reply, pin, forward | ✅ | Excellent |
| In-app notifications | ✅ | Good |
| Push notifications (web-push) | ✅ | Good |
| Dark mode | ✅ | Good |
| Badges / gamification | ✅ | Basic (5 badges, XP exists but unused in UI) |
| PWA manifest | ✅ | Basic |
| Landing page | ⚠️ | Weak (minimal, no social proof) |
| Onboarding flow | ❌ | Missing (redirects to profile edit) |
| Leaderboard | ❌ | Missing |
| Skill endorsements | ❌ | Missing |
| Group sessions | ❌ | Missing |

---

## PART 2 — REFERENCE DESIGN DNA (skillswap)

### Visual Language to Extract

| Element | Reference Design Value |
|---------|------------------------|
| Primary color | Deep Navy `#0F2B4C` / `#0B1F3A` |
| Accent color | Sky Blue `#4DA6E8` |
| Background | Pure white `#FFFFFF` + light gray `#F8F9FA` |
| Hero style | Full-bleed dark navy with sky glow blobs + right-side image |
| CTA buttons | `rounded-full` pills with solid fills |
| Nav pills | `rounded-full` with `bg-sky-100 text-navy-800` for active |
| Cards | `rounded-2xl` with `border border-gray-200 hover:shadow-lg` |
| Category tags | `rounded-full` pill on image `bg-sky-500 text-white` |
| Footer | Dark navy gradient (`from-navy-800 to-navy-900`) |
| Section rhythm | `py-16 sm:py-20` alternating white / gray-50 |
| Typography | Inter variable, bold headings on navy, gray-500 body |

### Reference Page Architecture (landing)
1. **Hero** — Dark navy, large type, sky accent, dual CTA, right-side hero image
2. **How It Works** — 3-step icons on white
3. **Featured Skills** — Cards with images + category pills + instructor + rating
4. **Testimonials** — Quote cards on gray-50
5. **CTA** — Single conversion moment
6. **Footer** — Dark with columns + copyright

---

## PART 3 — TOP 3 UX FRICTION POINTS

### #1 — Landing Page Has Zero Conversion Power *(CRITICAL)*
The live `/` page is a bare-bones hero with 3 tiny feature cards and two buttons. It has no social proof, no "how it works" steps, no sample profiles/skills, no testimonials. The reference design's rich landing architecture is directly applicable and completely absent. **Impact:** New users leave without understanding the platform's value.

### #2 — Mobile Navigation is Wrong Pattern *(HIGH)*
The app uses a hamburger menu that opens a slide-in sheet. On a mobile-first student platform used while walking campus, this requires 2 taps for every navigation action. The correct pattern is a **sticky bottom navigation bar** with 5 items + icons + labels. The reference design's scrollable top tab row is better but also not optimal. **Impact:** Daily active use friction.

### #3 — No Unified Design Token System / Color Chaos *(HIGH)*
The codebase uses raw Tailwind utility colors inline: `bg-amber-500`, `text-blue-600`, `text-green-600`, `text-purple-600`, `text-red-500`, `bg-amber-100`, etc. — all hardcoded in component markup. There are no semantic color tokens (e.g., `text-primary`, `bg-surface-elevated`, `text-success`). This means dark mode is fragile, redesigns require global find-and-replace, and the brand identity is incoherent. **Impact:** Impossible to scale, inconsistent appearance.

---

## PART 4 — WORLD-CLASS DESIGN SYSTEM

### 4.1 Brand Identity Decision

Merging both projects: **Navy authority + Gold warmth + Sky interactivity**

KNUST's institutional colors are **gold and dark green**. The reference design uses Navy. The live app uses Amber. The merged identity:

- **Primary** = Deep Navy (authority, trust, academic prestige)  
- **Brand Accent** = KNUST Gold (warmth, identity, energy, CTAs)  
- **Interactive** = Sky Blue (links, badges, highlights)  
- **Success** = Emerald  
- **Danger** = Rose  

---

### 4.2 Color Palette

```css
/* === PRIMARY — Deep Navy === */
--color-navy-950: #060f1e;
--color-navy-900: #0b1f3a;
--color-navy-800: #0f2b4c;   /* PRIMARY — main brand */
--color-navy-700: #153a5f;
--color-navy-600: #1a4a75;
--color-navy-500: #22628f;
--color-navy-400: #3a84b5;
--color-navy-300: #6aafd6;
--color-navy-200: #a8d4ec;
--color-navy-100: #daeef9;
--color-navy-50:  #f0f8fd;

/* === ACCENT — KNUST Gold === */
--color-gold-950: #2d1a00;
--color-gold-900: #5c3500;
--color-gold-800: #8b5000;
--color-gold-700: #b86800;
--color-gold-600: #e08000;
--color-gold-500: #f59e0b;   /* ACCENT — primary CTA */
--color-gold-400: #fbbf24;
--color-gold-300: #fcd34d;
--color-gold-200: #fde68a;
--color-gold-100: #fef3c7;
--color-gold-50:  #fffbeb;

/* === INTERACTIVE — Sky Blue === */
--color-sky-700: #0369a1;
--color-sky-600: #0284c7;
--color-sky-500: #4da6e8;
--color-sky-400: #6bb8f0;
--color-sky-100: #e0f2fe;
--color-sky-50:  #f0f9ff;

/* === SEMANTIC === */
--color-success-800: #166534;
--color-success-600: #16a34a;
--color-success-100: #dcfce7;
--color-success-50:  #f0fdf4;

--color-warning-800: #92400e;
--color-warning-600: #d97706;
--color-warning-100: #fef3c7;
--color-warning-50:  #fffbeb;

--color-danger-800:  #9f1239;
--color-danger-600:  #e11d48;
--color-danger-100:  #ffe4e6;
--color-danger-50:   #fff1f2;

--color-info-600:    #4da6e8;
--color-info-100:    #e0f2fe;
--color-info-50:     #f0f9ff;

/* === SURFACE HIERARCHY (Light Mode) === */
--surface-page:     #f8fafc;   /* page background */
--surface-card:     #ffffff;   /* default card */
--surface-elevated: #ffffff;   /* elevated card (stronger shadow) */
--surface-overlay:  #ffffff;   /* modals, popovers */
--surface-subtle:   #f1f5f9;   /* muted input backgrounds */

/* === SURFACE HIERARCHY (Dark Mode) === */
--surface-page:     #0a0f1a;
--surface-card:     #111827;
--surface-elevated: #1e2535;
--surface-overlay:  #1e2535;
--surface-subtle:   #1a2236;
```

---

### 4.3 Typography System

```css
/* === FONTS === */
/* Display/Headings: Plus Jakarta Sans */
/* Body/UI:          Inter */
/* Mono:             JetBrains Mono (skill tags, code snippets) */

/* === TYPE SCALE (strict — no deviations) === */
--text-xs:   12px / line-height: 1.5 / tracking: 0.01em   /* labels, captions */
--text-sm:   14px / line-height: 1.5 / tracking: 0         /* secondary text */
--text-base: 16px / line-height: 1.6 / tracking: 0         /* body */
--text-lg:   20px / line-height: 1.5 / tracking: -0.01em   /* card titles */
--text-xl:   24px / line-height: 1.4 / tracking: -0.01em   /* section headings */
--text-2xl:  32px / line-height: 1.3 / tracking: -0.02em   /* page headings */
--text-3xl:  40px / line-height: 1.2 / tracking: -0.025em  /* hero sub-headline */
--text-4xl:  56px / line-height: 1.1 / tracking: -0.03em   /* hero headline */

/* === WEIGHT SYSTEM === */
--font-light:    300  /* hero taglines */
--font-regular:  400  /* body, descriptions */
--font-medium:   500  /* labels, nav items */
--font-semibold: 600  /* card titles, button text */
--font-bold:     700  /* page headings, hero */
```

---

### 4.4 Spacing + Layout Grid

```
Base unit: 8px
Scale: 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64 / 80 / 96 / 128

Max content width:  1280px
Section padding-x:  24px (mobile) / 48px (tablet) / 96px (desktop)
Section padding-y:  64px (mobile) / 80px (desktop)
Card padding:       24px (standard) / 32px (feature card)
Nav sidebar width:  240px (expanded) / 68px (collapsed)
```

---

### 4.5 Border Radius Scale

```
--radius-sm:   4px   (inputs, small badges)
--radius-md:   8px   (buttons, small cards)
--radius-lg:   12px  (standard cards)
--radius-xl:   16px  (feature cards)
--radius-2xl:  20px  (hero cards, modals)
--radius-full: 9999px (pills, avatars, tags)
```

---

### 4.6 Elevation / Shadow System

```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
--shadow-md:  0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
--shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05);
--shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05);
--shadow-glow-gold: 0 0 24px rgba(245,158,11,0.25);    /* CTA hover glow */
--shadow-glow-navy: 0 0 32px rgba(15,43,76,0.15);      /* hero accent */
```

---

### 4.7 Animation Tokens

```
--duration-fast:   150ms  (micro-interactions: hover, focus)
--duration-normal: 250ms  (page transitions, modals enter)
--duration-slow:   350ms  (complex reveals, hero animations)
--easing-enter:    cubic-bezier(0.0, 0.0, 0.2, 1.0)  (ease-out)
--easing-exit:     cubic-bezier(0.4, 0.0, 1.0, 1.0)  (ease-in)
--easing-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)  (bounce for interactive feedback)
```

---

### 4.8 Component Primitives — Spec

#### Button
| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | gold-500 | white | none | gold-600 + shadow-glow-gold |
| Secondary | navy-800 | white | none | navy-700 |
| Outline | transparent | navy-800 | navy-800/30 | navy-50 bg |
| Ghost | transparent | navy-700 | none | navy-50 bg |
| Destructive | danger-600 | white | none | danger-700 |
| Icon | transparent | foreground | none | muted bg |

All buttons: `rounded-full` (pills) for primary/CTA; `rounded-lg` for inline/form.  
All buttons: loading state with spinner, disabled at 40% opacity.  
Min height: 44px (touch target). Min width on icon-only: 44px.

#### Input
- Default: `rounded-lg border border-gray-200 bg-surface-subtle`
- Focus: `border-gold-500 ring-2 ring-gold-500/20`
- Error: `border-danger-600 ring-2 ring-danger-600/20`
- Disabled: `opacity-50 cursor-not-allowed`
- Floating label animation (label slides up on focus/fill)
- Helper text: `text-xs text-muted-foreground` below field
- Error text: `text-xs text-danger-600` below field

#### Card
- Default: `bg-surface-card rounded-xl border border-gray-100 shadow-sm`
- Hover-elevated: `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
- Selected: `border-gold-500 ring-2 ring-gold-500/20 shadow-md`
- Feature card: `rounded-2xl shadow-lg` (for landing / hero cards)
- Skeleton: shimmer animation `bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100`

#### Badge / Tag / Pill
- Category pill: `rounded-full bg-gold-100 text-gold-800 text-xs font-semibold px-3 py-1`
- Skill teach: `rounded-full bg-success-50 text-success-800 border border-success-100`
- Skill learn: `rounded-full bg-sky-50 text-sky-700 border border-sky-100`
- Status pending: `rounded-full bg-warning-100 text-warning-800`
- Status active: `rounded-full bg-success-100 text-success-800`
- Status completed: `rounded-full bg-navy-100 text-navy-800`
- Match score: `rounded-full bg-gold-100 text-gold-700 font-mono text-xs`

#### Avatar
- Ring variants: `ring-2 ring-success-500` (online), `ring-2 ring-gold-500` (featured)
- Fallback: initials with `bg-gold-100 text-gold-800 font-semibold`
- Status dot: absolute `bottom-0 right-0` 12px circle with 2px white border
- Sizes: 32px / 40px / 48px / 64px / 80px

#### Empty State
- Centered layout: SVG illustration (abstract, minimal) + h3 + p + CTA button
- Illustration tint matches section accent color
- Example: "No matches yet — Add skills to your profile to find peers" + "Edit Profile" button

#### Toast (Sonner)
- Position: `top-right` on desktop, `top-center` on mobile
- Success: left border `border-l-4 border-success-500`
- Error: left border `border-l-4 border-danger-500`
- Duration: 4 seconds, swipe-to-dismiss

#### Modal / Dialog
- Backdrop: `bg-navy-950/60 backdrop-blur-sm`
- Container: `rounded-2xl bg-surface-overlay shadow-xl`
- Enter: scale(0.95) + opacity(0) → scale(1) + opacity(1), 250ms ease-out
- Exit: 150ms ease-in

---

### 4.9 Navigation Architecture

#### Desktop (≥ 768px) — Collapsible Sidebar
- Width: 240px expanded / 68px collapsed
- Logo area: 72px height
- Nav items: 44px height, `rounded-lg`, icon + label
- Active: `bg-navy-50 text-navy-800 font-semibold` (light) / `bg-navy-800/20 text-gold-400` (dark)
- Bottom section: Notifications, Theme toggle, User avatar + name, Logout
- Collapse toggle: `PanelLeftClose` / `PanelLeft` icon

#### Mobile (< 768px) — Bottom Navigation Bar *(REDESIGN)*
Replace hamburger sheet with a fixed bottom nav bar:
- 5 items: Dashboard, Find, Matches, Sessions, Messages
- Height: 64px + safe-area-inset-bottom
- Icon: 24px + Label: 10px below
- Active: gold-500 icon + label; Inactive: gray-400
- Badge overlay for unread counts
- Background: `bg-surface-card/95 backdrop-blur border-t`

#### Mobile Topbar
- Remains as: Logo center + Profile avatar right + Notification bell
- Remove hamburger menu icon entirely

---

### 4.10 Page-by-Page Redesign Plan

#### `/` Landing Page *(Major Rebuild)*
Adopt reference design structure with live data integration:
1. **Hero** — Dark navy bg + gold headline accent + sky CTA button + decorative blob glows + right-side image (students at KNUST)
2. **Stats bar** — Animated counters: X students, Y skills, Z sessions completed
3. **How It Works** — 3 steps with icon squares on `sky-100` bg
4. **Featured Skills** — Horizontal scroll on mobile, 3-col grid on desktop. Pull from live DB or curated list.
5. **Testimonials** — 3 quote cards from real or sample students
6. **Final CTA** — Gold button, navy bg
7. **Footer** — Dark navy gradient, columns: Quick Links / Platform / Connect

#### `/login` + `/register` — Auth Pages *(Polish)*
- Replace card-centered layout with split-panel: left navy hero panel + right form
- Add KNUST-branded illustration or campus hero image on left
- Floating label inputs
- Primary CTA: gold pill button

#### `/dashboard` *(Visual Elevation)*
- Replace bare gray-50 bg with warm `navy-50` tinted surface
- Stats cards: larger, with sparkline micro-charts (Framer Motion)
- XP progress bar (currently unused)
- "Continue where you left off" session card
- Activity feed replacing pending requests card

#### `/search` *(Redesign to Card Grid)*
- Horizontal scrollable filter pills (not dropdowns)
- Profile cards: larger, image-first layout
- "Match quality" percentage indicator per result

#### `/matches` *(Visual Upgrade)*
- Mutual match cards get gold border + "🔥 Perfect Match" label
- Score shown as visual match meter instead of raw points

#### `/sessions` *(Timeline View)*
- Upcoming sessions: timeline/calendar mini-view
- Session card: richer with peer avatar, skill icon color-coded by category

#### `/messages` *(Cosmetic Polish Only)*
- Already feature-complete — only visual token update needed
- Apply new color tokens to bubbles, reactions, status indicators

#### `/profile` + `/profile/[userId]` *(Visual Elevation)*
- Hero banner behind avatar (abstract gradient or KNUST image)
- XP level bar with tier name (Beginner → Scholar → Expert → Master)
- Skills as pill grid (not badge list)
- Stats row: Sessions / Rating / Faculty / Mode

---

## PART 5 — IMPLEMENTATION PHASES

### Phase 1 — Design Foundation (globals.css + tokens)
- Replace all CSS custom properties with new palette
- Add Plus Jakarta Sans + JetBrains Mono fonts
- Update Tailwind theme config
- New shadow scale, radius scale, animation tokens

### Phase 2 — Component Library Upgrade
- Button: all variants + loading states + pill/rounded modes
- Input: floating label + all states
- Card: all variants + hover animation
- Badge/Tag: semantic variants
- Avatar: status ring + size scale
- Empty state component
- Bottom navigation bar (mobile)

### Phase 3 — Landing Page Rebuild
- Full reference design landing architecture
- 7 sections as specified above
- Responsive (mobile-first)

### Phase 4 — Auth Pages Redesign
- Split-panel layout
- Floating labels
- Brand illustration

### Phase 5 — App Page Polish
- Dashboard, Search, Matches, Sessions visual upgrades
- Navigation: bottom bar on mobile
- XP bar integration on dashboard + profile

### Phase 6 — Messages + Profile Polish
- Token replacement only (no logic changes)
- Profile hero banner
- XP tier system UI

---

## PART 6 — WCAG AA COMPLIANCE CHECKLIST

- Navy-800 on white: contrast ratio ~11:1 ✅
- Gold-500 on white: contrast ratio ~3.5:1 (fail for text) — only use for large text/icons ⚠️
- Gold-800 on gold-50: contrast ratio ~8:1 ✅ (use for text on tinted surfaces)
- White on Navy-800: contrast ratio ~11:1 ✅
- White on Gold-500: contrast ratio ~3.5:1 — ⚠️ use semibold/large only
- Sky-700 on white: contrast ratio ~5.1:1 ✅
- Success-600 on white: contrast ratio ~4.9:1 ✅
- Danger-600 on white: contrast ratio ~5.2:1 ✅

**Rule:** Never use gold-500 for body text on white. Use gold-700/800 for text. Reserve gold-500 for backgrounds, icons, and large display elements only.

---

*Spec written by: Cascade AI + ui-ux-pro-max skill*  
*Awaiting user approval before Phase 1 implementation begins.*
