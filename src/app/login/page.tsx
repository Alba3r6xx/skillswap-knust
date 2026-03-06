import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-16 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy-800">Welcome Back</h1>
            <p className="mt-2 text-sm text-gray-500">Log in to your SkillSwap account</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" className="rounded border-gray-300" />
                Remember me
              </label>
              <a href="#" className="text-sm text-sky-500 font-medium hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-navy-800 text-white font-semibold text-sm hover:bg-navy-700 transition-colors"
            >
              Log In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-sky-500 font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
