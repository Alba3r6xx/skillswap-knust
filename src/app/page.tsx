"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Repeat2, ArrowRight, GraduationCap, Users, Calendar } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, user, router]);

  if (isLoading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-background dark:via-background dark:to-background">
      {/* Hero */}
      <div className="container mx-auto px-4 py-20 text-center max-w-3xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Repeat2 className="h-7 w-7" />
          </div>
          <span className="text-3xl font-bold">
            Skill<span className="text-amber-500">Swap</span> KNUST
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Learn from your peers,<br />
          <span className="text-amber-500">teach what you know</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Connect with fellow KNUST students to exchange skills and knowledge.
          Find the perfect study partner, book sessions, and grow together.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white gap-2 px-8">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Sign In</Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 text-left">
          <div className="p-6 rounded-xl border bg-white/50 dark:bg-muted/50">
            <GraduationCap className="h-8 w-8 text-amber-500 mb-3" />
            <h3 className="font-semibold mb-2">Skill Exchange</h3>
            <p className="text-sm text-muted-foreground">
              List skills you can teach and want to learn. Get matched with peers who complement you.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-white/50 dark:bg-muted/50">
            <Users className="h-8 w-8 text-amber-500 mb-3" />
            <h3 className="font-semibold mb-2">Smart Matching</h3>
            <p className="text-sm text-muted-foreground">
              Our algorithm finds the best matches based on skills, faculty, availability, and ratings.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-white/50 dark:bg-muted/50">
            <Calendar className="h-8 w-8 text-amber-500 mb-3" />
            <h3 className="font-semibold mb-2">Book Sessions</h3>
            <p className="text-sm text-muted-foreground">
              Schedule learning sessions online or offline. Rate and review after completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
