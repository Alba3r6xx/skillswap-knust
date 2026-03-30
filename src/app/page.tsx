"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Repeat2 } from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Create Your Profile",
    desc: "Sign up with your KNUST email. List the skills you can teach — and the ones you want to learn.",
    icon: (
      <svg className="w-6 h-6 text-navy-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    step: "2",
    title: "Find a Skill Match",
    desc: "Browse students across every KNUST faculty. Filter by skill, mode, and availability to find your match.",
    icon: (
      <svg className="w-6 h-6 text-navy-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: "3",
    title: "Book & Start Swapping",
    desc: "Schedule a session online or on campus. Show up, teach, learn, and rate each other afterward.",
    icon: (
      <svg className="w-6 h-6 text-navy-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
    quote: "I taught Python and learned AutoCAD in exchange. SkillSwap saved me two semesters of struggling with engineering drawings.",
    initials: "AM",
  },
  {
    name: "Kwame Asante",
    faculty: "Civil Engineering, Level 4",
    quote: "Found a CS student who helped me with MATLAB for my final year project. Returned the favour with structural analysis tutorials.",
    initials: "KA",
  },
  {
    name: "Esi Ofori",
    faculty: "Business Administration, Level 2",
    quote: "Swapped Accounting lessons for French conversation practice. We meet twice a week — both of us are flying now.",
    initials: "EO",
  },
];

const FAQ = [
  {
    q: "Is SkillSwap really free?",
    a: "Yes. No money changes hands — you teach a skill, you learn a skill. That's the whole deal.",
  },
  {
    q: "Do I need to be a KNUST student?",
    a: "Yes. You need a valid @st.knust.edu.gh or @knust.edu.gh email to sign up.",
  },
  {
    q: "Can I do sessions online or in-person?",
    a: "Both. You and your partner choose whatever works — campus meet-up, video call, or a mix.",
  },
  {
    q: "How does matching work?",
    a: "We look at what you teach and what you want to learn, then find students who complement you.",
  },
  {
    q: "What if a session doesn't go well?",
    a: "You rate every session. The system uses those ratings to surface the best peers and filter out the rest.",
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
    <div className="min-h-dvh bg-white overflow-x-hidden">

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-navy-900/95 backdrop-blur-sm">
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
              className="inline-flex items-center px-5 py-2 rounded-full bg-sky-500 text-white text-sm font-semibold hover:bg-sky-400 transition-colors"
            >
              Join free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-navy-800 overflow-hidden pt-14">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700" />
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white/80 mb-8 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Exclusively for KNUST students
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Exchange Skills,<br />
              <span className="text-sky-400">Grow Together.</span>
            </h1>

            <p className="mt-5 text-lg text-white/70 leading-relaxed max-w-lg">
              Connect with fellow KNUST students to teach what you know and learn what you need. Free, peer-to-peer skill exchange.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center px-7 py-3.5 rounded-full bg-sky-500 text-white font-semibold text-sm hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/25"
              >
                Start swapping — it&apos;s free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-7 py-3.5 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/50">
              {["No money exchanged — just knowledge", "Online & offline sessions", "Rated & reviewed peers"].map((t) => (
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

        {/* Right-side image — desktop only */}
        <div className="hidden lg:block absolute right-0 top-0 w-[45%] h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-navy-800 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
            alt="KNUST students collaborating"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800">How It Works</h2>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">
              Get started in three simple steps and begin your learning journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-navy-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED SKILLS ── */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800">Featured Skills</h2>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">
              Discover skills offered by students across KNUST.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_SKILLS.map((skill) => (
              <div
                key={skill.title}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={skill.image}
                    alt={skill.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-sky-500 text-white text-xs font-semibold rounded-full">
                    {skill.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-navy-800 mb-3">{skill.title}</h3>
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
                    className="mt-4 block w-full text-center py-2.5 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors"
                  >
                    Request Swap
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/register"
              className="inline-flex items-center px-6 py-3 rounded-full border-2 border-navy-800 text-navy-800 font-semibold text-sm hover:bg-navy-800 hover:text-white transition-colors"
            >
              View All Skills →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800">What Students Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map(({ name, faculty, quote, initials }) => (
              <div
                key={name}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-800 text-sm">{name}</p>
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
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Frequently Asked Questions</h2>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-800">
            Ready to Learn Something New?
          </h2>
          <p className="mt-4 text-gray-500 max-w-md mx-auto leading-relaxed">
            Join KNUST students already teaching and learning from each other. No cost. No commitment. Just knowledge.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center mt-8 px-8 py-3.5 rounded-full bg-navy-800 text-white font-semibold text-sm hover:bg-navy-700 transition-colors shadow-lg shadow-navy-800/25"
          >
            Join Now — It&apos;s Free
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
