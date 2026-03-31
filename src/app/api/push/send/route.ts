import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const VAPID_PUBLIC_KEY = "BKbIshU-vonOtfVoQTPlhHRwXvaGFRhy-s3bqhisX8BA7ar2ee9LM8FEfKsqt3qx9oZ4hW989oxbX8eZj2OQ3c8";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:skillswap@knust.edu.gh",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function POST(req: NextRequest) {
  try {
    const { recipientId, title, body, url } = await req.json();

    if (!recipientId || !title) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: "Push not configured" }, { status: 500 });
    }

    // Get recipient's push subscription
    const { data: sub } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", recipientId)
      .single();

    if (!sub) {
      return NextResponse.json({ sent: false, reason: "No subscription" });
    }

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/messages",
      tag: `msg-${recipientId}`,
    });

    await webpush.sendNotification(pushSubscription, payload);

    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    // If subscription expired, remove it
    if (error.statusCode === 410) {
      const { recipientId } = await req.json().catch(() => ({}));
      if (recipientId) {
        await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .eq("user_id", recipientId);
      }
    }
    console.error("Push send error:", error.message || err);
    return NextResponse.json({ sent: false, error: "Push failed" }, { status: 500 });
  }
}
