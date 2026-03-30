"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/data";
import { Skill, SKILL_CATEGORIES, DAYS_OF_WEEK } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle2,
  Sparkles,
  X,
  Plus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const PRESET_TEACH = [
  "Python", "JavaScript", "Web Design", "Data Analysis", "Excel",
  "Photography", "Video Editing", "Graphic Design", "Public Speaking",
  "Mathematics", "AutoCAD", "MATLAB", "Research Writing", "Music",
  "Statistics", "French", "Accounting", "Physics", "Drawing",
];

const PRESET_LEARN = [
  "Programming", "UI/UX Design", "Machine Learning", "Data Science",
  "3D Modeling", "Financial Modeling", "Entrepreneurship", "Mobile Dev",
  "Game Design", "Animation", "Marketing", "Project Management",
  "Networking", "Business Writing", "Arduino", "Blender", "SQL",
];

const STEPS = [
  { id: 1, label: "Welcome" },
  { id: 2, label: "Teach" },
  { id: 3, label: "Learn" },
  { id: 4, label: "Schedule" },
  { id: 5, label: "Done" },
];

export default function OnboardingPage() {
  const { user, isLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 2 state
  const [teachSkills, setTeachSkills] = useState<Skill[]>([]);
  const [teachInput, setTeachInput] = useState("");

  // Step 3 state
  const [learnSkills, setLearnSkills] = useState<Skill[]>([]);
  const [learnInput, setLearnInput] = useState("");

  // Step 4 state
  const [availability, setAvailability] = useState<string[]>([]);
  const [preferredMode, setPreferredMode] = useState<"online" | "offline" | "both">("online");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  // Pre-fill from existing profile data
  useEffect(() => {
    if (user) {
      setTeachSkills(user.skills_to_teach || []);
      setLearnSkills(user.skills_to_learn || []);
      setAvailability(user.availability || []);
      setPreferredMode((user.preferred_mode as "online" | "offline" | "both") || "online");
    }
  }, [user]);

  const addTeachSkill = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (teachSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    setTeachSkills((prev) => [...prev, { name: trimmed, level: "intermediate", category: "Other" }]);
    setTeachInput("");
  }, [teachSkills]);

  const addLearnSkill = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (learnSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    setLearnSkills((prev) => [...prev, { name: trimmed, level: "beginner", category: "Other" }]);
    setLearnInput("");
  }, [learnSkills]);

  const toggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleNext = async () => {
    if (step === 4) {
      // Save everything before final step
      setSaving(true);
      if (user) {
        await updateProfile(user.id, {
          skills_to_teach: teachSkills,
          skills_to_learn: learnSkills,
          availability,
          preferred_mode: preferredMode,
        });
        await refreshProfile();
      }
      setSaving(false);
    }
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleSkip = () => {
    if (step === 4 && user) {
      // Save whatever was filled so far
      updateProfile(user.id, {
        skills_to_teach: teachSkills,
        skills_to_learn: learnSkills,
        availability,
        preferred_mode: preferredMode,
      }).then(() => refreshProfile());
    }
    router.push("/dashboard");
    toast("Profile incomplete — finish it anytime from Settings", {
      description: "Complete your profile to get better matches",
      duration: 6000,
    });
  };

  const handleFinish = () => {
    toast.success("You're ready to swap skills! 🎉");
    router.push("/dashboard");
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "there";
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header progress */}
      <div className="w-full bg-white dark:bg-card border-b px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm">SkillSwap</span>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Step {step} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {step < 5 && (
          <button
            onClick={handleSkip}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              s.id === step
                ? "w-6 bg-primary"
                : s.id < step
                ? "w-2 bg-primary/40"
                : "w-2 bg-border"
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          {/* ── STEP 1: Welcome ── */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="text-6xl">👋</div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome, {firstName}!</h1>
                <p className="text-muted-foreground text-base leading-relaxed">
                  You're joining <strong>{Math.floor(Math.random() * 300) + 700}+ KNUST students</strong> already
                  trading skills. Let's set you up in under 60 seconds.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 my-8">
                {[
                  { icon: "🎓", label: "Teach skills", sub: "Share what you know" },
                  { icon: "📘", label: "Learn skills", sub: "Find expert peers" },
                  { icon: "🤝", label: "Book sessions", sub: "Schedule instantly" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-white dark:bg-card border p-4 text-center shadow-sm">
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <p className="text-xs font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={handleNext}
              >
                Let's go <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* ── STEP 2: Teach ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-500/20 mb-4">
                  <GraduationCap className="h-7 w-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">What can you teach?</h1>
                <p className="text-sm text-muted-foreground">Share your expertise — even basics help!</p>
              </div>

              {/* Selected */}
              {teachSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {teachSkills.map((s) => (
                    <Badge
                      key={s.name}
                      className="bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400 gap-1.5 py-1 px-3 rounded-full"
                    >
                      {s.name}
                      <button onClick={() => setTeachSkills((prev) => prev.filter((sk) => sk.name !== s.name))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Custom input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type a skill name..."
                  value={teachInput}
                  onChange={(e) => setTeachInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTeachSkill(teachInput); } }}
                  className="rounded-full"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full shrink-0"
                  onClick={() => addTeachSkill(teachInput)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Preset suggestions */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Quick add</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TEACH.filter((s) => !teachSkills.some((t) => t.name === s)).slice(0, 12).map((s) => (
                    <button
                      key={s}
                      onClick={() => addTeachSkill(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-dashed border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleNext}
                  disabled={teachSkills.length === 0}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {teachSkills.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">Select at least 1 skill to continue</p>
              )}
            </div>
          )}

          {/* ── STEP 3: Learn ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20 mb-4">
                  <BookOpen className="h-7 w-7 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">What do you want to learn?</h1>
                <p className="text-sm text-muted-foreground">We'll match you with peers who can teach you.</p>
              </div>

              {learnSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {learnSkills.map((s) => (
                    <Badge
                      key={s.name}
                      className="bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 gap-1.5 py-1 px-3 rounded-full"
                    >
                      {s.name}
                      <button onClick={() => setLearnSkills((prev) => prev.filter((sk) => sk.name !== s.name))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Type a skill name..."
                  value={learnInput}
                  onChange={(e) => setLearnInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLearnSkill(learnInput); } }}
                  className="rounded-full"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full shrink-0"
                  onClick={() => addLearnSkill(learnInput)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Quick add</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_LEARN.filter((s) => !learnSkills.some((l) => l.name === s)).slice(0, 12).map((s) => (
                    <button
                      key={s}
                      onClick={() => addLearnSkill(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-dashed border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleNext}
                  disabled={learnSkills.length === 0}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {learnSkills.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">Select at least 1 skill to continue</p>
              )}
            </div>
          )}

          {/* ── STEP 4: Schedule ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 dark:bg-gold-500/20 mb-4">
                  <Calendar className="h-7 w-7 text-gold-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">When are you free?</h1>
                <p className="text-sm text-muted-foreground">Helps peers schedule sessions with you.</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Available days</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150",
                        availability.includes(day)
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-background dark:bg-card border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Preferred mode</p>
                <div className="flex gap-3">
                  {(["online", "offline", "both"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPreferredMode(mode)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-medium border transition-all duration-150 capitalize",
                        preferredMode === mode
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-background dark:bg-card border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {mode === "online" ? "💻 Online" : mode === "offline" ? "📍 In Person" : "🔄 Both"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleNext}
                  disabled={saving}
                >
                  {saving ? "Saving..." : <>Finish setup <Sparkles className="h-4 w-4" /></>}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Done ── */}
          {step === 5 && (
            <div className="text-center space-y-6">
              <div className="text-6xl animate-bounce">🎉</div>
              <div>
                <h1 className="text-3xl font-bold mb-2">You're all set, {firstName}!</h1>
                <p className="text-muted-foreground">
                  Your profile is live. Peers can already find and book you.
                </p>
              </div>

              <div className="bg-white dark:bg-card rounded-2xl border p-6 text-left space-y-3">
                <p className="text-sm font-semibold">Your profile summary</p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{teachSkills.length} skill{teachSkills.length !== 1 ? "s" : ""} to teach</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{learnSkills.length} skill{learnSkills.length !== 1 ? "s" : ""} to learn</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{availability.length > 0 ? `${availability.length} days available` : "Availability not set"}</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">You earned <strong className="text-primary">+100 XP</strong> for completing setup! 🚀</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleFinish}
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => router.push("/search")}
                >
                  Find peers to swap with
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
