"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Repeat2,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    step: "01",
    title: "Create your profile",
    description: "List the skills you can teach — Python, AutoCAD, French, Statistics, anything. Then add what you want to learn.",
  },
  {
    step: "02",
    title: "Find a skill match",
    description: "Browse students across all KNUST faculties. Filter by skill, faculty, and availability to find the right fit.",
  },
  {
    step: "03",
    title: "Book and swap",
    description: "Schedule an online or in-person session, show up, and rate each other afterward. That's it.",
  },
];

const SKILL_CATEGORIES = [
  {
    label: "Engineering & Tech",
    skills: ["Python", "AutoCAD", "MATLAB", "SolidWorks"],
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop",
  },
  {
    label: "Sciences",
    skills: ["Organic Chemistry", "Statistics", "Physics"],
    image: "https://images.unsplash.com/photo-1532094349884-543559244b88?w=400&h=250&fit=crop",
  },
  {
    label: "Languages",
    skills: ["French", "Twi", "Arabic", "Hausa"],
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250&fit=crop",
  },
  {
    label: "Design & Architecture",
    skills: ["Revit", "SketchUp", "Illustrator", "Figma"],
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop",
  },
  {
    label: "Business & Finance",
    skills: ["Accounting", "Excel", "Financial Modelling"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
  },
  {
    label: "Arts & Humanities",
    skills: ["Music Theory", "Public Speaking", "Writing"],
    image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=250&fit=crop",
  },
];

const TESTIMONIALS = [
  {
    name: "Abena Mensah",
    faculty: "Computer Science, L3",
    quote: "I taught Python and learned AutoCAD in exchange. SkillSwap saved me two semesters of struggling with engineering drawings.",
    initials: "AM",
  },
  {
    name: "Kwame Asante",
    faculty: "Civil Engineering, L4",
    quote: "Found a CS student who helped me with MATLAB for my final year project. Returned the favour with structural analysis tutorials.",
    initials: "KA",
  },
  {
    name: "Esi Ofori",
    faculty: "Business Administration, L2",
    quote: "Swapped Accounting lessons for French conversation practice. We meet twice a week — both of us are flying in our courses now.",
    initials: "EO",
  },
];

const FAQS = [
  {
    q: "Is SkillSwap free to use?",
    a: "Yes — completely free for all KNUST students. No hidden fees, no premium tiers. The whole point is peer-to-peer value exchange.",
  },
  {
    q: "What if someone doesn't show up to a session?",
    a: "You can cancel any pending session with one tap. After a session, both parties rate each other — persistent no-shows get flagged and ranked lower in searches.",
  },
  {
    q: "Can I teach and learn multiple skills?",
    a: "Absolutely. Add as many skills as you want on both sides. The more you list, the better your matches.",
  },
  {
    q: "Do I need to be an expert to teach?",
    a: "No. You just need to be meaningfully ahead of the person learning. A level-3 student can absolutely teach a level-1 student — that's the point.",
  },
];

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, user, router]);

  if (isLoading) return null;
  if (user) return null;

  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-navy-800/60 bg-navy-900/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
              <Repeat2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">
              Skill<span className="text-primary">Swap</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-navy-200 hover:text-white hover:bg-navy-800 text-xs h-9">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-xs h-9">
                Join free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: HERO ── */}
      <section className="relative bg-navy-900 text-white overflow-hidden pt-14">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" aria-hidden />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" aria-hidden />

        <div className="relative mx-auto max-w-4xl px-4 py-24 md:py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-navy-700 bg-navy-800/60 px-4 py-1.5 text-xs text-navy-200 mb-8 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Exclusively for KNUST students
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Teach what you know.<br />
            <span className="text-primary">Learn what you need.</span>
          </h1>

          <p className="text-lg text-navy-300 max-w-xl mx-auto mb-10 leading-relaxed">
            SkillSwap connects KNUST students in a peer-to-peer skill exchange network.
            Trade expertise, book sessions, and grow across every faculty.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto gap-2 px-8 text-base">
                Start swapping — it&apos;s free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto text-navy-200 hover:text-white hover:bg-navy-800 text-base">
                I already have an account
              </Button>
            </Link>
          </div>

          {/* Trust line */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-navy-400">
            {[
              "No money exchanged — just knowledge",
              "Online & offline sessions",
              "Rated & reviewed peers",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: HOW IT WORKS ── */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 dark:text-foreground tracking-tight">
              Three steps to your first swap
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, description }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-sky-100 dark:bg-sky-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-navy-800 dark:text-sky-400">{step}</span>
                </div>
                <h3 className="text-base font-semibold text-navy-900 dark:text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: SKILL CATEGORIES ── */}
      <section className="py-20 bg-navy-50 dark:bg-navy-950/50">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 dark:text-foreground tracking-tight">
              Skills across every faculty
            </h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-lg mx-auto">
              From Python to Pianoforte — if you know it, someone at KNUST wants to learn it.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SKILL_CATEGORIES.map(({ label, skills, image }) => (
              <div
                key={label}
                className="bg-white dark:bg-card rounded-2xl overflow-hidden border border-gray-200 dark:border-border hover:shadow-lg transition-shadow group"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={image}
                    alt={label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-navy-900/80 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                    {label}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 rounded px-2 py-0.5 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground/60 self-center">+ more</span>
                  </div>
                  <Link
                    href="/register"
                    className="mt-4 block w-full text-center py-2.5 rounded-lg bg-navy-800 dark:bg-navy-700 text-white text-sm font-semibold hover:bg-navy-700 dark:hover:bg-navy-600 transition-colors"
                  >
                    Find a swap partner
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/register"
              className="inline-flex items-center px-6 py-3 rounded-full border-2 border-navy-800 dark:border-navy-600 text-navy-800 dark:text-navy-200 font-semibold text-sm hover:bg-navy-800 hover:text-white dark:hover:bg-navy-700 transition-colors"
            >
              See all skills on the platform →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: TESTIMONIALS ── */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 dark:text-foreground tracking-tight">
              What students say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, faculty, quote, initials }) => (
              <div
                key={name}
                className="bg-gray-50 dark:bg-card rounded-2xl p-6 border border-gray-200 dark:border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900 dark:text-foreground text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">{faculty}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: FAQ ── */}
      <section className="py-20 bg-navy-50 dark:bg-navy-950/50">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 dark:text-foreground tracking-tight">
              Common questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map(({ q, a }, i) => (
              <div key={q} className="rounded-xl border bg-card p-5">
                <p className="font-semibold text-sm text-navy-900 dark:text-foreground mb-2 flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {q}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed pl-7">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: FINAL CTA ── */}
      <section className="py-24 bg-navy-900 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to learn something new?
          </h2>
          <p className="text-navy-300 text-base mb-10 max-w-md mx-auto leading-relaxed">
            Join KNUST students already teaching and learning from each other.
            No cost. No commitment. Just knowledge.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto gap-2 px-10 text-base">
                Create your free account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto text-navy-200 hover:text-white hover:bg-navy-800 text-base">
                <MessageSquare className="h-4 w-4 mr-2" />
                Browse skills first
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-navy-950 border-t border-navy-800 py-8">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white">
              <Repeat2 className="h-3 w-3" />
            </div>
            <span className="text-xs font-bold text-white">
              Skill<span className="text-primary">Swap</span> KNUST
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-navy-500">
            <Link href="/login" className="hover:text-navy-300 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-navy-300 transition-colors">Register</Link>
            <span>© {new Date().getFullYear()} SkillSwap KNUST</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
