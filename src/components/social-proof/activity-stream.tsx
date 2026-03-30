"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ACTIVITY_MESSAGES = [
  (skill: string, name: string) => `${name} just booked a ${skill} session`,
  (skill: string, name: string) => `${name} accepted a ${skill} swap request`,
  (skill: string, name: string) => `${name} completed a ${skill} session`,
  (skill: string, _name: string) => `Someone new is offering ${skill} lessons`,
];

function formatName(full: string): string {
  const parts = full.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : parts[0];
}

interface ActivityStreamProps {
  currentUserId?: string;
}

/** Mounts a Supabase realtime listener and surfaces other users' session activity as toasts */
export function ActivityStream({ currentUserId }: ActivityStreamProps) {
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase
      .channel("global-session-activity")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sessions" },
        async (payload) => {
          const session = payload.new as {
            id: string;
            teacher_id: string;
            learner_id: string;
            skill: string;
            status: string;
          };

          // Don't show toasts for current user's own actions
          if (
            session.teacher_id === currentUserId ||
            session.learner_id === currentUserId ||
            seenIds.current.has(session.id)
          ) return;

          seenIds.current.add(session.id);

          // Fetch teacher name
          const { data: teacher } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", session.teacher_id)
            .single();

          if (!teacher) return;

          const msgFn = ACTIVITY_MESSAGES[Math.floor(Math.random() * ACTIVITY_MESSAGES.length)];
          toast(msgFn(session.skill, formatName(teacher.name)), {
            duration: 5000,
            position: "bottom-right",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions" },
        async (payload) => {
          const session = payload.new as {
            id: string;
            teacher_id: string;
            learner_id: string;
            skill: string;
            status: string;
          };

          if (
            session.teacher_id === currentUserId ||
            session.learner_id === currentUserId
          ) return;

          if (session.status !== "accepted" && session.status !== "completed") return;

          const dedupeKey = `${session.id}-${session.status}`;
          if (seenIds.current.has(dedupeKey)) return;
          seenIds.current.add(dedupeKey);

          const { data: teacher } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", session.teacher_id)
            .single();

          if (!teacher) return;

          const msgFn =
            session.status === "completed"
              ? ACTIVITY_MESSAGES[2]
              : ACTIVITY_MESSAGES[1];

          toast(msgFn(session.skill, formatName(teacher.name)), {
            duration: 5000,
            position: "bottom-right",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return null;
}
