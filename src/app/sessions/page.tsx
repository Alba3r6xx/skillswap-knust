"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSessionsByUser, updateSession, getProfileById, createNotification } from "@/lib/data";
import { Session, Profile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { toast } from "sonner";

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
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background p-6">
        <div className="container mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-10 w-48" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const handleAccept = async (session: Session) => {
    await updateSession(session.id, { status: "accepted" });
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
    await updateSession(session.id, { status: "cancelled" });
    toast.info("Session cancelled");
    fetchSessions();
  };

  const handleComplete = async (session: Session) => {
    await updateSession(session.id, { status: "completed" });
    toast.success("Session marked as complete!");
    fetchSessions();
  };

  const handleRate = async () => {
    if (!selectedSession || rating === 0) return;
    const isTeacher = selectedSession.teacher_id === user.id;
    const updates: Partial<Session> = isTeacher
      ? { teacher_rating: rating, teacher_feedback: feedback }
      : { learner_rating: rating, learner_feedback: feedback };
    await updateSession(selectedSession.id, updates);
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
    const initials = otherName.split(" ").map((n) => n[0]).join("").toUpperCase();
    const hasRated = isTeacher ? !!session.teacher_rating : !!session.learner_rating;

    return (
      <Card key={session.id}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              {other?.avatar_url ? (
                <img src={other.avatar_url} alt={otherName} className="h-full w-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-semibold">
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
                    <Link href={`/profile/${otherUserId}`} className="text-amber-600 hover:underline">{otherName}</Link>
                  </p>
                </div>
                <Badge className={`text-[10px] ${
                  session.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                  : session.status === "accepted" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                  : session.status === "completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                  : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                }`}>
                  {session.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{new Date(session.date).toLocaleDateString()} at {session.time}</span>
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
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  Teacher rated: {session.teacher_rating}/5
                  {session.teacher_feedback && <span className="text-muted-foreground ml-1">— &quot;{session.teacher_feedback}&quot;</span>}
                </div>
              )}
              {session.learner_rating && (
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
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
                <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => handleAccept(session)}>
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
                <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1" onClick={() => handleComplete(session)}>
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
                className="text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1"
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
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 pt-4 pb-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Sessions</h1>

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
              <div className="text-center py-12 text-muted-foreground">No upcoming sessions</div>
            ) : (
              <div className="space-y-3">{accepted.map(renderSession)}</div>
            )}
          </TabsContent>
          <TabsContent value="pending">
            {pending.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No pending requests</div>
            ) : (
              <div className="space-y-3">{pending.map(renderSession)}</div>
            )}
          </TabsContent>
          <TabsContent value="completed">
            {completed.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No completed sessions yet</div>
            ) : (
              <div className="space-y-3">{completed.map(renderSession)}</div>
            )}
          </TabsContent>
          <TabsContent value="cancelled">
            {cancelled.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No cancelled sessions</div>
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
            <DialogTitle>Rate this session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`h-8 w-8 transition-colors ${s <= rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Leave a comment (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRateDialog(false)}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" disabled={rating === 0} onClick={handleRate}>
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
