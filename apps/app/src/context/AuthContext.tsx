import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
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

  const initialized = React.useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function initializeAuth() {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
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
          localStorage.removeItem("finventree_auth");
          localStorage.removeItem("persist:finventree-root");
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
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
          // Only show the full-page loading spinner for a fresh sign-in.
          // TOKEN_REFRESHED / USER_UPDATED events carry a session but should
          // not block the UI — the profile is already loaded.
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
        setIsLoading(false);
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
    // 1. Reset local React State immediately to trigger re-render and router navigation instantly
    try {
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

    // 2. Clear the module-level tenant ID cache so next user doesn't inherit it (A-002)
    try {
      const supabaseApi = await import('@/app/supabaseApi');
      supabaseApi.clearTenantCache?.();
    } catch (err) {
      console.warn("Failed to clear tenant cache:", err);
    }

    // 3. Reset in-memory Redux state immediately (prevents old tenant data showing)
    try {
      store.dispatch({ type: RESET_STORE });
    } catch (err) {
      console.warn("Failed to reset Redux store:", err);
    }

    // 4. Clear auth flags, React Query cache, and all Supabase local storage keys immediately
    try {
      localStorage.removeItem("finventree_auth");
      localStorage.removeItem("persist:finventree-root");
      localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
      
      // Clean up all Supabase auth keys from localStorage to prevent auto-login on restart
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-")) {
          localStorage.removeItem(key);
        }
      }
    } catch (err) {
      console.warn("Failed to clear localStorage items:", err);
    }

    // 5. Clear Capacitor Preferences store directly (covers native platform storage)
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key: "persist:finventree-root" });
    } catch (err) {
      console.warn("Failed to clear Capacitor preferences:", err);
    }

    // 6. Purge the Redux persistor (runs, but failure does not block signout flow)
    try {
      await persistor.purge();
    } catch (err) {
      console.warn("Failed to purge persistor:", err);
    }

    // 7. Sign out from Supabase (revokes session token)
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Failed to sign out from Supabase:", err);
    }
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
