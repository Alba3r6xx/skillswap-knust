"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeToPush, isPushSubscribed } from "@/lib/push-notifications";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";

export default function PushPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "granted") {
      // Already granted — ensure subscription exists
      isPushSubscribed().then((subscribed) => {
        if (!subscribed) subscribeToPush(user.id);
      });
      return;
    }
    if (Notification.permission === "denied") return;

    // Show prompt after a short delay (don't annoy on first load)
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, [user]);

  if (!show || !user) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-background border rounded-xl shadow-lg p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
          <Bell className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Enable Notifications</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get notified when you receive new messages, even when the app is closed.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
              disabled={subscribing}
              onClick={async () => {
                setSubscribing(true);
                await subscribeToPush(user.id);
                setShow(false);
              }}
            >
              {subscribing ? "Enabling..." : "Enable"}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShow(false)}>
              Not now
            </Button>
          </div>
        </div>
        <button onClick={() => setShow(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
