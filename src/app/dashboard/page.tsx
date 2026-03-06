import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-6">Welcome back, Kwame!</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Swaps', value: '3', color: 'bg-sky-100 text-sky-600' },
          { label: 'Skills Listed', value: '5', color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Completed Sessions', value: '12', color: 'bg-violet-50 text-violet-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-navy-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { text: 'Ama K. accepted your swap request for UI/UX Design', time: '2 hours ago' },
            { text: 'You completed a Python session with Yaw M.', time: '1 day ago' },
            { text: 'New swap request from Efua N. for Data Analysis', time: '2 days ago' },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="w-2 h-2 bg-sky-500 rounded-full mt-2 shrink-0" />
              <div>
                <p className="text-sm text-gray-700">{a.text}</p>
                <p className="text-xs text-gray-400 mt-1">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Link
          href="/dashboard/explore"
          className="bg-navy-800 text-white rounded-xl p-6 hover:bg-navy-700 transition-colors"
        >
          <h3 className="font-semibold mb-1">Find New Skills</h3>
          <p className="text-sm text-white/60">Browse available skills and send swap requests.</p>
        </Link>
        <Link
          href="/dashboard/profile"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-navy-800 mb-1">Update Your Profile</h3>
          <p className="text-sm text-gray-500">Add new skills or update your availability.</p>
        </Link>
      </div>
    </main>
  );
}
