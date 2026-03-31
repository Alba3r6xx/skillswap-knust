# SkillSwap KNUST — Product Brief

**Version:** 1.0  
**Last Updated:** March 31, 2026  
**Platform:** Web (Next.js 16.1.6, React 19, Progressive Web App)

---

## Executive Summary

**SkillSwap KNUST** is a peer-to-peer skill exchange platform designed exclusively for KNUST students. It enables students to teach what they know and learn what they need — without money changing hands. The platform matches students by complementary skills, faculty, and availability, then facilitates session booking, real-time messaging, and gamified reputation tracking.

**Core Value Proposition:**  
*"Your next skill is one swap away."*

Students gain access to knowledge across all faculties, build academic reputation through XP and badges, and participate in a zero-cost learning economy powered by reciprocity.

---

## Current Capabilities

### 1. **Authentication & Onboarding**
- **Supabase Auth** — Email/password authentication with secure session management
- **60-second onboarding flow** — 5-step wizard:
  1. Welcome screen with value props
  2. Add skills to teach (custom input + preset suggestions)
  3. Add skills to learn
  4. Set weekly availability (time slots)
  5. Upload profile photo + write bio
- **Profile completion tracking** — Users earn XP for completing profile sections (name, bio, avatar, faculty, skills, availability)

### 2. **Skill Matching Engine**
- **Three match types:**
  - **Mutual** — Both users can teach each other (highest priority, gold badge)
  - **Can Teach You** — Peer has a skill you want to learn
  - **Can Learn From You** — Peer wants to learn a skill you teach
- **Match scoring algorithm** — Considers:
  - Skill overlap (teach ↔ learn alignment)
  - Faculty proximity (same faculty = bonus)
  - Availability overlap (shared time slots)
  - Rating and reputation
- **Real-time match updates** — Matches refresh when users update their skills or availability
- **Tabbed match view** — Filter by All / Mutual / Can Teach / Can Learn

