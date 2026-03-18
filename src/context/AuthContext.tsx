import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface TenantInfo {
  id: string;
  name: string;
  plan: string;
  planExpiresAt: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  tenant: TenantInfo | null;
  signOut: () => Promise<void>;
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

  useEffect(() => {
    let mounted = true;

    async function fetchTenant(tenantId: string) {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id, name, plan, plan_expires_at")
        .eq("id", tenantId)
        .single();
      if (tenantData && mounted) {
        setTenant({
          id: tenantData.id,
          name: tenantData.name,
          plan: tenantData.plan,
          planExpiresAt: tenantData.plan_expires_at,
        });
      }
    }

    async function getInitialSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          const s = data.session;
          setSession(s);
          setUser(s?.user || null);
          
          const role = s?.user?.user_metadata?.role;
          setIsSuperAdmin(role === 'super-admin');
          setIsAdmin(role === 'admin' || role === 'super-admin');

          if (s) {
            localStorage.setItem("stockflow_auth", "true");
            if (s.user.user_metadata.tenant_id) {
              await fetchTenant(s.user.user_metadata.tenant_id);
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
        
        const role = newSession?.user?.user_metadata?.role;
        setIsSuperAdmin(role === 'super-admin');
        setIsAdmin(role === 'admin' || role === 'super-admin');

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
              ? { ...prev, plan: data.plan, planExpiresAt: data.plan_expires_at }
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
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isSuperAdmin, isLoading, tenant, signOut }}>
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
