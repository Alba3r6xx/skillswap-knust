"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSessionsByUser, updateSession, getProfileById, createNotification, awardXP, recalculateProfileRating } from "@/lib/data";
import { XP_REWARDS } from "@/lib/gamification";
import { Session, Profile } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Star,
  MessageSquare,
  Monitor,
  MapPin,
  FileText,
  Save,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

export default function SessionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profileCache, setProfileCache] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  const fetchSessions = async () => {
    if (!user) return;
    const data = await getSessionsByUser(user.id);
    setSessions(data);

    const ids = new Set<string>();
    data.forEach((s) => { ids.add(s.teacher_id); ids.add(s.learner_id); });
    ids.delete(user.id);

    const profiles: Record<string, Profile> = { ...profileCache };
    for (const id of ids) {
      if (!profiles[id]) {
        const p = await getProfileById(id);
        if (p) profiles[id] = p;
      }
    }
    setProfileCache(profiles);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-3xl space-y-4 px-4 pt-4 md:pt-8 pb-8">
          <Skeleton className="h-10 w-48" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const handleAccept = async (session: Session) => {
    const { error } = await updateSession(session.id, { status: "accepted" });
    if (error) { toast.error("Failed to accept session"); return; }
    toast.success("Session accepted!");
    await createNotification({
      user_id: session.learner_id,
      type: "session_accepted",
      title: "Session Accepted",
      message: `Your ${session.skill} session has been accepted!`,
      link: "/sessions",
    });
    fetchSessions();
  };

  const handleCancel = async (session: Session) => {
    const { error } = await updateSession(session.id, { status: "cancelled" });
    if (error) { toast.error("Failed to cancel session"); return; }
    toast.info("Session cancelled");
    fetchSessions();
  };

  const handleComplete = async (session: Session) => {
    const { error } = await updateSession(session.id, { status: "completed" });
    if (error) { toast.error("Failed to mark session complete"); return; }
    // Award XP to both participants
    const isTeacher = session.teacher_id === user.id;
    const otherId = isTeacher ? session.learner_id : session.teacher_id;
    await Promise.all([
      awardXP(session.teacher_id, XP_REWARDS.session_taught),
      awardXP(session.learner_id, XP_REWARDS.session_completed),
      createNotification({
        user_id: otherId,
        type: "session_completed",
        title: "Session Completed",
        message: `Your ${session.skill} session has been marked as complete!`,
        link: "/sessions",
      }),
    ]);
    toast.success("Session marked as complete!");
    fetchSessions();
  };

  const handleRate = async () => {
    if (!selectedSession || rating === 0) return;
    const isTeacher = selectedSession.teacher_id === user.id;
    const updates: Partial<Session> = isTeacher
      ? { teacher_rating: rating, teacher_feedback: feedback }
      : { learner_rating: rating, learner_feedback: feedback };
    const { error: rateError } = await updateSession(selectedSession.id, updates);
    if (rateError) { toast.error("Failed to submit rating"); return; }
    // Recalculate the rated user's aggregate profile rating
    const ratedUserId = isTeacher ? selectedSession.learner_id : selectedSession.teacher_id;
    await recalculateProfileRating(ratedUserId);
    await awardXP(user.id, XP_REWARDS.rating_given);
    toast.success("Rating submitted!");
    setShowRateDialog(false);
    setRating(0);
    setFeedback("");
    setSelectedSession(null);
    fetchSessions();
  };

  const pending = sessions.filter((s) => s.status === "pending");
  const accepted = sessions.filter((s) => s.status === "accepted");
  const completed = sessions.filter((s) => s.status === "completed");
  const cancelled = sessions.filter((s) => s.status === "cancelled");

  const renderSession = (session: Session) => {
    const isTeacher = session.teacher_id === user.id;
    const otherUserId = isTeacher ? session.learner_id : session.teacher_id;
    const other = profileCache[otherUserId];
    const otherName = other?.name || "Unknown";
    const initials = otherName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";
    const hasRated = isTeacher ? !!session.teacher_rating : !!session.learner_rating;

    return (
      <Card key={session.id}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              {other?.avatar_url ? (
                <img src={other.avatar_url} alt={otherName} className="h-full w-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-gold-100 text-navy-800 text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{session.skill}</p>
                  <p className="text-xs text-muted-foreground">
                    {isTeacher ? "Teaching" : "Learning from"}{" "}
                    <Link href={`/profile/${otherUserId}`} className="text-primary hover:underline font-medium">{otherName}</Link>
                  </p>
                </div>
                <Badge className={`text-[10px] ${
                  session.status === "pending" ? "bg-gold-100 text-gold-700 dark:bg-gold-500/20 dark:text-gold-400"
                  : session.status === "accepted" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : session.status === "completed" ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400"
                  : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                }`}>
                  {session.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(session.date).toLocaleDateString()} at {session.time}</span>
                <span className="flex items-center gap-0.5">
                  {session.mode === "online" ? <Monitor className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                  {session.mode}
                </span>
              </div>
            </div>
          </div>

          {/* Session Notes */}
          {(session.status === "accepted" || session.status === "completed") && (
            <div className="mt-3">
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                <FileText className="h-3 w-3" /> Notes
              </div>
              <div className="flex gap-1.5">
                <Textarea
                  placeholder="Agenda, topics, next steps..."
                  defaultValue={session.notes || ""}
                  rows={2}
                  className="text-xs min-h-[48px]"
                  id={`notes-${session.id}`}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-auto"
                  onClick={async () => {
                    const el = document.getElementById(`notes-${session.id}`) as HTMLTextAreaElement;
                    if (el) {
                      await updateSession(session.id, { notes: el.value });
                      toast.success("Notes saved!");
                    }
                  }}
                >
                  <Save className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Ratings */}
          {session.status === "completed" && (session.teacher_rating || session.learner_rating) && (
            <div className="mt-3 space-y-1">
              {session.teacher_rating && (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 text-gold-500 fill-gold-500" />
                  Teacher rated: {session.teacher_rating}/5
                  {session.teacher_feedback && <span className="text-muted-foreground ml-1">— &quot;{session.teacher_feedback}&quot;</span>}
                </div>
              )}
              {session.learner_rating && (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 text-gold-500 fill-gold-500" />
                  Learner rated: {session.learner_rating}/5
                  {session.learner_feedback && <span className="text-muted-foreground ml-1">— &quot;{session.learner_feedback}&quot;</span>}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {session.status === "pending" && session.teacher_id === user.id && (
              <>
                <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1" onClick={() => handleAccept(session)}>
                  <CheckCircle2 className="h-3 w-3" /> Accept
                </Button>
                <Button size="sm" variant="outline" className="text-xs text-red-600 gap-1" onClick={() => handleCancel(session)}>
                  <XCircle className="h-3 w-3" /> Decline
                </Button>
              </>
            )}
            {session.status === "pending" && session.learner_id === user.id && (
              <Button size="sm" variant="outline" className="text-xs text-red-600 gap-1" onClick={() => handleCancel(session)}>
                <XCircle className="h-3 w-3" /> Cancel
              </Button>
            )}
            {session.status === "accepted" && (
              <>
                <Button size="sm" className="text-xs bg-navy-700 hover:bg-navy-800 text-white rounded-lg gap-1" onClick={() => handleComplete(session)}>
                  <CheckCircle2 className="h-3 w-3" /> Mark Complete
                </Button>
                <Link href={`/messages?peer=${otherUserId}`}>
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <MessageSquare className="h-3 w-3" /> Chat
                  </Button>
                </Link>
              </>
            )}
            {session.status === "completed" && !hasRated && (
              <Button
                size="sm"
                className="text-xs gap-1"
                onClick={() => { setSelectedSession(session); setShowRateDialog(true); }}
              >
                <Star className="h-3 w-3" /> Rate & Review
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-dvh bg-background">
      {/* ── Navy page banner ── */}
      <div className="bg-navy-900 pt-2 md:pt-8 pb-16 px-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-white animate-slide-up">Sessions</h1>
          <p className="text-sm text-navy-300 mt-1 animate-slide-up">Track your upcoming and past swaps</p>
        </div>
      </div>

      {/* ── Content overlapping banner ── */}
      <div className="mx-auto px-4 -mt-10 pb-8 max-w-3xl relative z-10">

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">
              Upcoming {accepted.length > 0 && `(${accepted.length})`}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending {pending.length > 0 && `(${pending.length})`}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {accepted.length === 0 ? (
              <EmptyState
                icon={<Calendar />}
                title="No upcoming sessions"
                description="Nothing booked yet. Find a peer and lock in a time."
                action={{ label: "Find someone", href: "/search" }}
                secondaryAction={{ label: "Check matches", href: "/matches" }}
              />
            ) : (
              <div className="space-y-3">{accepted.map(renderSession)}</div>
            )}
          </TabsContent>
          <TabsContent value="pending">
            {pending.length === 0 ? (
              <EmptyState
                icon={<Clock />}
                title="No pending requests"
                description="Requests you send or receive show up here."
                action={{ label: "Find someone to ask", href: "/search" }}
              />
            ) : (
              <div className="space-y-3">{pending.map(renderSession)}</div>
            )}
          </TabsContent>
          <TabsContent value="completed">
            {completed.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 />}
                title="No completed sessions yet"
                description="Finished swaps show up here. Rate them to earn XP."
                action={{ label: "Find someone", href: "/search" }}
              />
            ) : (
              <div className="space-y-3">{completed.map(renderSession)}</div>
            )}
          </TabsContent>
          <TabsContent value="cancelled">
            {cancelled.length === 0 ? (
              <EmptyState
                icon={<XCircle />}
                title="No cancelled sessions"
                description="Nothing cancelled — you’re on track!"
                action={{ label: "Book a session", href: "/search" }}
              />
            ) : (
              <div className="space-y-3">{cancelled.map(renderSession)}</div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Rate Dialog */}
      <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How’d it go?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`h-8 w-8 transition-colors ${s <= rating ? "text-gold-500 fill-gold-500" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Anything to add? (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRateDialog(false)}>Cancel</Button>
            <Button disabled={rating === 0} onClick={handleRate}>
              Save rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
