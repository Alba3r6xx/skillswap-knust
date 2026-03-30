import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background">
      {/* Illustration */}
      <div className="relative mb-8 select-none" aria-hidden>
        <div className="text-[120px] font-black text-navy-50 dark:text-navy-900 leading-none tracking-tight">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gold-100 dark:bg-gold-900/20 flex items-center justify-center">
            <BookOpen className="h-9 w-9 text-gold-500" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Copy */}
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-foreground mb-2">
          Page not found
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Looks like this page took an unplanned leave of absence. Let&apos;s
          get you back to something useful.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/search">
              <Search className="h-4 w-4" />
              Find Peers
            </Link>
          </Button>
        </div>
      </div>

      {/* KNUST badge */}
      <p className="mt-12 text-xs text-muted-foreground/60 font-mono tracking-wide">
        SKILLSWAP · KNUST
      </p>
    </div>
  );
}
