"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Repeat2, Eye, EyeOff, Sun, Moon, BookOpen, Zap, Trophy } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { z } from "zod";

const KNUST_DOMAINS = ["@st.knust.edu.gh", "@knust.edu.gh"];

const loginSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address")
    .refine(
      (e) => KNUST_DOMAINS.some((d) => e.endsWith(d)),
      { message: "Must be a KNUST email (@st.knust.edu.gh or @knust.edu.gh)" }
    ),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { signIn, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, user, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const errs: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validation.error.issues.forEach((issue: any) => {
        if (issue.path?.[0]) errs[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    if (result.success) {
      toast.success("Welcome back!");
      router.push("/dashboard");
    } else {
      setError(result.error || "Login failed.");
      toast.error("Login failed", { description: result.error });
    }
    setLoading(false);
  };

  if (authLoading) return null;

  return (
    <div className="min-h-dvh flex">
      {/* ── LEFT PANEL (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-navy-900 flex-col justify-between p-10 relative overflow-hidden shrink-0">
        {/* dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize: "28px 28px" }}
          aria-hidden
        />
        {/* gold glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: "oklch(0.769 0.188 70)" }} aria-hidden />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Repeat2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Skill<span className="text-primary">Swap</span>
          </span>
        </div>

        {/* Middle copy */}
        <div className="relative space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Welcome back to<br />your skill network
            </h2>
            <p className="text-navy-300 text-sm leading-relaxed">
              Your sessions and matches are waiting.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              { icon: BookOpen, text: "Pick up where you left off" },
              { icon: Zap,      text: "See who matched with you" },
              { icon: Trophy,   text: "Check your XP and badges" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-navy-300">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-navy-800 shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "1,200+", label: "Students" },
              { value: "4,800+", label: "Sessions" },
              { value: "4.8★",   label: "Avg rating" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-xl bg-navy-800/60 border border-navy-700/60 px-3 py-2.5 text-center">
                <p className="text-base font-bold text-white">{value}</p>
                <p className="text-[11px] text-navy-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-navy-500">
          New to SkillSwap?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">Create a free account</Link>
        </p>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex-1 flex flex-col bg-background overflow-y-auto">
        {/* Top bar — desktop only row */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 shrink-0">
          <Link href="/" className="flex items-center gap-2 invisible">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Repeat2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Skill<span className="text-primary">Swap</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-muted-foreground">New to SkillSwap?</span>
            <Link href="/register">
              <Button variant="outline" size="sm">Create account</Button>
            </Link>
            {mounted && (
              <Button variant="ghost" size="icon" className="h-9 w-9"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile hero — immersive navy section matching desktop quality */}
        <div className="lg:hidden relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
          {/* Decorative texture + glow */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} aria-hidden />
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-[0.08]" style={{ background: "oklch(0.769 0.188 70)" }} aria-hidden />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full blur-3xl opacity-[0.06]" style={{ background: "oklch(0.68 0.104 232)" }} aria-hidden />

          <div className="relative px-5 pb-8" style={{ paddingTop: 'max(1.25rem, var(--sat, 0px))' }}>
            {/* Top row: logo + actions */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Repeat2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white tracking-tight">
                  Skill<span className="text-primary">Swap</span>
                </span>
              </Link>
              <div className="flex items-center gap-2">
                {mounted && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-navy-300 hover:text-white hover:bg-navy-800"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  </Button>
                )}
                <Link href="/register">
                  <Button size="sm" variant="outline" className="h-8 text-xs border-navy-600 text-navy-200 hover:bg-navy-800 hover:text-white bg-transparent">
                    Create account
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero copy */}
            <div className="animate-slide-up">
              <h2 className="text-xl font-bold text-white leading-tight mb-1.5">Welcome back to your skill network</h2>
              <p className="text-sm text-navy-300 leading-relaxed">Your sessions, matches, and messages are waiting.</p>
            </div>

            {/* Stats strip */}
            <div className="flex gap-2.5 mt-4 animate-scale-fade">
              {[
                { value: "1,200+", label: "Students" },
                { value: "4,800+", label: "Sessions" },
                { value: "4.8★",   label: "Avg rating" },
              ].map(({ value, label }) => (
                <div key={label} className="flex-1 rounded-xl bg-navy-800/60 border border-navy-700/50 px-2.5 py-2 text-center">
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="text-[10px] text-navy-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Wave transition */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 32" fill="none" preserveAspectRatio="none" aria-hidden>
            <path d="M0 32h1440V16c-240 10-480 16-720 12S240 10 0 16v16z" className="fill-background" />
          </svg>
        </div>

        {/* Form body */}
        <div className="flex-1 flex items-center justify-center px-6 py-6 lg:py-8">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:mb-8">
              <h1 className="text-2xl font-bold text-navy-900 dark:text-foreground mb-1">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in with your KNUST student email</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">KNUST Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@st.knust.edu.gh"
                  value={email}
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
                />
                {fieldErrors.email
                  ? <p className="text-xs text-red-500">{fieldErrors.email}</p>
                  : <p className="text-xs text-muted-foreground">@st.knust.edu.gh or @knust.edu.gh</p>
                }
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <span className="text-xs text-primary cursor-pointer hover:underline">Forgot password?</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    autoComplete="current-password"
                    aria-invalid={!!fieldErrors.password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
              </div>

              <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
                Sign in
              </Button>
            </form>

            {/* Mobile switch link */}
            <p className="text-center text-sm text-muted-foreground mt-6 lg:hidden">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
