"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeToPush, isPushSubscribed, registerServiceWorker } from "@/lib/push-notifications";
import { Button } from "@/components/ui/button";
import { Bell, Download, X } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PushPrompt() {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Register SW + check notification status
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;

    // Always register SW (needed for both push and PWA)
    registerServiceWorker();

    if (!("PushManager" in window)) return;
    if (Notification.permission === "granted") {
      isPushSubscribed().then((subscribed) => {
        if (!subscribed) subscribeToPush(user.id);
      });
      return;
    }
    if (Notification.permission === "denied") return;

    const timer = setTimeout(() => setShowNotif(true), 3000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      toast.success("App installed!");
    }
    deferredPromptRef.current = null;
    setShowInstall(false);
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    setSubscribing(true);
    const success = await subscribeToPush(user.id);
    if (success) {
      toast.success("Notifications enabled!");
    } else {
      toast.error("Could not enable notifications. Check browser permissions.");
    }
    setSubscribing(false);
    setShowNotif(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Install App Prompt */}
      {showInstall && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-background border rounded-xl shadow-lg p-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Install SkillSwap</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to your home screen for a full app experience with notifications.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={handleInstall}>
                  Install
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowInstall(false)}>
                  Not now
                </Button>
              </div>
            </div>
            <button onClick={() => setShowInstall(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notification Prompt */}
      {showNotif && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-background border rounded-xl shadow-lg p-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gold-100 dark:bg-gold-500/20 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 text-gold-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Enable Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get notified when you receive new messages, even when the app is closed.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="text-xs"
                  disabled={subscribing}
                  onClick={handleEnableNotifications}
                >
                  {subscribing ? "Enabling..." : "Enable"}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowNotif(false)}>
                  Not now
                </Button>
              </div>
            </div>
            <button onClick={() => setShowNotif(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
