"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[SkillSwap Error]", error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background">
      {/* Illustration */}
      <div className="relative mb-8 select-none" aria-hidden>
        <div className="text-[120px] font-black text-navy-50 dark:text-navy-900 leading-none tracking-tight">
          500
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="h-9 w-9 text-red-500" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Copy */}
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-2">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground/60 mb-8">
            Error ID: {error.digest}
          </p>
        )}
        {!error.digest && <div className="mb-8" />}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>

      <p className="mt-12 text-xs text-muted-foreground/60 font-mono tracking-wide">
        SKILLSWAP · KNUST
      </p>
    </div>
  );
}