### 3. **Search & Discovery**
- **Advanced filters:**
  - Faculty (8 faculties: Engineering, Science, Business, etc.)
  - Skills (multi-select from user's learning list)
  - Availability (time slot matching)
  - Rating threshold (e.g., 4+ stars)
- **Smart sorting:**
  - Best Match (default — uses match score)
  - Highest Rated
  - Most Active (by session count)
- **Live search** — Instant results as filters change
- **Empty states** — Contextual prompts when no results (e.g., "Expand your filters")

### 4. **Session Management**
- **Session lifecycle:**
  1. **Request** — Learner requests a session with a teacher for a specific skill, date, time, location
  2. **Pending** — Teacher receives notification, can accept/decline
  3. **Accepted** — Both users confirmed, session locked in calendar
  4. **Completed** — After session date, both rate each other (1–5 stars + optional review)
  5. **Cancelled** — Either party can cancel (tracked for reputation)
- **Session views:**
  - **Upcoming** — Accepted sessions with countdown timers
  - **Pending** — Incoming/outgoing requests awaiting response
  - **Past** — Completed sessions with ratings
  - **Cancelled** — Archived cancelled sessions
- **Session details:**
  - Skill being taught
  - Teacher/Learner profiles (linked)
  - Date, time, duration, location
  - Status badges (Pending, Accepted, Completed)
  - Rating + review (post-completion)

### 5. **Real-Time Messaging**
- **1-on-1 DMs** — Text, voice notes, images, documents
- **Message features:**
  - **Read receipts** — Single check (sent), double check (delivered), blue double check (read)
  - **Typing indicators** — Real-time "typing..." broadcast via Supabase Realtime
  - **Voice messages** — Record audio with live waveform visualization, playback with seek
  - **Image sharing** — Upload photos with lightbox preview
  - **Document sharing** — PDF/DOCX attachments with download
  - **Reply/Quote** — Swipe-to-reply gesture on mobile
  - **Message reactions** — Quick emoji reactions (👍❤️😂😮😢🙏)
  - **Edit/Delete** — Edit sent messages (marked "edited"), delete for self or both
  - **Pin messages** — Pin important messages to top of chat
  - **Forward** — Forward messages to other conversations
  - **Search** — Full-text search across all messages
- **Group chats** — Create groups, add members, group messages (separate from DMs)
- **Conversation list:**
  - Last message preview
  - Unread count badges
  - Timestamp
  - **Snap-style streak rings** — Gradient rings around avatars show consecutive weekly swap streaks with each peer (gold → orange → red as streak grows)
- **Mobile optimizations:**
  - Swipe-back gesture to close chat
  - iOS keyboard compatibility (native `<textarea>` instead of shadcn Input)
  - Safe-area insets for notch handling

### 6. **Gamification & Reputation**
- **XP System:**
  - Session completed: +50 XP
  - Session taught: +75 XP
  - Profile completed: +100 XP
  - Rating given: +10 XP
  - First session: +200 XP (bonus)
  - Streak bonus: +25 XP/week
  - Message sent: +5 XP
  - Review given: +30 XP
- **XP Tiers** (6 levels):
  - 🌱 **Newcomer** (0–99 XP)
  - 📘 **Learner** (100–299 XP)
  - 🎓 **Scholar** (300–599 XP)
  - ⚡ **Expert** (600–999 XP)
  - 🏆 **Master** (1000–1999 XP)
  - 👑 **Champion** (2000+ XP)
- **XP Bar UI:**
  - Circular SVG progress ring (GPU-accelerated)
  - Tier emoji in center
  - Inline XP badge
  - "X XP to next tier" subtitle
- **Swap Streak:**
  - Tracks consecutive weeks with at least 1 completed session
  - Visual flame indicator (gray → orange → red as streak grows)
  - Flame dot progress bar (up to 7 dots)
  - "On fire" badge at 3+ weeks
  - **Per-peer streaks** — Snap-style gradient rings on message avatars show weekly swap streaks with individual peers
- **Achievement Badges** (14 total):
  - 🎯 **First Swap** — Complete your first session (Common)
  - ✅ **Verified Pro** — 100% profile complete (Rare)
  - 🖐️ **High Five** — Complete 5 sessions (Common)
  - 🏆 **Dedicated** — Complete 10 sessions (Rare)
  - 👑 **Legend** — Complete 25 sessions (Epic)
  - 📚 **Great Teacher** — Teach 3+ sessions (Common)
  - 🎓 **Top Tutor** — Teach 10+ sessions (Rare)
  - 🧠 **Quick Learner** — Learn from 3+ sessions (Common)
  - 🔄 **On a Roll** — 2-week swap streak (Common)
  - 🔥 **On Fire** — 4-week swap streak (Rare)
  - ⚡ **Unstoppable** — 8-week swap streak (Epic)
  - ⭐ **Top Rated** — 4.5+ stars with 5+ ratings (Epic)
  - 💎 **Perfect Score** — Perfect 5.0 rating × 10 reviews (Legendary)
- **Rating System:**
  - 1–5 stars per session
  - Average rating displayed on profile
  - Total ratings count
  - Star icon on dashboard stat card

### 7. **Dashboard**
- **Hero banner** — Navy gradient with wave SVG, greeting ("Good morning, {name}"), subtitle ("Here's what's happening this week")
- **4 stat cards** (GPU-accelerated hover animations):
  - **Teaching** — Count of skills you teach (emerald)
  - **Learning** — Count of skills you want to learn (sky blue)
  - **Swaps Done** — Completed sessions count (gold)
  - **Rating** — Average star rating (purple)
- **XP + Streak row** — Side-by-side XP bar and streak card
- **Weekly Activity Chart** — 7-day bar chart showing sessions per day (Sun–Sat)
- **Upcoming Sessions** — Next 3 upcoming sessions with countdown timers
- **Recent Matches** — Top 4 mutual matches with "View all" link
- **Recent Messages** — Last 3 conversations with unread badges
- **Achievements** — Earned badges with rarity styling (common/rare/epic/legendary)
- **Quick Actions** — 4-icon grid (Find Peers, Messages, Matches, Profile) with badges

### 8. **Profile Pages**
- **Own profile:**
  - Edit mode toggle
  - Avatar upload (Supabase Storage)
  - Bio editor
  - Faculty selector
  - Skills to teach (add/remove tags)
  - Skills to learn (add/remove tags)
  - Availability grid (7 days × 4 time slots)
  - XP bar + tier badge
  - Achievement showcase
  - Session history
- **Peer profiles:**
  - View-only mode
  - "Request Session" CTA
  - "Send Message" CTA
  - Match score badge (if matched)
  - Skills they teach (highlighted if you want to learn)
  - Skills they want to learn (highlighted if you teach)
  - Availability overlap indicator
  - Rating + review count
  - Recent badges
  - Session count

### 9. **Notifications**
- **In-app notifications:**
  - New session request
  - Session accepted/declined
  - Session reminder (1 hour before)
  - New message
  - New match
  - Achievement unlocked
  - Streak milestone
- **Push notifications** (PWA):
  - VAPID web push for mobile/desktop
  - Notification permission prompt on first login
  - Background sync for offline support

### 10. **Performance & UX**
- **Image optimization:**
  - `next/image` with AVIF/WebP formats
  - Responsive `sizes` attributes
  - Lazy loading for below-fold images
  - Priority loading for hero/LCP images
- **GPU-accelerated animations:**
  - Scroll-reveal system (`useReveal` hook + IntersectionObserver)
  - `.reveal`, `.reveal-left`, `.reveal-scale` classes
  - Staggered entrance animations (80ms delays)
  - Micro-interactions (`.tap-scale`, `.hover-lift`, `.img-zoom`)
  - 120fps composited transforms (`translateZ(0)`, `will-change`)
- **Mobile-first design:**
  - Bottom navigation bar (5 items: Dashboard, Find, Matches, Sessions, Messages)
  - Safe-area insets for iPhone notch
  - Touch-optimized tap targets (min 44×44px)
  - Swipe gestures (swipe-to-reply, swipe-back)
- **Dark mode** — Full theme support via `next-themes`
- **Responsive layout:**
  - Mobile: single-column, bottom nav
  - Tablet: 2-column grids
  - Desktop: 3-column grids, max-width 1280px

### 11. **Tech Stack**
- **Frontend:** Next.js 16.1.6 (App Router, Turbopack), React 19, TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui components
- **Backend:** Supabase (Auth, Database, Storage, Realtime)
- **Database:** PostgreSQL (via Supabase)
- **Real-time:** Supabase Realtime (WebSockets)
- **Deployment:** Vercel (auto-deploy from `main` branch)
- **Icons:** Lucide React
- **Animations:** Framer Motion 12 (optional, not yet fully integrated)
- **Forms:** Zod validation
- **Toasts:** Sonner
- **Push:** web-push (VAPID)

---

## Suggestions for Improvement

### Short-Term (Next 2–4 weeks)

#### 1. **Session Scheduling UX**
- **Problem:** Current flow requires manual date/time/location input
- **Solution:**
  - **Calendar integration** — Visual calendar picker with availability overlay
  - **Smart time suggestions** — Auto-suggest times based on both users' availability overlap
  - **Location presets** — Dropdown of common campus locations (Library, Engineering Block, etc.) + custom input
  - **Recurring sessions** — Option to book weekly sessions (e.g., "Every Tuesday 2pm for 4 weeks")

#### 2. **Enhanced Matching Algorithm**
- **Problem:** Current scoring is basic (skill overlap + faculty + availability)
- **Solution:**
  - **Learning style compatibility** — Add profile field for learning preferences (visual, hands-on, theoretical) and match accordingly
  - **Skill level matching** — Tag skills with proficiency (Beginner, Intermediate, Advanced) so learners find appropriate teachers
  - **Mutual interest boost** — If both users have rated each other's profiles highly, boost match score
  - **Diversity bonus** — Slightly boost cross-faculty matches to encourage interdisciplinary learning

#### 3. **Session Preparation Tools**
- **Problem:** No pre-session coordination beyond messaging
- **Solution:**
  - **Session agenda** — Shared doc where teacher/learner can outline topics to cover
  - **Resource sharing** — Attach files/links to upcoming sessions (e.g., "Read this before we meet")
  - **Pre-session checklist** — Teacher can send prep tasks (e.g., "Install Python", "Bring your guitar")

#### 4. **Post-Session Feedback Loop**
- **Problem:** Ratings are binary (1–5 stars + optional text), no structured feedback
- **Solution:**
  - **Skill-specific ratings** — Rate teacher on "Clarity", "Patience", "Knowledge" separately
  - **Learning outcome tracking** — "Did you achieve your learning goal?" (Yes/Partial/No)
  - **Follow-up prompts** — "Want to book another session with {teacher}?" CTA after positive rating

#### 5. **Social Proof & Trust Signals**
- **Problem:** New users have no reputation, hard to get first session
- **Solution:**
  - **Verified skills** — Allow users to link external proof (GitHub for coding, YouTube for music, etc.)
  - **Endorsements** — Let peers endorse specific skills (LinkedIn-style)
  - **Session completion rate** — Show "95% session completion rate" on profiles
  - **Response time badge** — "Usually responds in <1 hour" indicator

#### 6. **Gamification Enhancements**
- **Current:** XP, tiers, badges, streaks
- **Add:**
  - **Leaderboards** — Weekly/monthly top teachers, learners, most active
  - **Challenges** — "Complete 3 sessions this week for bonus XP"
  - **Skill trees** — Visual progression map for learning paths (e.g., "Web Dev: HTML → CSS → JavaScript → React")
  - **Collectible badges** — Seasonal/event badges (e.g., "Exam Week Hero" for teaching during finals)

#### 7. **Mobile App (Native)**
- **Current:** PWA only
- **Solution:**
  - **React Native app** — Better push notifications, offline support, camera access
  - **Calendar sync** — Sync sessions to iOS/Android calendar
  - **Location services** — "Find peers near you" feature using campus map

### Medium-Term (2–6 months)

#### 8. **Video Sessions**
- **Problem:** All sessions are in-person, limits flexibility
- **Solution:**
  - **Integrated video calls** — WebRTC-based 1-on-1 video (Agora, Daily.co, or Whereby embed)
  - **Screen sharing** — Essential for coding/design sessions
  - **Session recording** — Optional recording for learner to review later (with consent)
  - **Hybrid sessions** — Tag sessions as "In-person", "Online", or "Hybrid"

#### 9. **Skill Verification & Certification**
- **Problem:** No way to prove you actually learned a skill
- **Solution:**
  - **Skill assessments** — Short quizzes/projects to validate learning
  - **Certificates** — Generate shareable certificates for completed learning paths
  - **Portfolio integration** — Link to projects built using learned skills
  - **Transcript export** — Download PDF of all completed sessions + skills learned

#### 10. **Community Features**
- **Problem:** Platform is purely transactional (1-on-1 swaps)
- **Solution:**
  - **Study groups** — Create groups for specific skills (e.g., "Python Study Group")
  - **Events** — Host workshops, hackathons, skill showcases
  - **Discussion forums** — Q&A boards for each skill category
  - **Mentorship programs** — Long-term mentor/mentee matching (beyond single sessions)

#### 11. **Analytics & Insights**
- **For users:**
  - **Learning dashboard** — "You've learned 5 skills this semester, spent 12 hours in sessions"
  - **Skill progress tracking** — Visual progress bars for each skill being learned
  - **Time investment** — "You've taught 20 hours, learned 15 hours — net contributor!"
- **For admins:**
  - **Platform metrics** — Active users, sessions/week, top skills, faculty engagement
  - **Churn analysis** — Identify users at risk of dropping off
  - **Skill demand heatmap** — Which skills are most requested but under-supplied

#### 12. **Monetization (Optional, Ethical)**
- **Current:** 100% free, no money
- **Potential:**
  - **Premium tier** — $5/month for:
    - Priority matching
    - Unlimited session requests (vs. 5/week free tier)
    - Advanced analytics
    - Profile customization (themes, badges)
  - **Institutional partnerships** — KNUST pays for platform, students use free
  - **Sponsored skills** — Companies sponsor skill categories (e.g., "AWS sponsors Cloud Computing sessions")

### Long-Term (6–12 months)

#### 13. **AI-Powered Features**
- **Smart matching** — ML model predicts best matches based on past session success rates
- **Session notes assistant** — Auto-generate session summaries from chat history
- **Skill recommendations** — "Based on your profile, you might enjoy learning {skill}"
- **Chatbot tutor** — AI assistant for quick questions between sessions

#### 14. **Cross-University Expansion**
- **Current:** KNUST-only
- **Future:**
  - **Multi-university network** — Expand to other Ghanaian universities (UG, Ashesi, etc.)
  - **Inter-university swaps** — KNUST student teaches UG student, vice versa
  - **University leaderboards** — Friendly competition between campuses

#### 15. **Skill Marketplace**
- **Problem:** Some skills are more valuable than others (e.g., coding vs. basic Excel)
- **Solution:**
  - **Skill credits** — High-demand skills earn more credits, can be redeemed for premium features
  - **Skill bundles** — Package related skills (e.g., "Full-Stack Web Dev" = HTML + CSS + JS + React)
  - **Skill auctions** — Bid credits to get sessions with top-rated teachers

#### 16. **Accessibility & Inclusion**
- **Screen reader support** — Full ARIA labels, keyboard navigation
- **Multi-language** — Support for local languages (Twi, Ga, Ewe)
- **Low-bandwidth mode** — Lite version for slow internet (text-only, no images)
- **Offline-first** — Service workers for full offline functionality

---

## Market Potential

### Target Audience
- **Primary:** KNUST students (20,000+ undergrads, 5,000+ postgrads)
- **Secondary:** Alumni (for mentorship), faculty (for skill validation)

### Competitive Landscape
- **Direct competitors:** None (no KNUST-specific skill exchange platform)
- **Indirect competitors:**
  - **Tutoring platforms** (Preply, Wyzant) — Paid, not peer-to-peer
  - **Study groups** (WhatsApp, Discord) — Unstructured, no matching
  - **LinkedIn Learning** — Passive video courses, no human interaction

### Unique Advantages
1. **Zero cost** — No money, pure reciprocity
2. **Hyper-local** — KNUST-only = trust, proximity, shared context
3. **Gamified** — XP, badges, streaks make learning addictive
4. **Real-time** — Instant matching, messaging, session booking
5. **Mobile-first** — Built for African mobile-first internet usage

### Growth Projections (Hypothetical)
- **Month 1:** 500 users (5% of target), 200 sessions
- **Month 3:** 2,000 users (20%), 1,000 sessions/month
- **Month 6:** 5,000 users (50%), 3,000 sessions/month
- **Year 1:** 10,000 users (100%), 10,000 sessions/month

### Revenue Potential (If Monetized)
- **Freemium model:**
  - 10% conversion to premium ($5/month) = 1,000 users × $5 = **$5,000/month**
- **Institutional licensing:**
  - KNUST pays $20,000/year for unlimited student access
- **Sponsored skills:**
  - 5 sponsors × $2,000/year = **$10,000/year**

**Total potential:** $70,000–$100,000/year (sustainable, not VC-scale)

---

## Strategic Recommendations

### Phase 1: Validation (Months 1–3)
1. **Launch MVP** — Current feature set is sufficient
2. **Onboard 500 early adopters** — Target high-influence students (class reps, club leaders)
3. **Measure core metrics:**
   - **Activation:** % of signups who complete onboarding
   - **Engagement:** Sessions/user/month
   - **Retention:** % of users active after 30 days
4. **Iterate based on feedback** — Weekly user interviews, in-app surveys

### Phase 2: Growth (Months 4–6)
1. **Referral program** — "Invite 3 friends, unlock premium features"
2. **Campus ambassadors** — Recruit 10 students to promote platform
3. **Partnerships** — Integrate with KNUST student portal, clubs, departments
4. **PR push** — Local media, student radio, social media campaigns

### Phase 3: Scale (Months 7–12)
1. **Feature expansion** — Video sessions, skill verification, analytics
2. **Mobile app launch** — Native iOS/Android apps
3. **Multi-university pilot** — Test expansion to 1–2 other universities
4. **Monetization experiments** — A/B test premium tier, measure willingness to pay

### Phase 4: Sustainability (Year 2+)
1. **Institutional partnerships** — Secure KNUST or government funding
2. **Cross-university network** — Expand to 5+ universities
3. **AI integration** — Smart matching, session assistants
4. **International expansion** — Pilot in other African countries (Kenya, Nigeria)

---

## Risk Assessment

### Technical Risks
- **Scalability:** Supabase free tier limits (500MB DB, 2GB bandwidth/month)
  - **Mitigation:** Upgrade to Pro tier ($25/month) at 1,000+ users
- **Real-time performance:** WebSocket connections may lag at scale
  - **Mitigation:** Optimize Realtime channels, consider Redis for caching
- **Data privacy:** Student data must be protected (GDPR-like compliance)
  - **Mitigation:** Encrypt sensitive data, clear privacy policy, user consent

### Market Risks
- **Low adoption:** Students may not see value in skill exchange
  - **Mitigation:** Strong onboarding, early wins (easy first sessions), social proof
- **Chicken-and-egg:** Need critical mass for matching to work
  - **Mitigation:** Seed platform with 100+ users before public launch
- **Competition:** Existing study groups may be "good enough"
  - **Mitigation:** Emphasize unique value (matching, gamification, reputation)

### Operational Risks
- **Moderation:** Inappropriate behavior, spam, fake profiles
  - **Mitigation:** Report/block features, manual review queue, community guidelines
- **Session quality:** Bad sessions hurt reputation
  - **Mitigation:** Rating system, teacher guidelines, dispute resolution process
- **Sustainability:** No revenue model = reliant on grants/donations
  - **Mitigation:** Explore ethical monetization (premium tier, institutional licensing)

---

## Conclusion

**SkillSwap KNUST** is a fully-functional, production-ready platform with strong technical foundations and clear product-market fit. The current feature set (matching, sessions, messaging, gamification) is sufficient for MVP launch.

**Key strengths:**
- Zero-cost peer learning model
- Gamified reputation system
- Real-time messaging with Snap-style streaks
- Mobile-optimized, GPU-accelerated UX
- KNUST-specific focus = trust + proximity

**Next steps:**
1. Launch to 500 early adopters
2. Measure engagement + retention
3. Iterate based on feedback
4. Scale to full KNUST student body
5. Expand to other universities

**Potential impact:**
- **10,000+ students** learning new skills for free
- **50,000+ sessions** per year
- **Cross-faculty collaboration** breaking down academic silos
- **Democratized education** — knowledge flows freely, not locked behind paywalls

This platform has the potential to transform how KNUST students learn, collaborate, and build skills — creating a self-sustaining knowledge economy powered by reciprocity, not money.
