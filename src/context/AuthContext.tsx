import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface TenantInfo {
  id: string;
  name: string;
  plan: string;
  planExpiresAt: string | null;
  address?: string;
  gstin?: string;
  phone?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  tenant: TenantInfo | null;
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
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isTenantLoading, setIsTenantLoading] = useState(false);

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
        .select("id, name, plan, plan_expires_at, address, gstin, phone")
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

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          const s = data.session;
          setSession(s);
          setUser(s?.user || null);
          // Fetch real-time roles from profiles table
          if (s?.user) {
            localStorage.setItem("stockflow_auth", "true");
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("role, tenant_id, full_name, avatar_url")
              .eq("id", s.user.id)
              .single();

            if (error) {
              console.error("Error fetching initial profile:", error);
            }

            if (profile) {
              setFullName(profile.full_name);
              setAvatarUrl(profile.avatar_url);
              const profileRole = profile.role;
              setIsSuperAdmin(profileRole === "super-admin");
              setIsAdmin(
                profileRole === "admin" || profileRole === "super-admin",
              );

              if (profile.tenant_id) {
                await fetchTenant(profile.tenant_id);
              }
            } else {
              setIsSuperAdmin(false);
              setIsAdmin(false);
            }
          } else {
            localStorage.removeItem("stockflow_auth");
            localStorage.removeItem("persist:stockflow-root");
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          localStorage.setItem("stockflow_auth", "true");
          
          // Fetch real-time roles and tenant ID from profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, tenant_id, full_name, avatar_url")
            .eq("id", newSession.user.id)
            .single();

          if (profile) {
            setFullName(profile.full_name);
            setAvatarUrl(profile.avatar_url);
            const profileRole = profile.role;
            setIsSuperAdmin(profileRole === "super-admin");
            setIsAdmin(profileRole === "admin" || profileRole === "super-admin");

            // Prioritize metadata tenant_id, then profile fallback
            const tid = newSession.user.user_metadata.tenant_id || profile.tenant_id;
            if (tid) {
              await fetchTenant(tid);
            }
          }
        } else {
          localStorage.removeItem("stockflow_auth");
          localStorage.removeItem("persist:stockflow-root");
          setIsSuperAdmin(false);
          setIsAdmin(false);
          setTenant(null);
          setFullName(null);
          setAvatarUrl(null);
        }
        setIsLoading(false);
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || !tenant) return;
    const interval = setInterval(
      async () => {
        const { data } = await supabase
          .from("tenants")
          .select("plan, plan_expires_at")
          .eq("id", tenant.id)
          .single();
        if (data && data.plan !== tenant.plan) {
          setTenant((prev) =>
            prev
              ? {
                  ...prev,
                  plan: data.plan,
                  planExpiresAt: data.plan_expires_at,
                }
              : null,
          );
          toast.info("Your subscription has been updated.");
        }
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
