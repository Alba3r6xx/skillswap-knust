import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-16 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy-800">Create Your Account</h1>
            <p className="mt-2 text-sm text-gray-500">Join the SkillSwap community at KNUST</p>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <input
                  type="text"
                  placeholder="Kwame"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <input
                  type="text"
                  placeholder="Asante"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">KNUST Email</label>
              <input
                type="email"
                placeholder="name@st.knust.edu.gh"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-navy-800 text-white font-semibold text-sm hover:bg-navy-700 transition-colors"
            >
              Sign Up
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-sky-500 font-medium hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
