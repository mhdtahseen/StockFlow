import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";
import posthog from "@/lib/posthog";
import { toast } from "sonner";
import { persistor, store, RESET_STORE } from "@/app/store";

export interface FeatureFlagEntry {
  enabled_globally: boolean;
  tenant_overrides: Record<string, boolean>;
}

export type FeatureFlagMap = Record<string, FeatureFlagEntry>;

export interface TenantInfo {
  id: string;
  name: string;
  plan: string;
  planExpiresAt: string | null;
  tradeCode?: string;
  address?: string;
  gstin?: string;
  phone?: string;
  logoUrl?: string;
  stateCode?: string;
  isActive: boolean;
  suspendedUntil: string | null;
  paymentFailedAt: string | null;
  planHaltedAt: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  tenant: TenantInfo | null;
  featureFlags: FeatureFlagMap | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: string | null;
  /** undefined = still loading; null = not completed; string = ISO timestamp */
  onboardingCompletedAt: string | null | undefined;
  signOut: () => Promise<void>;
  refreshTenant: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagMap | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  // undefined = not yet fetched; null = fetched but not completed; string = completed timestamp
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState<string | null | undefined>(undefined);
  const [isTenantLoading, setIsTenantLoading] = useState(false);

  const fetchFeatureFlags = async () => {
    try {
      const { data } = await supabase
        .from("feature_flags")
        .select("flag_key, enabled_globally, tenant_overrides");
      if (data) {
        const map: FeatureFlagMap = {};
        for (const row of data) {
          map[row.flag_key] = {
            enabled_globally: row.enabled_globally,
            tenant_overrides: row.tenant_overrides ?? {},
          };
        }
        setFeatureFlags(map);
      }
    } catch (err) {
      console.error("Error fetching feature flags:", err);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, onboarding_completed_at")
        .eq("id", user.id)
        .single();
      if (data) {
        setFullName(data.full_name);
        setAvatarUrl(data.avatar_url);
        setOnboardingCompletedAt(data.onboarding_completed_at ?? null);
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  const markOnboardingComplete = async () => {
    // Optimistic update first — prevents redirect loop in OnboardingGate
    const ts = new Date().toISOString();
    setOnboardingCompletedAt(ts);
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed_at: ts })
        .eq("id", user.id);
    } catch (err) {
      console.error("Error marking onboarding complete:", err);
    }
  };

  const fetchTenant = async (tenantId: string) => {
    setIsTenantLoading(true);
    try {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id, name, plan, plan_expires_at, address, gstin, phone, logo_url, state_code, is_active, suspended_until, trade_code, payment_failed_at, plan_halted_at")
        .eq("id", tenantId)
        .single();
      if (tenantData) {
        setTenant({
          id: tenantData.id,
          name: tenantData.name,
          plan: tenantData.plan,
          planExpiresAt: tenantData.plan_expires_at,
          tradeCode: tenantData.trade_code ?? undefined,
          address: tenantData.address,
          gstin: tenantData.gstin,
          phone: tenantData.phone,
          logoUrl: tenantData.logo_url ?? undefined,
          stateCode: tenantData.state_code ?? undefined,
          isActive: tenantData.is_active,
          suspendedUntil: tenantData.suspended_until,
          paymentFailedAt: tenantData.payment_failed_at,
          planHaltedAt: tenantData.plan_halted_at,
        });
      }
    } catch (err) {
      console.error("Error fetching tenant:", err);
    } finally {
      setIsTenantLoading(false);
    }
  };

  const refreshTenant = async () => {
    if (!user) return;

    // Try to get tenant_id from metadata first, then fall back to profiles table
    let tenantId = user.user_metadata.tenant_id;

    if (!tenantId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      if (profile?.tenant_id) {
        tenantId = profile.tenant_id;
      }
    }

    if (tenantId) {
      await fetchTenant(tenantId);
    }
  };

