"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Repeat2,
  ArrowRight,
  GraduationCap,
  Users,
  Calendar,
  Star,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  Zap,
  Trophy,
  BookOpen,
  Code2,
  Shapes,
  Languages,
  FlaskConical,
  Music,
} from "lucide-react";
import Link from "next/link";
import { AnimatedCounter } from "@/components/animated-counter";

const STEPS = [
  {
    step: "01",
    title: "Create your profile",
    description: "List the skills you can teach — Python, AutoCAD, French, Statistics, anything. Then add what you want to learn.",
    icon: GraduationCap,
  },
  {
    step: "02",
    title: "Get matched instantly",
    description: "Our algorithm pairs you with the best-fit peers from across all KNUST faculties based on skills and availability.",
    icon: Users,
  },
  {
    step: "03",
    title: "Book and swap",
    description: "Schedule an online or in-person session, complete it, rate each other, and earn XP towards your next tier.",
    icon: Calendar,
  },
];

const SKILL_CATEGORIES = [
  { icon: Code2,       label: "Engineering & Tech",   skills: ["Python", "AutoCAD", "MATLAB", "SolidWorks"],  color: "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:text-sky-400" },
  { icon: FlaskConical,label: "Sciences",              skills: ["Organic Chemistry", "Statistics", "Physics"], color: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { icon: Languages,   label: "Languages",             skills: ["French", "Twi", "Arabic", "Hausa"],           color: "bg-gold-50 text-gold-700 border-gold-100 dark:bg-gold-500/10 dark:text-gold-400" },
  { icon: Shapes,      label: "Design & Architecture", skills: ["Revit", "SketchUp", "Illustrator", "Figma"], color: "bg-navy-50 text-navy-700 border-navy-100 dark:bg-navy-500/10 dark:text-navy-300" },
  { icon: BookOpen,    label: "Business & Finance",    skills: ["Accounting", "Excel", "Financial Modelling"], color: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400" },
  { icon: Music,       label: "Arts & Humanities",     skills: ["Music Theory", "Public Speaking", "Writing"], color: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400" },
];

const TESTIMONIALS = [
  {
    name: "Abena Mensah",
    faculty: "Computer Science, L3",
    quote: "I taught Python and learned AutoCAD in exchange. SkillSwap saved me two semesters of struggling with engineering drawings.",
    rating: 5,
    initials: "AM",
  },
  {
    name: "Kwame Asante",
    faculty: "Civil Engineering, L4",
    quote: "Found a CS student who helped me with MATLAB for my final year project. Returned the favour with structural analysis tutorials.",
    rating: 5,
    initials: "KA",
  },
  {
    name: "Esi Ofori",
    faculty: "Business Administration, L2",
    quote: "Swapped Accounting lessons for French conversation practice. We meet twice a week — both of us are flying in our courses now.",
    rating: 5,
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
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        {/* Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.769 0.188 70)" }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-4xl px-4 py-24 md:py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-navy-700 bg-navy-800/60 px-4 py-1.5 text-xs text-navy-200 mb-8 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Exclusively for KNUST students
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
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

        {/* Scroll hint */}
        <div className="flex justify-center pb-8">
          <ChevronDown className="h-5 w-5 text-navy-600 animate-bounce" aria-hidden />
        </div>
      </section>

      {/* ── SECTION 2: STATS BAR ── */}
      <section className="bg-navy-950 border-y border-navy-800 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: 1200, suffix: "+", label: "Students registered" },
              { value: 340, suffix: "+", label: "Skill categories" },
              { value: 4800, suffix: "+", label: "Sessions completed" },
              { value: 4.8, suffix: "", label: "Average rating", decimals: 1 },
            ].map(({ value, suffix, label, decimals }) => (
              <div key={label}>
                <p className="text-3xl font-black text-white font-display">
                  <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
                </p>
                <p className="text-xs text-navy-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS ── */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-black text-navy-900 dark:text-foreground tracking-tight">
              Three steps to your first swap
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="relative group">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-navy-900 flex items-center justify-center text-primary
                      group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-muted-foreground/60 tracking-widest">{step}</span>
                    <h3 className="text-base font-bold text-navy-900 dark:text-foreground mt-0.5 mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: SKILL CATEGORIES ── */}
      <section className="py-20 bg-navy-50 dark:bg-navy-950/50">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">What you can swap</p>
            <h2 className="text-3xl md:text-4xl font-black text-navy-900 dark:text-foreground tracking-tight">
              Skills across every faculty
            </h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-lg mx-auto">
              From Python to Pianoforte — if you know it, someone at KNUST wants to learn it.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILL_CATEGORIES.map(({ icon: Icon, label, skills, color }) => (
              <div
                key={label}
                className={`rounded-xl border p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${color}`}
              >
                <Icon className="h-6 w-6 mb-3 opacity-80" />
                <h3 className="font-bold text-sm mb-2">{label}</h3>
                <div className="flex flex-wrap gap-1">
                  {skills.map((s) => (
                    <span key={s} className="text-[11px] bg-white/60 dark:bg-white/10 rounded px-1.5 py-0.5 font-medium">
                      {s}
                    </span>
                  ))}
                  <span className="text-[11px] opacity-60 self-center">+ more</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: TESTIMONIALS ── */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">Student stories</p>
            <h2 className="text-3xl md:text-4xl font-black text-navy-900 dark:text-foreground tracking-tight">
              Real swaps. Real growth.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, faculty, quote, rating, initials }) => (
              <div
                key={name}
                className="rounded-xl border bg-card p-6
                  shadow-[0_1px_3px_oklch(0_0_0/0.07)]
                  hover:shadow-[0_4px_16px_oklch(0_0_0/0.08)]
                  hover:-translate-y-0.5 transition-all duration-150"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-gold-500 fill-gold-500" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">{faculty}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: FAQ ── */}
      <section className="py-20 bg-navy-50 dark:bg-navy-950/50">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-black text-navy-900 dark:text-foreground tracking-tight">
              Questions you&apos;re probably thinking
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-xl border bg-card p-5">
                <p className="font-semibold text-sm text-navy-900 dark:text-foreground mb-2 flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {q}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: FINAL CTA ── */}
      <section className="py-24 bg-navy-900 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Your next skill is one<br />swap away
          </h2>
          <p className="text-navy-300 text-base mb-10 max-w-md mx-auto leading-relaxed">
            Join over 1,200 KNUST students already teaching and learning from each other.
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
