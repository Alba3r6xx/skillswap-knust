"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getProfileById, getSessionsByUser, getTimeSinceLastSeen, computeBadges, createSession, createNotification } from "@/lib/data";
import { Profile, Badge as BadgeType, Session } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Star,
  GraduationCap,
  BookOpen,
  Calendar,
  MessageSquare,
  Monitor,
  Clock,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { getViewerCount, getAvailableSlots, getSkillRequestCount } from "@/lib/gamification";

export default function PublicProfilePage() {
  const { user: currentUser, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [profileUser, setProfileUser] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [profileSessions, setProfileSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [bookSkill, setBookSkill] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookMode, setBookMode] = useState<"online" | "offline">("online");
  const [bookLocation, setBookLocation] = useState("");
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login");
      return;
    }
    if (userId && currentUser) {
      if (userId === currentUser.id) {
        router.push("/profile");
        return;
      }
      const fetchProfile = async () => {
        const u = await getProfileById(userId);
        setProfileUser(u);
        if (u) {
          const sessions = await getSessionsByUser(userId);
          setBadges(computeBadges(sessions, userId));
          setSessionCount(sessions.filter((s) => s.status === "completed").length);
          setProfileSessions(sessions);
        }
        setLoading(false);
      };
      fetchProfile();
    }
  }, [userId, currentUser, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="bg-background min-h-dvh">
        <div className="container mx-auto max-w-2xl space-y-4 px-4 pt-[calc(3rem+env(safe-area-inset-top)+1rem)] md:pt-8 pb-8">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-48" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  if (!profileUser) {
    return (
      <div className="bg-background flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">User not found</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go back
          </Button>
        </div>
      </div>
    );
  }

  const initials = profileUser.name.split(" ").map((n) => n[0]).join("").toUpperCase();
  const lastSeen = getTimeSinceLastSeen(profileUser.last_seen);
  const isOnline = lastSeen === "Online now";
  const viewerCount = getViewerCount(profileUser.id);
  const availableSlots = getAvailableSlots(profileSessions, profileUser.id);
  const topSkill = profileUser.skills_to_teach[0];
  const skillDemand = topSkill ? getSkillRequestCount(topSkill.name) : 0;

  return (
    <div className="bg-background min-h-dvh">
      <div className="container mx-auto px-4 pt-[calc(3rem+env(safe-area-inset-top)+1rem)] md:pt-8 pb-8 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* Urgency + social proof bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
            {viewerCount} people viewing now
          </div>
          {availableSlots <= 2 && availableSlots > 0 && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
              Only {availableSlots} slot{availableSlots > 1 ? "s" : ""} left this week
            </span>
          )}
          {availableSlots === 0 && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
              Fully booked this week
            </span>
          )}
          {skillDemand >= 8 && topSkill && (
            <span className="text-xs font-semibold text-gold-700 bg-gold-50 dark:bg-gold-500/10 px-2 py-0.5 rounded-full">
              {topSkill.name} requested {skillDemand}× this week
            </span>
          )}
        </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {profileUser.avatar_url ? (
                    <img src={profileUser.avatar_url} alt={profileUser.name} className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-gold-100 text-navy-800 text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isOnline && (
                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold">{profileUser.name}</h1>
                <p className="text-sm text-muted-foreground">{profileUser.faculty}</p>
                <div className="flex items-center gap-3 mt-2">
                  {profileUser.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-gold-500 fill-gold-500" />
                      <span className="text-sm font-semibold">{profileUser.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({profileUser.total_ratings})</span>
                    </div>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isOnline ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {lastSeen}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Monitor className="h-3 w-3" /> {profileUser.preferred_mode}
                  <span className="mx-1">•</span>
                  <Calendar className="h-3 w-3" /> {sessionCount} sessions completed
                </div>
              </div>
            </div>

            {profileUser.bio && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">{profileUser.bio}</p>
              </>
            )}

            <div className="flex gap-2 mt-4">
              <Link href={`/messages?peer=${profileUser.id}`} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" /> Message
                </Button>
              </Link>
              <Button
                className="flex-1 gap-2"
                onClick={() => setShowBookDialog(true)}
              >
                <Calendar className="h-4 w-4" /> Book Session
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Skills to Teach */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" /> Can Teach
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileUser.skills_to_teach.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profileUser.skills_to_teach.map((s) => (
                    <Badge key={s.name} className="bg-gold-50 text-navy-800 dark:bg-gold-500/20 dark:text-gold-300">
                      {s.name} <span className="ml-1 opacity-60">({s.level})</span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills to Learn */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-sky-500" /> Wants to Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileUser.skills_to_learn.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profileUser.skills_to_learn.map((s) => (
                    <Badge key={s.name} className="bg-sky-50 text-navy-800 dark:bg-sky-500/20 dark:text-sky-300">
                      {s.name} <span className="ml-1 opacity-60">({s.level})</span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold-600" /> Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileUser.availability.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not specified</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profileUser.availability.map((day) => (
                    <Badge key={day} variant="secondary">{day}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Badges ({badges.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No badges earned yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <div key={b.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-card dark:bg-muted/50" title={b.description}>
                      <span className="text-base">{b.icon}</span>
                      <span className="text-xs font-medium">{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Book Session Dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book a Session with {profileUser?.name?.split(" ")[0]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Skill</Label>
              <Select value={bookSkill} onValueChange={setBookSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {profileUser?.skills_to_teach.map((s) => (
                    <SelectItem key={s.name} value={s.name}>
                      {s.name} ({s.level})
                    </SelectItem>
                  ))}
                  {profileUser?.skills_to_learn
                    .filter((s) => currentUser?.skills_to_teach.some((t) => t.name.toLowerCase() === s.name.toLowerCase()))
                    .map((s) => (
                      <SelectItem key={`learn-${s.name}`} value={s.name}>
                        {s.name} (you teach)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={bookMode} onValueChange={(v) => setBookMode(v as "online" | "offline")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">
                    <span className="flex items-center gap-2"><Monitor className="h-3 w-3" /> Online</span>
                  </SelectItem>
                  <SelectItem value="offline">
                    <span className="flex items-center gap-2"><MapPin className="h-3 w-3" /> In Person</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bookMode === "offline" && (
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="e.g. KNUST Library, Room 2B"
                  value={bookLocation}
                  onChange={(e) => setBookLocation(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBookDialog(false)}>Cancel</Button>
            <Button
              loading={bookingInProgress}
              disabled={!bookSkill || !bookDate || !bookTime}
              onClick={async () => {
                if (!currentUser || !profileUser) return;
                setBookingInProgress(true);
                const isTeaching = currentUser.skills_to_teach.some(
                  (t) => t.name.toLowerCase() === bookSkill.toLowerCase()
                );
                const teacherId = isTeaching ? currentUser.id : profileUser.id;
                const learnerId = isTeaching ? profileUser.id : currentUser.id;
                const { error } = await createSession({
                  teacher_id: teacherId,
                  learner_id: learnerId,
                  skill: bookSkill,
                  date: bookDate,
                  time: bookTime,
                  mode: bookMode,
                  location: bookLocation,
                  status: "pending",
                  notes: "",
                });
                if (error) {
                  toast.error("Failed to book session");
                } else {
                  await createNotification({
                    user_id: profileUser.id,
                    type: "session_request",
                    title: "New Session Request",
                    message: `${currentUser.name} wants to book a ${bookSkill} session with you`,
                    link: "/sessions",
                  });
                  toast.success("Session request sent!");
                  setShowBookDialog(false);
                  setBookSkill("");
                  setBookDate("");
                  setBookTime("");
                  setBookLocation("");
                }
                setBookingInProgress(false);
              }}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
