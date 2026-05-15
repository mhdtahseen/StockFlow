import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import posthog from "@/lib/posthog";
import { toast } from "sonner";

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
  address?: string;
  gstin?: string;
  phone?: string;
  isActive: boolean;
  suspendedUntil: string | null;
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
  signOut: () => Promise<void>;
  refreshTenant: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) {
        setFullName(data.full_name);
        setAvatarUrl(data.avatar_url);
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  const fetchTenant = async (tenantId: string) => {
    setIsTenantLoading(true);
    try {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id, name, plan, plan_expires_at, address, gstin, phone, is_active, suspended_until")
        .eq("id", tenantId)
        .single();
      if (tenantData) {
        setTenant({
          id: tenantData.id,
          name: tenantData.name,
          plan: tenantData.plan,
          planExpiresAt: tenantData.plan_expires_at,
          address: tenantData.address,
          gstin: tenantData.gstin,
          phone: tenantData.phone,
          isActive: tenantData.is_active,
          suspendedUntil: tenantData.suspended_until,
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
            .select("role, tenant_id, full_name, avatar_url")
            .eq("id", s.user.id)
            .single();

          if (profile) {
            setFullName(profile.full_name);
            setAvatarUrl(profile.avatar_url);
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
          posthog.reset();
        } else if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          localStorage.setItem("finventree_auth", "true");
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, tenant_id, full_name, avatar_url")
            .eq("id", newSession.user.id)
            .single();

          if (profile) {
            setFullName(profile.full_name);
            setAvatarUrl(profile.avatar_url);
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
    // Clear the module-level tenant ID cache so next user doesn't inherit it (A-002)
    import('@/app/supabaseApi').then(m => m.clearTenantCache?.());
    await supabase.auth.signOut();
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
        signOut,
        refreshTenant,
        refreshProfile,
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
