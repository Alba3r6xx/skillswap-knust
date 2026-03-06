export default function MessagesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-2">Messages</h1>
      <p className="text-gray-500 mb-8">Chat with your swap partners.</p>

      <div className="space-y-2">
        {[
          { name: 'Ama K.', msg: 'Hey! When are we meeting for the design session?', time: '10m ago', unread: true },
          { name: 'Yaw M.', msg: 'Great session yesterday! Thanks for the help.', time: '2h ago', unread: false },
          { name: 'Efua N.', msg: 'I sent you the dataset for the practice exercise.', time: '1d ago', unread: false },
        ].map((chat) => (
          <div key={chat.name} className={`bg-white rounded-xl border p-4 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow ${chat.unread ? 'border-sky-200 bg-sky-50/30' : 'border-gray-200'}`}>
            <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
              {chat.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-navy-800 text-sm">{chat.name}</p>
                <span className="text-xs text-gray-400">{chat.time}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">{chat.msg}</p>
            </div>
            {chat.unread && <div className="w-2.5 h-2.5 bg-sky-500 rounded-full shrink-0" />}
          </div>
        ))}
      </div>
    </main>
  );
}
