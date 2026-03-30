"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { Skill, FACULTIES, SKILL_CATEGORIES, DAYS_OF_WEEK } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  BookOpen,
  Plus,
  X,
  Camera,
  User,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "profile" | "skills" | "availability";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",      label: "Profile",      icon: User },
  { id: "skills",       label: "Skills",        icon: GraduationCap },
  { id: "availability", label: "Availability",  icon: Calendar },
];

function useCompleteness(user: { name?: string; bio?: string; faculty?: string; contact?: string; skills_to_teach?: unknown[]; skills_to_learn?: unknown[]; availability?: string[] } | null) {
  return useMemo(() => {
    if (!user) return { score: 0, pct: 0, missing: [] as string[] };
    const checks = [
      { ok: !!user.name?.trim(),                              label: "Add your name" },
      { ok: !!user.bio?.trim(),                               label: "Write a bio" },
      { ok: !!user.faculty,                                   label: "Select your faculty" },
      { ok: !!user.contact?.trim(),                           label: "Add contact / WhatsApp" },
      { ok: (user.skills_to_teach?.length ?? 0) > 0,         label: "Add a skill to teach" },
      { ok: (user.skills_to_learn?.length ?? 0) > 0,         label: "Add a skill to learn" },
      { ok: (user.availability?.length ?? 0) > 0,            label: "Set your availability" },
    ];
    const score = checks.filter((c) => c.ok).length;
    return { score, pct: Math.round((score / checks.length) * 100), missing: checks.filter((c) => !c.ok).map((c) => c.label) };
  }, [user]);
}

