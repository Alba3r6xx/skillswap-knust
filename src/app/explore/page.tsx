'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CATEGORIES = ['All', 'Programming', 'Design', 'Marketing', 'Data Science', 'Languages', 'Music', 'Photography'];

const ALL_SKILLS = [
  { title: 'Introduction to Python', category: 'Programming', instructor: 'Kwame A.', image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop', rating: 4.8, level: 'Beginner' },
  { title: 'UI/UX Design Basics', category: 'Design', instructor: 'Ama K.', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop', rating: 4.9, level: 'Beginner' },
  { title: 'Web Development', category: 'Programming', instructor: 'Yaw M.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop', rating: 4.7, level: 'Intermediate' },
  { title: 'Digital Marketing', category: 'Marketing', instructor: 'Abena S.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop', rating: 4.6, level: 'Beginner' },
  { title: 'Graphic Design', category: 'Design', instructor: 'Kofi B.', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=250&fit=crop', rating: 4.8, level: 'Intermediate' },
  { title: 'Data Analysis', category: 'Data Science', instructor: 'Efua N.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop', rating: 4.5, level: 'Intermediate' },
  { title: 'French for Beginners', category: 'Languages', instructor: 'Marie D.', image: 'https://images.unsplash.com/photo-1549737328-8b9f3252b927?w=400&h=250&fit=crop', rating: 4.7, level: 'Beginner' },
  { title: 'Mobile App Development', category: 'Programming', instructor: 'Nana K.', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop', rating: 4.6, level: 'Advanced' },
  { title: 'Photography Basics', category: 'Photography', instructor: 'Adjoa P.', image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=250&fit=crop', rating: 4.9, level: 'Beginner' },
  { title: 'Machine Learning', category: 'Data Science', instructor: 'Samuel O.', image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop', rating: 4.4, level: 'Advanced' },
  { title: 'Guitar Lessons', category: 'Music', instructor: 'Prince T.', image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=250&fit=crop', rating: 4.8, level: 'Beginner' },
  { title: 'Advanced CSS & Animations', category: 'Programming', instructor: 'Felicia A.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop', rating: 4.7, level: 'Advanced' },
];

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = ALL_SKILLS.filter((s) => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.instructor.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-navy-800 py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Explore Skills</h1>
            <p className="mt-3 text-white/60 max-w-md mx-auto">
              Browse skills offered by students and find your perfect learning match.
            </p>

            {/* Search */}
            <div className="mt-8 max-w-lg mx-auto relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search skills or instructors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>
        </section>

        {/* Filters + Grid */}
        <section className="py-10 sm:py-14 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-8 -mx-4 px-4 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-navy-800 text-white'
                      : 'bg-white border border-gray-200 text-gray-500 hover:border-navy-800 hover:text-navy-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Skills grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No skills found. Try a different filter.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((skill) => (
                  <div
                    key={skill.title}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={skill.image}
                        alt={skill.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 bg-sky-500 text-white text-xs font-semibold rounded-full">
                        {skill.category}
                      </span>
                      <span className="absolute top-3 right-3 px-3 py-1 bg-white/90 text-navy-800 text-xs font-semibold rounded-full">
                        {skill.level}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-navy-800 text-sm mb-2">{skill.title}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-navy-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                            {skill.instructor[0]}
                          </div>
                          <span className="text-xs text-gray-500">{skill.instructor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                          <span className="text-xs text-gray-500 font-medium">{skill.rating}</span>
                        </div>
                      </div>
                      <button className="w-full py-2.5 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors">
                        Request Swap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
