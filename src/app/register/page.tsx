"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Repeat2, Eye, EyeOff, Sun, Moon, CheckCircle2, GraduationCap, Users, Star } from "lucide-react";
import { FACULTIES } from "@/lib/types";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { z } from "zod";

const KNUST_DOMAINS = ["@st.knust.edu.gh", "@knust.edu.gh"];

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Enter a valid email address")
    .refine(
      (e) => KNUST_DOMAINS.some((d) => e.endsWith(d)),
      { message: "Must be a KNUST email (@st.knust.edu.gh or @knust.edu.gh)" }
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  faculty: z.string().min(1, "Please select your faculty"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function getPasswordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 10) score++;
  const levels = [
    { score: 0, label: "", color: "" },
    { score: 1, label: "Weak",   color: "bg-red-500" },
    { score: 2, label: "Fair",   color: "bg-gold-500" },
    { score: 3, label: "Strong", color: "bg-emerald-500" },
  ] as const;
  return levels[score as 0 | 1 | 2 | 3];
}

export default function RegisterPage() {
  const { signUp, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, user, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [faculty, setFaculty] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const validation = registerSchema.safeParse({ name, email, password, confirmPassword, faculty });
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
    const result = await signUp({ name, email, password, faculty });
    if (result.success) {
      toast.success("Account created!", { description: "Welcome to SkillSwap KNUST!" });
      router.push("/onboarding");
    } else {
      setError(result.error || "Registration failed.");
      toast.error("Registration failed", { description: result.error });
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
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-10"
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
              The smartest way<br />to learn at KNUST
            </h2>
            <p className="text-navy-300 text-sm leading-relaxed">
              Trade skills with fellow students. No money, no middleman — just knowledge flowing across every faculty.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              { icon: GraduationCap, text: "Teach what you know, learn what you need" },
              { icon: Users,         text: "Matched by skill, faculty & availability" },
              { icon: Star,          text: "Rated sessions build your academic reputation" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-navy-300">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-navy-800 shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          {/* Testimonial */}
          <blockquote className="rounded-xl bg-navy-800/60 border border-navy-700/60 p-4">
            <p className="text-sm text-navy-200 italic leading-relaxed">
              &ldquo;I taught Python and got AutoCAD in return. SkillSwap saved my FYP.&rdquo;
            </p>
            <footer className="mt-2 text-xs text-navy-400 font-medium">— Abena M., CS Level 3</footer>
          </blockquote>
        </div>

        {/* Footer stat */}
        <p className="relative text-xs text-navy-500">
          <span className="text-primary font-semibold">1,200+</span> students already swapping
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
            <span className="text-xs text-muted-foreground">Already have an account?</span>
            <Link href="/login">
              <Button variant="outline" size="sm">Sign in</Button>
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
                <Link href="/login">
                  <Button size="sm" variant="outline" className="h-8 text-xs border-navy-600 text-navy-200 hover:bg-navy-800 hover:text-white bg-transparent">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero copy */}
            <div className="animate-slide-up">
              <h2 className="text-xl font-bold text-white leading-tight mb-1.5">The smartest way to learn at KNUST</h2>
              <p className="text-sm text-navy-300 leading-relaxed">Trade skills with fellow students. No money, no middleman — just knowledge.</p>
            </div>

            {/* Testimonial */}
            <blockquote className="mt-4 rounded-xl bg-navy-800/60 border border-navy-700/50 p-3.5 animate-scale-fade">
              <p className="text-xs text-navy-200 italic leading-relaxed">
                &ldquo;I taught Python and got AutoCAD in return. SkillSwap saved my FYP.&rdquo;
              </p>
              <footer className="mt-1.5 text-[10px] text-navy-400 font-medium">— Abena M., CS Level 3</footer>
            </blockquote>
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
              <h1 className="text-2xl font-bold text-navy-900 dark:text-foreground mb-1">Create your account</h1>
              <p className="text-sm text-muted-foreground">Use your KNUST student email to join</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  {error}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Kwame Asante"
                  value={name}
                  autoComplete="name"
                  aria-invalid={!!fieldErrors.name}
                  onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
                />
                {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
              </div>

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
                  : <p className="text-xs text-muted-foreground">@st.knust.edu.gh or @knust.edu.gh only</p>
                }
              </div>

              {/* Faculty */}
              <div className="space-y-1.5">
                <Label htmlFor="faculty" className="text-sm font-medium">Faculty</Label>
                <Select value={faculty} onValueChange={(v) => { setFaculty(v); setFieldErrors((p) => ({ ...p, faculty: "" })); }}>
                  <SelectTrigger aria-invalid={!!fieldErrors.faculty}>
                    <SelectValue placeholder="Select your faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACULTIES.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.faculty && <p className="text-xs text-red-500">{fieldErrors.faculty}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    autoComplete="new-password"
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
                {/* Strength meter */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                            i <= strength.score ? strength.color : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className={`text-xs font-medium ${
                        strength.score === 1 ? "text-red-500" :
                        strength.score === 2 ? "text-gold-600" : "text-emerald-600"
                      }`}>{strength.label}</p>
                    )}
                  </div>
                )}
                {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    aria-invalid={!!fieldErrors.confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: "" })); }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {confirmPassword && password && confirmPassword === password && (
                    <CheckCircle2 className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {fieldErrors.confirmPassword && <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
                Create account
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-1">
                By joining you agree to our{" "}
                <span className="underline underline-offset-2 cursor-pointer hover:text-foreground">terms of use</span>
              </p>
            </form>

            {/* Mobile switch link */}
            <p className="text-center text-sm text-muted-foreground mt-6 lg:hidden">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
