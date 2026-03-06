'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PROCESS_STEPS = [
  {
    step: 1,
    title: 'Create Your Profile',
    desc: 'Sign up with your KNUST email and build your profile. List the skills you can teach and the ones you want to learn.',
    color: 'bg-sky-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    step: 2,
    title: 'Browse & Find Matches',
    desc: 'Explore the skill directory and find students who offer what you need. Use filters and search to narrow down your options.',
    color: 'bg-orange-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: 'Send a Swap Request',
    desc: 'Found someone interesting? Send them a swap request explaining what you\'d like to learn and what you can teach in return.',
    color: 'bg-emerald-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    step: 4,
    title: 'Schedule Your Sessions',
    desc: 'Once both parties agree, use the built-in messaging to schedule your learning sessions at convenient times.',
    color: 'bg-blue-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    step: 5,
    title: 'Learn & Teach',
    desc: 'Meet up (in person or virtually), exchange knowledge, and grow your skills together. Leave reviews when done.',
    color: 'bg-violet-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    step: 6,
    title: 'Rate & Review',
    desc: 'After your session, rate and review your experience. Help others find the best skill partners.',
    color: 'bg-rose-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

const FAQS = [
  { q: 'Is SkillSwap free to use?', a: 'Yes, SkillSwap is completely free. There are no subscription fees or hidden charges. You simply exchange skills with other students.' },
  { q: 'Do I need to be a KNUST student?', a: 'Currently, SkillSwap is exclusively for KNUST students. You\'ll need a valid KNUST email address to sign up and verify your account.' },
  { q: 'What kinds of skills can I share?', a: 'Anything! From academic subjects like math and programming to creative skills like music, design, photography, and even cooking or fitness training.' },
  { q: 'How do I find a skill match?', a: 'Use the Explore Skills page to browse available skills, filter by category, and search for specific topics. You can then send a swap request to any student whose skills interest you.' },
  { q: 'What if I don\'t have a skill to offer?', a: 'Everyone has something to share! Think about your hobbies, academic strengths, or life experiences. You can also offer study help, language practice, or organizational skills.' },
  { q: 'Can I swap with multiple people?', a: 'Absolutely! You can have multiple active swaps running at the same time with different students for different skills.' },
];

export default function GuidePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-navy-800 py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">How SkillSwap Works</h1>
            <p className="mt-3 text-white/60 max-w-md mx-auto">
              A complete guide to getting started with peer-to-peer skill exchange.
            </p>
          </div>
        </section>

        {/* The Complete Process */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-navy-800 text-center mb-14">The Complete Process</h2>

            <div className="space-y-0">
              {PROCESS_STEPS.map((step, i) => (
                <div key={step.step} className="relative flex gap-6">
                  {/* Timeline line */}
                  {i < PROCESS_STEPS.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-[calc(100%-12px)] bg-gray-200" />
                  )}

                  {/* Circle */}
                  <div className={`relative z-10 w-12 h-12 ${step.color} rounded-full flex items-center justify-center shrink-0 shadow-lg`}>
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="pb-12">
                    <h3 className="text-lg font-semibold text-navy-800 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-navy-800 text-center mb-12">Frequently Asked Questions</h2>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-navy-800 pr-4">{faq.q}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800">Ready to Learn Something New?</h2>
            <p className="mt-4 text-gray-500 max-w-md mx-auto">
              Join the SkillSwap community and start your learning journey today.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center mt-8 px-8 py-3.5 rounded-full bg-navy-800 text-white font-semibold text-sm hover:bg-navy-700 transition-colors"
            >
              Join Now
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
