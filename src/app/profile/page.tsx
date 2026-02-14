"use client";

import { useEffect, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  BookOpen,
  Plus,
  X,
  Camera,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, isLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [faculty, setFaculty] = useState("");
  const [contact, setContact] = useState("");
  const [preferredMode, setPreferredMode] = useState("online");
  const [availability, setAvailability] = useState<string[]>([]);
  const [skillsToTeach, setSkillsToTeach] = useState<Skill[]>([]);
  const [skillsToLearn, setSkillsToLearn] = useState<Skill[]>([]);
  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newTeachLevel, setNewTeachLevel] = useState("intermediate");
  const [newTeachCategory, setNewTeachCategory] = useState("Other");
  const [newLearnSkill, setNewLearnSkill] = useState("");
  const [newLearnLevel, setNewLearnLevel] = useState("beginner");
  const [newLearnCategory, setNewLearnCategory] = useState("Other");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
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

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background p-6">
        <div className="container mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Failed to upload avatar");
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await updateProfile(user.id, { avatar_url: urlData.publicUrl });
    await refreshProfile();
    toast.success("Avatar updated!");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateProfile(user.id, {
        name: name.trim(),
        bio,
        faculty,
        contact,
        preferred_mode: preferredMode as "online" | "offline" | "both",
        availability,
        skills_to_teach: skillsToTeach,
        skills_to_learn: skillsToLearn,
      });

      if (error) {
        console.error("Profile update error:", error);
        toast.error("Failed to save profile: " + (error.message || "Unknown error"));
      } else {
        await refreshProfile();
        toast.success("Profile saved!");
      }
    } catch (err) {
      console.error("Profile save exception:", err);
      toast.error("Something went wrong saving your profile");
    }
    setSaving(false);
  };

  const addTeachSkill = () => {
    if (!newTeachSkill.trim()) return;
    if (skillsToTeach.some((s) => s.name.toLowerCase() === newTeachSkill.toLowerCase())) return;
    setSkillsToTeach([...skillsToTeach, {
      name: newTeachSkill.trim(),
      level: newTeachLevel as Skill["level"],
      category: newTeachCategory,
    }]);
    setNewTeachSkill("");
  };

  const addLearnSkill = () => {
    if (!newLearnSkill.trim()) return;
    if (skillsToLearn.some((s) => s.name.toLowerCase() === newLearnSkill.toLowerCase())) return;
    setSkillsToLearn([...skillsToLearn, {
      name: newLearnSkill.trim(),
      level: newLearnLevel as Skill["level"],
      category: newLearnCategory,
    }]);
    setNewLearnSkill("");
  };

  const toggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <Avatar className="h-24 w-24">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-amber-100 text-amber-700 text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="h-6 w-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personal Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="opacity-60" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell others about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Faculty</Label>
                  <Select value={faculty} onValueChange={setFaculty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACULTIES.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Mode</Label>
                  <Select value={preferredMode} onValueChange={setPreferredMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contact (phone/WhatsApp)</Label>
                <Input
                  placeholder="e.g. 0551234567"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills to Teach */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-green-600" /> Skills You Can Teach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {skillsToTeach.map((s) => (
                  <Badge key={s.name} className="bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400 gap-1">
                    {s.name} ({s.level})
                    <button onClick={() => setSkillsToTeach(skillsToTeach.filter((sk) => sk.name !== s.name))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Skill name"
                  value={newTeachSkill}
                  onChange={(e) => setNewTeachSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTeachSkill())}
                />
                <div className="flex gap-2">
                  <Select value={newTeachLevel} onValueChange={setNewTeachLevel}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newTeachCategory} onValueChange={setNewTeachCategory}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={addTeachSkill}>
                  <Plus className="h-4 w-4" /> Add Skill
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Skills to Learn */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" /> Skills You Want to Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {skillsToLearn.map((s) => (
                  <Badge key={s.name} className="bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 gap-1">
                    {s.name} ({s.level})
                    <button onClick={() => setSkillsToLearn(skillsToLearn.filter((sk) => sk.name !== s.name))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Skill name"
                  value={newLearnSkill}
                  onChange={(e) => setNewLearnSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLearnSkill())}
                />
                <div className="flex gap-2">
                  <Select value={newLearnLevel} onValueChange={setNewLearnLevel}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newLearnCategory} onValueChange={setNewLearnCategory}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={addLearnSkill}>
                  <Plus className="h-4 w-4" /> Add Skill
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day}
                    variant={availability.includes(day) ? "default" : "outline"}
                    size="sm"
                    className={availability.includes(day) ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                    onClick={() => toggleDay(day)}
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
            disabled={saving}
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
