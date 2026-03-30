"use client";

import React from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface State {
  hasError: boolean;
  error?: Error;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  inline?: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    if (this.props.inline) {
      return (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
            This section failed to load
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background">
        <div className="relative mb-8 select-none" aria-hidden>
          <div className="text-[100px] font-black text-navy-50 dark:text-navy-900 leading-none tracking-tight">
            Oops
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-red-500" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            {this.state.error?.message || "An unexpected error occurred. Try refreshing the page."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-primary text-white font-semibold text-sm
                active:scale-[0.97] transition-all hover:brightness-105"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-border font-semibold text-sm
                hover:bg-navy-50 dark:hover:bg-navy-900/30 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Home
            </Link>
          </div>
        </div>

        <p className="mt-12 text-xs text-muted-foreground/60 font-mono tracking-wide">
          SKILLSWAP · KNUST
        </p>
      </div>
    );
  }
}
