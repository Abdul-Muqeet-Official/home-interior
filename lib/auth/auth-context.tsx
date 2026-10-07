"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/client";

export interface CustomerProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: CustomerProfile | null;
  role: "admin" | "editor" | "customer" | null;
  isAdmin: boolean;
  loading: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; role?: "admin" | "customer" }>;
  signInWithOAuth: (provider: "google" | "facebook" | "instagram") => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata: { fullName?: string; phone?: string; address?: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; success?: boolean }>;
  updatePassword: (password: string) => Promise<{ error?: string; success?: boolean }>;
  updateProfile: (profile: Partial<CustomerProfile>) => Promise<{ error?: string; success?: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const role: "admin" | "editor" | "customer" | null = user
    ? (user.app_metadata?.role ||
        user.user_metadata?.role ||
        (user.email === "sulemanrashid115@gmail.com" ? "admin" : "customer"))
    : null;

  const isAdmin = Boolean(
    role === "admin" || (user && user.email === "sulemanrashid115@gmail.com")
  );

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      startTransition(() => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          syncProfileFromUser(session.user);
        }
        setLoading(false);
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      startTransition(() => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          syncProfileFromUser(session.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const syncProfileFromUser = (u: User) => {
    const meta = u.user_metadata || {};
    setProfile({
      id: u.id,
      email: u.email || "",
      fullName: meta.full_name || meta.fullName || "",
      phone: meta.phone || "",
      address: meta.address || "",
    });
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { error: "Authentication is not configured on this server." };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return { error: error.message };
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        syncProfileFromUser(data.user);

        const uRole = data.user.app_metadata?.role || data.user.user_metadata?.role;
        const isUserAdmin = uRole === "admin" || data.user.email === "sulemanrashid115@gmail.com";
        const resolvedRole: "admin" | "customer" = isUserAdmin ? "admin" : "customer";
        return { role: resolvedRole };
      }
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Sign-in failed." };
    }
  };

  /**
   * Supabase OAuth Integration:
   * To enable Google, Facebook, or Instagram sign-ins in production:
   * 1. Navigate to your Supabase Project Dashboard -> Authentication -> Providers.
   * 2. Toggle "Google" to Enabled and enter your Google OAuth Client ID & Secret
   *    (from Google Cloud Console -> APIs & Services -> Credentials).
   *    Add your Supabase redirect URI: https://<project-ref>.supabase.co/auth/v1/callback
   * 3. Toggle "Facebook" to Enabled and enter your Meta App ID & Secret
   *    (from Meta for Developers -> Facebook Login).
   * 4. For Instagram, use Meta's Facebook Login integration with Instagram permissions.
   */
  const signInWithOAuth = async (provider: "google" | "facebook" | "instagram") => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { error: "Authentication is not configured on this server." };

    try {
      // Instagram uses Facebook/Meta OAuth in Supabase
      const oauthProvider = provider === "instagram" ? "facebook" : provider;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: oauthProvider as "google" | "facebook",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const errorMsg = error.message || String(error);
        const isUnsupported =
          errorMsg.toLowerCase().includes("not enabled") ||
          errorMsg.toLowerCase().includes("unsupported provider") ||
          errorMsg.toLowerCase().includes("validation_failed");

        if (isUnsupported) {
          const providerName =
            provider === "google"
              ? "Google"
              : provider === "facebook"
              ? "Facebook"
              : "Instagram";
          return {
            error: `This social provider (${providerName}) is currently being configured by the studio. Please use Email/Password or Admin access in the meantime.`,
            isProviderDisabled: true,
          };
        }
        return { error: errorMsg };
      }
      return {};
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isUnsupported =
        errorMsg.toLowerCase().includes("not enabled") ||
        errorMsg.toLowerCase().includes("unsupported provider") ||
        errorMsg.toLowerCase().includes("validation_failed");

      if (isUnsupported) {
        const providerName =
          provider === "google"
            ? "Google"
            : provider === "facebook"
            ? "Facebook"
            : "Instagram";
        return {
          error: `This social provider (${providerName}) is currently being configured by the studio. Please use Email/Password or Admin access in the meantime.`,
          isProviderDisabled: true,
        };
      }
      return { error: errorMsg || "Social login failed." };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { fullName?: string; phone?: string; address?: string }
  ) => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { error: "Authentication is not configured on this server." };

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: metadata.fullName || "",
            phone: metadata.phone || "",
            address: metadata.address || "",
          },
        },
      });

      if (error) return { error: error.message };
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        syncProfileFromUser(data.user);
      }
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Sign-up failed." };
    }
  };

  const signOut = async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch {
      // Ignored
    }
  };

  const resetPassword = async (email: string) => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { error: "Authentication is not configured on this server." };

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
      return { success: true };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Reset request failed." };
    }
  };

  const updatePassword = async (password: string) => {
    const supabase = getBrowserSupabase();
    if (!supabase) return { error: "Authentication is not configured on this server." };

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      return { success: true };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Password update failed." };
    }
  };

  const updateProfile = async (patch: Partial<CustomerProfile>) => {
    const supabase = getBrowserSupabase();
    if (!supabase || !user) return { error: "Must be logged in to update profile." };

    try {
      const meta = {
        ...(user.user_metadata || {}),
        ...(patch.fullName !== undefined ? { full_name: patch.fullName } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.address !== undefined ? { address: patch.address } : {}),
      };

      const { data, error } = await supabase.auth.updateUser({ data: meta });
      if (error) return { error: error.message };
      if (data.user) {
        setUser(data.user);
        syncProfileFromUser(data.user);
      }
      return { success: true };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Profile update failed." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAdmin,
        loading,
        isLoading: loading,
        signIn,
        signInWithOAuth,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
