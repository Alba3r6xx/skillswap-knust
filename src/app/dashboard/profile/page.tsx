export default function ProfilePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-6">My Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center text-white text-xl font-bold">
            KA
          </div>
          <div>
            <h2 className="text-lg font-semibold text-navy-800">Kwame Asante</h2>
            <p className="text-sm text-gray-500">kwame.asante@st.knust.edu.gh</p>
            <p className="text-xs text-gray-400 mt-0.5">Computer Science • Level 300</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-navy-800 mb-3">Skills I Can Teach</h3>
            <div className="flex flex-wrap gap-2">
              {['Python', 'Web Development', 'Data Analysis', 'Git & GitHub'].map((s) => (
                <span key={s} className="px-3 py-1.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy-800 mb-3">Skills I Want to Learn</h3>
            <div className="flex flex-wrap gap-2">
              {['UI/UX Design', 'Mobile Development', 'Photography'].map((s) => (
                <span key={s} className="px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy-800 mb-4">About Me</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Level 300 Computer Science student passionate about Python and web technologies.
          Looking to exchange programming knowledge for creative skills like design and photography.
          Available for in-person sessions on campus or virtual meetings.
        </p>
      </div>
    </main>
  );
}
