import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PRINCIPLES = [
  { icon: '🤝', title: 'Peer-to-Peer', desc: 'Learn directly from fellow students who understand your challenges.' },
  { icon: '🆓', title: 'Completely Free', desc: 'No fees, no subscriptions. Just exchange skills with each other.' },
  { icon: '🎯', title: 'Skill-Focused', desc: 'Practical, hands-on learning tailored to real-world needs.' },
  { icon: '🌍', title: 'Community-Driven', desc: 'Built by students, for students, fostering a culture of sharing.' },
];

const WHY_CHOOSE = [
  { title: 'Verified Students', desc: 'Only KNUST students can join, ensuring a trusted community.', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  )},
  { title: 'Flexible Scheduling', desc: 'Arrange sessions at times that work for both parties.', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  )},
  { title: 'Wide Variety', desc: 'From coding to cooking, music to marketing — find any skill.', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
  )},
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative bg-navy-800 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700" />
          <div className="hidden lg:block absolute right-0 top-0 w-[45%] h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-navy-800 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop"
              alt="Students learning together"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                What Brought
                <br />
                <span className="text-sky-400">About This Idea?</span>
              </h1>
              <p className="mt-5 text-lg text-white/70 leading-relaxed">
                Many students at KNUST have incredible skills but no platform to share or learn from peers. SkillSwap bridges that gap.
              </p>
            </div>
          </div>
        </section>

        {/* Problem Identified */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-navy-800 mb-4">Problem Identified</h2>
                <p className="text-gray-500 leading-relaxed mb-4">
                  Students often struggle to find affordable, accessible ways to learn new skills outside their curriculum. Traditional tutoring is expensive, and online courses can feel impersonal.
                </p>
                <p className="text-gray-500 leading-relaxed">
                  Meanwhile, many students possess valuable skills they&apos;d love to share — but lack a structured way to connect with those who need them. This disconnect inspired SkillSwap.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 bg-sky-100 rounded-3xl flex items-center justify-center">
                    <span className="text-8xl">❓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SkillSwap Mission */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center order-2 lg:order-1">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=400&fit=crop"
                  alt="Team collaboration"
                  className="rounded-2xl shadow-lg"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-full bg-navy-800 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                      <path d="M17 8C17 10.76 14.76 13 12 13C9.24 13 7 10.76 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M7 16C7 13.24 9.24 11 12 11C14.76 11 17 13.24 17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold text-navy-800">SkillSwap</span>
                </div>
                <p className="text-gray-500 leading-relaxed">
                  SkillSwap is a peer-to-peer learning platform designed specifically for KNUST students. Our mission is to create a collaborative community where every student can teach what they know and learn what they need — for free.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-navy-800 text-center mb-12">Our Core Principles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="text-center p-6 rounded-2xl border border-gray-200 hover:shadow-md transition-shadow">
                  <span className="text-4xl block mb-3">{p.icon}</span>
                  <h3 className="font-semibold text-navy-800 mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-500">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose SkillSwap */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-navy-800 text-center mb-12">Why Choose SkillSwap?</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {WHY_CHOOSE.map((item) => (
                <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-navy-800">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-navy-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
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
              Join the SkillSwap community and start exchanging knowledge today.
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