export default function ProfilePage() {
  const { user, isLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [faculty, setFaculty] = useState("");
  const [contact, setContact] = useState("");
  const [preferredMode, setPreferredMode] = useState("online");
  const [availability, setAvailability] = useState<string[]>([]);
  const [skillsToTeach, setSkillsToTeach] = useState<Skill[]>([]);
  const [skillsToLearn, setSkillsToLearn] = useState<Skill[]>([]);
  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newTeachLevel, setNewTeachLevel] = useState("beginner");
  const [newTeachCategory, setNewTeachCategory] = useState(SKILL_CATEGORIES[0]);
  const [newLearnSkill, setNewLearnSkill] = useState("");
  const [newLearnLevel, setNewLearnLevel] = useState("beginner");
  const [newLearnCategory, setNewLearnCategory] = useState(SKILL_CATEGORIES[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setFaculty(user.faculty || "");
      setContact(user.contact || "");
      setPreferredMode(user.preferred_mode || "online");
      setAvailability(user.availability || []);
      setSkillsToTeach(user.skills_to_teach || []);
      setSkillsToLearn(user.skills_to_learn || []);
    }
  }, [user]);

  const completeness = useCompleteness(
    user ? { ...user, name, bio, faculty, contact, skills_to_teach: skillsToTeach, skills_to_learn: skillsToLearn, availability } : null
  );

  if (isLoading || !user) {
    return (
      <div className="bg-background p-6">
        <div className="container mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const initials = user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Failed to upload avatar"); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await updateProfile(user.id, { avatar_url: urlData.publicUrl });
    await refreshProfile();
    toast.success("Avatar updated!");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateProfile(user.id, {
        name: name.trim(), bio, faculty, contact,
        preferred_mode: preferredMode as "online" | "offline" | "both",
        availability, skills_to_teach: skillsToTeach, skills_to_learn: skillsToLearn,
      });
      if (error) {
        toast.error("Failed to save: " + (error.message || "Unknown error"));
      } else {
        await refreshProfile();
        toast.success("Profile saved!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong saving your profile");
    }
    setSaving(false);
  };

  const addTeachSkill = () => {
    if (!newTeachSkill.trim()) return;
    if (skillsToTeach.some((s) => s.name.toLowerCase() === newTeachSkill.toLowerCase())) return;
    setSkillsToTeach([...skillsToTeach, { name: newTeachSkill.trim(), level: newTeachLevel as Skill["level"], category: newTeachCategory }]);
    setNewTeachSkill("");
  };

  const addLearnSkill = () => {
    if (!newLearnSkill.trim()) return;
    if (skillsToLearn.some((s) => s.name.toLowerCase() === newLearnSkill.toLowerCase())) return;
    setSkillsToLearn([...skillsToLearn, { name: newLearnSkill.trim(), level: newLearnLevel as Skill["level"], category: newLearnCategory }]);
    setNewLearnSkill("");
  };

  const toggleDay = (day: string) =>
    setAvailability((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);

  return (
    <div className="bg-background min-h-dvh">
      <div className="container mx-auto px-4 pt-4 pb-24 max-w-2xl">
        <h1 className="text-2xl font-black text-navy-900 dark:text-foreground mb-6">Your Profile</h1>

        {/* ── Profile header card ── */}
        <Card className="mb-6">
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <Avatar className="h-20 w-20">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-gold-100 text-navy-800 text-2xl font-black">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-5 w-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>

              {/* Name + completeness */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-navy-900 dark:text-foreground truncate">{user.name || "Your Name"}</p>
                <p className="text-xs text-muted-foreground truncate mb-2">{user.email}</p>

                {/* Completeness bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Profile completeness</span>
                    <span className={`text-[11px] font-semibold ${
                      completeness.pct === 100 ? "text-emerald-600" :
                      completeness.pct >= 70  ? "text-primary" : "text-gold-600"
                    }`}>{completeness.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        completeness.pct === 100 ? "bg-emerald-500" :
                        completeness.pct >= 70  ? "bg-primary"    : "bg-gold-500"
                      }`}
                      style={{ width: `${completeness.pct}%` }}
                    />
                  </div>
                  {completeness.pct === 100 ? (
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Complete
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Next: {completeness.missing[0]}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tab nav ── */}
        <div className="flex gap-1 p-1 rounded-xl bg-navy-50 dark:bg-navy-900/30 mb-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === id
                  ? "bg-background text-navy-900 dark:text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden xs:inline sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Profile ── */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={user.email} disabled className="opacity-60" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea
                    placeholder="Tell others about yourself — your strengths, interests, and goals..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Faculty</Label>
                    <Select value={faculty} onValueChange={setFaculty}>
                      <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                      <SelectContent>
                        {FACULTIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferred Mode</Label>
                    <Select value={preferredMode} onValueChange={setPreferredMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">In-person</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Contact / WhatsApp</Label>
                  <Input placeholder="e.g. 0551234567" value={contact} onChange={(e) => setContact(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" loading={saving} onClick={handleSave}>
              Save Profile
            </Button>
          </div>
        )}

        {/* ── Tab: Skills ── */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            {/* Teach */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> Skills You Can Teach
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {skillsToTeach.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skillsToTeach.map((s) => (
                      <Badge key={s.name} className="bg-gold-50 text-navy-800 dark:bg-gold-500/20 dark:text-gold-300 gap-1 pr-1">
                        {s.name}
                        <span className="opacity-60 text-[10px]">·{s.level}</span>
                        <button
                          className="ml-0.5 rounded-sm hover:bg-black/10 transition-colors"
                          onClick={() => setSkillsToTeach(skillsToTeach.filter((sk) => sk.name !== s.name))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Input
                    placeholder="e.g. Python, AutoCAD, Photography..."
                    value={newTeachSkill}
                    onChange={(e) => setNewTeachSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTeachSkill())}
                  />
                  <div className="flex gap-2">
                    <Select value={newTeachLevel} onValueChange={setNewTeachLevel}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newTeachCategory} onValueChange={setNewTeachCategory}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SKILL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={addTeachSkill}>
                    <Plus className="h-4 w-4" /> Add Teach Skill
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Learn */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-sky-500" /> Skills You Want to Learn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {skillsToLearn.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skillsToLearn.map((s) => (
                      <Badge key={s.name} className="bg-sky-50 text-navy-800 dark:bg-sky-500/20 dark:text-sky-300 gap-1 pr-1">
                        {s.name}
                        <span className="opacity-60 text-[10px]">·{s.level}</span>
                        <button
                          className="ml-0.5 rounded-sm hover:bg-black/10 transition-colors"
                          onClick={() => setSkillsToLearn(skillsToLearn.filter((sk) => sk.name !== s.name))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Input
                    placeholder="e.g. React, Accounting, French..."
                    value={newLearnSkill}
                    onChange={(e) => setNewLearnSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLearnSkill())}
                  />
                  <div className="flex gap-2">
                    <Select value={newLearnLevel} onValueChange={setNewLearnLevel}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newLearnCategory} onValueChange={setNewLearnCategory}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SKILL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={addLearnSkill}>
                    <Plus className="h-4 w-4" /> Add Learn Skill
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" loading={saving} onClick={handleSave}>
              Save Skills
            </Button>
          </div>
        )}

        {/* ── Tab: Availability ── */}
        {activeTab === "availability" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">When are you available?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Select the days you&apos;re typically free for skill swap sessions.</p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const active = availability.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`flex flex-col items-center justify-center rounded-xl py-3 px-1 text-xs font-semibold transition-all border ${
                          active
                            ? "bg-primary border-primary text-white shadow-sm"
                            : "border-border hover:border-primary/50 hover:bg-navy-50 dark:hover:bg-navy-900/30 text-muted-foreground"
                        }`}
                      >
                        <span className="text-[15px] mb-1">{active ? "✓" : day.slice(0,1)}</span>
                        <span>{day.slice(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>
                {availability.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Available on: <span className="text-foreground font-medium">{availability.join(", ")}</span>
                  </p>
                )}
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" loading={saving} onClick={handleSave}>
              Save Availability
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
