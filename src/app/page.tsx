"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Repeat2 } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Create Your Profile",
    desc: "Sign up with your KNUST email. Add what you can teach and what you want to learn — takes two minutes.",
    icon: (
      <svg className="w-6 h-6 text-navy-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    step: "2",
    title: "Find Your Match",
    desc: "We match you with students who teach what you need and need what you teach. Filter by faculty, skill, or availability.",
    icon: (
      <svg className="w-6 h-6 text-navy-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: "3",
    title: "Swap & Grow",
    desc: "Book a session — on campus or online. Teach, learn, rate each other, and earn XP along the way.",
    icon: (
      <svg className="w-6 h-6 text-navy-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
];

const FEATURED_SKILLS = [
  {
    title: "Introduction to Python",
    category: "Programming",
    instructor: "Kwame A.",
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop",
    rating: 4.8,
  },
  {
    title: "AutoCAD for Engineers",
    category: "Engineering",
    instructor: "Kofi M.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop",
    rating: 4.9,
  },
  {
    title: "French Conversation",
    category: "Languages",
    instructor: "Ama K.",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250&fit=crop",
    rating: 4.7,
  },
  {
    title: "Financial Modelling",
    category: "Business",
    instructor: "Abena S.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    rating: 4.6,
  },
  {
    title: "UI/UX Design Basics",
    category: "Design",
    instructor: "Yaw B.",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop",
    rating: 4.8,
  },
  {
    title: "Statistics & Probability",
    category: "Sciences",
    instructor: "Efua N.",
    image: "https://images.unsplash.com/photo-1532094349884-543559244b88?w=400&h=250&fit=crop",
    rating: 4.5,
  },
];

const TESTIMONIALS = [
  {
    name: "Abena Mensah",
    faculty: "Computer Science, Level 3",
    quote: "Taught Python, learned AutoCAD in return. SkillSwap saved me two semesters of struggling with engineering drawings.",
    initials: "AM",
  },
  {
    name: "Kwame Asante",
    faculty: "Civil Engineering, Level 4",
    quote: "A CS student helped me with MATLAB for my final year project. I returned the favour with structural analysis tutorials.",
    initials: "KA",
  },
  {
    name: "Esi Ofori",
    faculty: "Business Administration, Level 2",
    quote: "Swapped Accounting help for French conversation practice. We meet twice a week now — both of us are levelling up.",
    initials: "EO",
  },
];

const FAQ = [
  {
    q: "Is it actually free?",
    a: "100%. No money changes hands — you teach a skill, you learn a skill. That's the whole deal.",
  },
  {
    q: "Do I need a KNUST email?",
    a: "Yes — we keep it within the KNUST community for now. Any @st.knust.edu.gh or @knust.edu.gh email works.",
  },
  {
    q: "Online or in-person?",
    a: "Your call. Meet at the library, hop on a video call, or mix both — whatever works for you and your partner.",
  },
  {
    q: "How does matching work?",
    a: "We look at what you teach and want to learn, then surface people who complement you. The better your profile, the better your matches.",
  },
  {
    q: "What if a session doesn't go well?",
    a: "Rate honestly after every session. Ratings help surface the best peers and keep quality high for everyone.",
  },
];

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const scrollRef = useReveal();

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, user, router]);

  if (isLoading) return null;
  if (user) return null;

  return (
    <div ref={scrollRef} className="min-h-screen min-h-dvh bg-white overflow-x-hidden" style={{ colorScheme: 'light' }}>

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-navy-900/95 backdrop-blur-sm" style={{ paddingTop: 'var(--sat, 0px)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500">
              <Repeat2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">
              Skill<span className="text-sky-400">Swap</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:brightness-110 transition-all"
            >
              Join free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-navy-800 overflow-hidden" style={{ paddingTop: 'calc(3.5rem + var(--sat, 0px))' }}>
        {/* Background image — plain img for reliable loading */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
            loading="eager"
          />
          <div className="absolute inset-0 bg-navy-900/85" />
        </div>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight animate-slide-up">
              Teach what you know.<br />
              <span className="text-primary">Learn what you need.</span>
            </h1>

            <p className="mt-5 text-lg text-white/70 leading-relaxed max-w-lg animate-slide-up" style={{ animationDelay: '100ms' }}>
              KNUST&apos;s peer-to-peer skill exchange. Find a student who teaches what you&apos;re missing — and teach them something back. Zero cost, real results.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link
                href="/register"
                className="tap-scale inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/25"
              >
                Get started — it&apos;s free
              </Link>
              <Link
                href="/login"
                className="tap-scale inline-flex items-center justify-center px-7 py-3.5 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-4 sm:gap-x-8 gap-y-3 text-sm text-white/50 animate-slide-up" style={{ animationDelay: '300ms' }}>
              {["No money involved — just knowledge", "Meet on campus or online", "Rated & reviewed peers"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-8 sm:h-14" preserveAspectRatio="none">
            <path d="M0 56h1440V28c-240 28-480 0-720 14S240 0 0 28v28z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-900">Three steps. That&apos;s it.</h2>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">
              From sign-up to your first session in under five minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto reveal-stagger">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center reveal">
                <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED SKILLS ── */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-900">Popular right now</h2>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">
              Skills KNUST students are actively teaching and learning.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stagger">
            {FEATURED_SKILLS.map((skill) => (
              <div
                key={skill.title}
                className="reveal bg-white rounded-2xl overflow-hidden border border-gray-200 hover-lift group"
              >
                <div className="relative h-36 sm:h-44 overflow-hidden">
                  <img
                    src={skill.image}
                    alt={skill.title}
                    className="absolute inset-0 w-full h-full object-cover img-zoom"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-sky-500 text-white text-xs font-semibold rounded-full">
                    {skill.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-navy-900 mb-3">{skill.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-navy-800 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {skill.instructor[0]}
                      </div>
                      <span className="text-sm text-gray-500">{skill.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                      <span className="text-sm text-gray-500 font-medium">{skill.rating}</span>
                    </div>
                  </div>
                  <Link
                    href="/register"
                    className="tap-scale mt-4 block w-full text-center py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-110 transition-all"
                  >
                    Request Swap
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 reveal">
            <Link
              href="/register"
              className="tap-scale inline-flex items-center px-6 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/25"
            >
              Browse all skills →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-900">Real students, real swaps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto reveal-stagger">
            {TESTIMONIALS.map(({ name, faculty, quote, initials }) => (
              <div
                key={name}
                className="reveal bg-gray-50 rounded-2xl p-6 border border-gray-200 hover-lift"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-400">{faculty}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">&ldquo;{quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20 bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Got questions?</h2>
            <p className="mt-3 text-navy-300 max-w-md mx-auto">
              Everything you need to know before your first swap.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {FAQ.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl bg-navy-800/60 border border-navy-700/60 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-white font-medium text-sm hover:bg-navy-800/80 transition-colors">
                  {q}
                  <svg
                    className="h-5 w-5 text-navy-400 shrink-0 transition-transform group-open:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-navy-300 leading-relaxed">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900">
            Your next skill is one swap away
          </h2>
          <p className="mt-4 text-gray-500 max-w-md mx-auto leading-relaxed">
            Hundreds of KNUST students are already teaching and learning from each other. Jump in — no cost, no catch.
          </p>
          <Link
            href="/register"
            className="tap-scale inline-flex items-center mt-8 px-8 py-3.5 rounded-full bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/25"
          >
            Join now — it&apos;s free
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-navy-950 border-t border-navy-800/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
              <Repeat2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">
              Skill<span className="text-sky-400">Swap</span> KNUST
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
