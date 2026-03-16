import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
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
          
          const role = s?.user?.user_metadata?.role;
          setIsSuperAdmin(role === 'super-admin');
          setIsAdmin(role === 'admin' || role === 'super-admin');

          if (s) {
            localStorage.setItem("stockflow_auth", "true");
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
        } else {
          localStorage.removeItem("stockflow_auth");
          localStorage.removeItem("persist:stockflow-root");
        }
        setIsLoading(false);
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isSuperAdmin, isLoading, signOut }}>
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
