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
  signOut: () => Promise<void>;
  refreshTenant: () => Promise<void>;
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
  const [isTenantLoading, setIsTenantLoading] = useState(false);

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
              .select("role, tenant_id")
              .eq("id", s.user.id)
              .single();

            if (error) {
              console.error("Error fetching initial profile:", error);
            }

            if (profile) {
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
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);

        const updateRoles = async () => {
          if (newSession?.user) {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", newSession.user.id)
              .single();

            if (error) {
              console.error("Error fetching profile:", error);
            }

            if (profile) {
              const profileRole = profile.role;
              setIsSuperAdmin(profileRole === "super-admin");
              setIsAdmin(
                profileRole === "admin" || profileRole === "super-admin",
              );
            } else {
              setIsSuperAdmin(false);
              setIsAdmin(false);
            }
          } else {
            setIsSuperAdmin(false);
            setIsAdmin(false);
          }
          // Set loading to false only after roles are determined
          setIsLoading(false);
        };
        updateRoles();

        if (newSession) {
          localStorage.setItem("stockflow_auth", "true");
          // If we haven't fetched it yet (e.g. login event) and we have tenant_id
          if (newSession.user.user_metadata.tenant_id && !tenant) {
            fetchTenant(newSession.user.user_metadata.tenant_id);
          }
        } else {
          localStorage.removeItem("stockflow_auth");
          localStorage.removeItem("persist:stockflow-root");
          setTenant(null);
        }
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
        signOut,
        refreshTenant,
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
