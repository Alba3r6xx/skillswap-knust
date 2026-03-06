export default function SwapsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-2">My Swaps</h1>
      <p className="text-gray-500 mb-8">Track your active and completed skill swaps.</p>

      <div className="space-y-4">
        {[
          { partner: 'Ama K.', skill: 'UI/UX Design', status: 'Active', statusColor: 'bg-emerald-100 text-emerald-700' },
          { partner: 'Yaw M.', skill: 'Python Basics', status: 'Completed', statusColor: 'bg-gray-100 text-gray-500' },
          { partner: 'Efua N.', skill: 'Data Analysis', status: 'Pending', statusColor: 'bg-amber-100 text-amber-700' },
        ].map((swap) => (
          <div key={swap.partner} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {swap.partner[0]}
              </div>
              <div>
                <p className="font-medium text-navy-800">{swap.skill}</p>
                <p className="text-sm text-gray-500">with {swap.partner}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${swap.statusColor}`}>
              {swap.status}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