  /**
   * Purge ALL persisted state — localStorage flags, React Query cache, Redux
   * persist, Capacitor Preferences, and Supabase auth keys. Prevents stale
   * data from a prior login from causing infinite-loading bugs on native.
   */
  const purgeAllPersistedState = async () => {
    localStorage.removeItem("finventree_auth");
    localStorage.removeItem("persist:finventree-root");
    localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");

    // Remove all Supabase auth keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-")) {
        localStorage.removeItem(key);
      }
    }

    // Clear Capacitor Preferences (native persisted Redux store)
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        await Preferences.remove({ key: "persist:finventree-root" });
      } catch {
        // Preferences plugin may not be available
      }
    }
  };

  const initialized = React.useRef(false);
  const initDone = React.useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function initializeAuth() {
      try {
        // Wrap getSession in a 10s timeout — on native cold starts the WebView
        // networking stack may not be ready, causing an indefinite hang.
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000)),
        ]);

        if (!sessionResult) {
          // Timeout: treat as no session — user will land on login
          console.warn("Auth init: getSession timed out after 10s");
          await purgeAllPersistedState();
          setSession(null);
          setUser(null);
          return;
        }

        const s = sessionResult.data.session;
        setSession(s);
        setUser(s?.user || null);

        if (s?.user) {
          localStorage.setItem("finventree_auth", "true");
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, tenant_id, full_name, avatar_url, onboarding_completed_at")
            .eq("id", s.user.id)
            .single();

          if (profile) {
            setFullName(profile.full_name);
            setAvatarUrl(profile.avatar_url);
            setRole(profile.role);
            setOnboardingCompletedAt(profile.onboarding_completed_at ?? null);
            setIsSuperAdmin(profile.role === "super-admin");
            setIsAdmin(profile.role === "admin" || profile.role === "super-admin");
            if (profile.tenant_id) await fetchTenant(profile.tenant_id);
            await fetchFeatureFlags();
          }
        } else {
          // No valid session — purge ALL persisted state (Redux, React Query, outbox)
          // to prevent stale data from a previous login from blocking the app.
          await purgeAllPersistedState();
        }
      } catch (error) {
        console.error("Auth init error:", error);
        // On failure (network error, etc.) clear auth flags so user isn't stuck
        await purgeAllPersistedState();
      } finally {
        initDone.current = true;
        setIsLoading(false);
      }
    }

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        try {
          if (event === 'SIGNED_OUT') {
            localStorage.removeItem("finventree_auth");
            localStorage.removeItem("persist:finventree-root");
            setSession(null);
            setUser(null);
            setIsSuperAdmin(false);
            setIsAdmin(false);
            setTenant(null);
            setFeatureFlags(null);
            setFullName(null);
            setAvatarUrl(null);
            setRole(null);
            setOnboardingCompletedAt(undefined);
            posthog.reset();
          } else if (newSession) {
            // During initial auth, initializeAuth handles session loading.
            // Skip here to prevent a race where both paths fetch the profile
            // concurrently and toggle isLoading unpredictably.
            if (event === 'SIGNED_IN' && !initDone.current) return;
            // Only show the full-page loading spinner for a fresh sign-in
            // (after init). TOKEN_REFRESHED / USER_UPDATED events should not
            // block the UI — the profile is already loaded.
            if (event === 'SIGNED_IN') setIsLoading(true);
            setSession(newSession);
            setUser(newSession.user);
            localStorage.setItem("finventree_auth", "true");
            
            const { data: profile } = await supabase
              .from("profiles")
              .select("role, tenant_id, full_name, avatar_url, onboarding_completed_at")
              .eq("id", newSession.user.id)
              .single();

            if (profile) {
              setFullName(profile.full_name);
              setAvatarUrl(profile.avatar_url);
              setRole(profile.role);
              setOnboardingCompletedAt(profile.onboarding_completed_at ?? null);
              setIsSuperAdmin(profile.role === "super-admin");
              setIsAdmin(profile.role === "admin" || profile.role === "super-admin");
              const tid = newSession.user.user_metadata.tenant_id || profile.tenant_id;
              if (tid) await fetchTenant(tid);
              await fetchFeatureFlags();
              posthog.identify(newSession.user.id, {
                email: newSession.user.email,
                role: profile.role,
                tenant_id: tid ?? null,
              });
            }
          }
        } catch (err) {
          console.error("onAuthStateChange error:", err);
        } finally {
          setIsLoading(false);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || !tenant) return;
    const interval = setInterval(
      async () => {
        const { data } = await supabase
          .from("tenants")
          .select("plan, plan_expires_at, is_active, suspended_until")
          .eq("id", tenant.id)
          .single();
        if (data && (data.plan !== tenant.plan || data.is_active !== tenant.isActive)) {
          setTenant((prev) =>
            prev
              ? {
                  ...prev,
                  plan: data.plan,
                  planExpiresAt: data.plan_expires_at,
                  isActive: data.is_active,
                  suspendedUntil: data.suspended_until,
                }
              : null,
          );
          if (data.is_active !== tenant.isActive) {
            toast.error(data.is_active ? "Access Restored" : "Access Revoked");
          } else {
            toast.info("Your subscription has been updated.");
          }
        }
        // Also refresh feature flags on the periodic poll
        await fetchFeatureFlags();
      },
      15 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [session, tenant?.id, tenant?.plan]);

  const signOut = async () => {
    // 1. Clear localStorage auth flag FIRST — ProtectedRoute reads this synchronously.
    // If this isn't cleared before the first React re-render, the guard passes and the
    // user stays on the dashboard instead of redirecting to /login.
    try {
      localStorage.removeItem("finventree_auth");
      localStorage.removeItem("persist:finventree-root");
      localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-")) {
          localStorage.removeItem(key);
        }
      }
    } catch (err) {
      console.warn("Failed to clear localStorage items:", err);
    }

    // 2. Reset local React State to trigger re-render and router redirect.
    // setIsLoading(false) is critical: if a SIGNED_IN handler was mid-flight
    // (fetching profile on Android), isLoading would be true. With hasLocalFlag
    // cleared in step 1, ProtectedRoute would show the spinner indefinitely.
    try {
      setIsLoading(false);
      setSession(null);
      setUser(null);
      setIsSuperAdmin(false);
      setIsAdmin(false);
      setTenant(null);
      setFeatureFlags(null);
      setFullName(null);
      setAvatarUrl(null);
      setRole(null);
      setOnboardingCompletedAt(undefined);
      posthog.reset();
    } catch (err) {
      console.warn("Failed to reset auth state locally:", err);
    }

    // 3. Sign out from Supabase immediately after state reset.
    // This fires SIGNED_OUT locally (clearing the Supabase client session)
    // BEFORE any async cleanup, preventing a concurrent token refresh from
    // restoring the session during cleanup steps 4–6.
    // Wrapped in a 5s timeout so a slow/offline network can't block cleanup.
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise<void>((resolve) => setTimeout(resolve, 5000)),
      ]);
    } catch (err) {
      console.error("Failed to sign out from Supabase:", err);
    }

    // 4. Clear the module-level tenant ID cache so next user doesn't inherit it (A-002)
    try {
      const supabaseApi = await import('@/app/supabaseApi');
      supabaseApi.clearTenantCache?.();
    } catch (err) {
      console.warn("Failed to clear tenant cache:", err);
    }

    // 5. Reset in-memory Redux state immediately (prevents old tenant data showing)
    try {
      store.dispatch({ type: RESET_STORE });
    } catch (err) {
      console.warn("Failed to reset Redux store:", err);
    }

    // 6. Clear Capacitor Preferences store directly (covers native platform storage)
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key: "persist:finventree-root" });
    } catch (err) {
      console.warn("Failed to clear Capacitor preferences:", err);
    }

    // 7. Purge the Redux persistor
    try {
      await persistor.purge();
    } catch (err) {
      console.warn("Failed to purge persistor:", err);
    }

    // (supabase.auth.signOut() already called in step 3)
  };



  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAdmin,
        isSuperAdmin,
        isLoading: isLoading || isTenantLoading,
        tenant,
        featureFlags,
        fullName,
        avatarUrl,
        role,
        onboardingCompletedAt,
        signOut,
        refreshTenant,
        refreshProfile,
        markOnboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
