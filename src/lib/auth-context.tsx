"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/types";
import { markMessagesAsDelivered } from "@/lib/data";
import type { Session as SupabaseSession, User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextType {
  user: Profile | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  signUp: (data: { name: string; email: string; password: string; faculty: string }) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  isLoading: true,
  signUp: async () => ({ success: false }),
  signIn: async () => ({ success: false }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const buildProfileSeed = (
    authUser: SupabaseUser,
    fallback?: { name?: string; email?: string; faculty?: string }
  ) => ({
    id: authUser.id,
    name: fallback?.name ?? authUser.user_metadata?.name ?? authUser.email?.split("@")[0] ?? "",
    email: fallback?.email ?? authUser.email ?? "",
    faculty: fallback?.faculty ?? authUser.user_metadata?.faculty ?? "",
  });

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!data || error) {
      setUser(null);
      return null;
    }

    setUser(data as Profile);
    // Fire-and-forget: update last_seen + mark messages as delivered
    supabase.rpc("update_last_seen").then(() => {}, () => {});
    markMessagesAsDelivered(userId).catch(() => {});
    return data as Profile | null;
  };

  const ensureProfile = async (
    authUser: SupabaseUser,
    fallback?: { name?: string; email?: string; faculty?: string }
  ) => {
    const existingProfile = await fetchProfile(authUser.id);
    if (existingProfile) {
      return existingProfile;
    }

    const { error } = await supabase
      .from("profiles")
      .insert(buildProfileSeed(authUser, fallback));

    if (error) {
      const recoveredProfile = await fetchProfile(authUser.id);
      return recoveredProfile;
    }

    return await fetchProfile(authUser.id);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          // Invalid/expired refresh token — wipe local storage only.
          // scope:'local' avoids a second API call with the already-invalid token.
          try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
          setSupabaseUser(null);
          setUser(null);
          setIsLoading(false);
          return;
        }
        if (session?.user) {
          setSupabaseUser(session.user);
          await ensureProfile(session.user);
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
        setIsLoading(false);
      } catch {
        // Handles corrupted persisted auth state (commonly from stale browser storage).
        console.error("[AuthProvider:init] failed to load session. Clearing local auth state.");
        try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
        setSupabaseUser(null);
        setUser(null);
        setIsLoading(false);
      }
    };
    init();

    const handleAuthChange = async (event: string, session: SupabaseSession | null) => {
      try {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            setSupabaseUser(session.user);
            await ensureProfile(session.user);
          } else {
            // TOKEN_REFRESHED fired but session is null — token was invalidated
            try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
            setSupabaseUser(null);
            setUser(null);
          }
        } else if (event === "SIGNED_OUT") {
          setSupabaseUser(null);
          setUser(null);
        }
      } catch {
        console.error(`[AuthProvider:onAuthStateChange] failed during ${event}. Clearing local auth state.`);
        try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
        setSupabaseUser(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        void handleAuthChange(event, session);
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (data: { name: string; email: string; password: string; faculty: string }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name, faculty: data.faculty },
      },
    });

    if (error) return { success: false, error: error.message };
    if (authData.user) {
      setSupabaseUser(authData.user);
      const profile = await ensureProfile(authData.user, {
        name: data.name,
        email: data.email,
        faculty: data.faculty,
      });
      if (!profile) {
        return {
          success: false,
          error: "Account created, but your profile could not be initialized. Re-run your database schema and try signing in again.",
        };
      }
    }
    return { success: true };
  };

  const signIn = async (email: string, password: string) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { success: false, error: error.message };
    if (authData.user) {
      setSupabaseUser(authData.user);
      const profile = await ensureProfile(authData.user);
      if (!profile) {
        return {
          success: false,
          error: "We couldn't load your profile. Re-run your database schema to restore the profiles trigger, then try again.",
        };
      }
    }
    return { success: true };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const refreshProfile = async () => {
    if (supabaseUser) {
      await ensureProfile(supabaseUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, supabaseUser, isLoading, signUp, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
