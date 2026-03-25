import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useDemo } from "@/contexts/DemoContext";

type AppRole = "consultant" | "client" | "admin";
type Profession = "mortgage_advisor" | "insurance_agent";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profession: Profession | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const DEMO_USER: User = {
  id: "demo-user-000",
  email: "demo@chitumit.co.il",
  app_metadata: {},
  user_metadata: { full_name: "משתמש דמו" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isDemoMode, demoRole } = useDemo();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      if (data) setRole(data.role as AppRole);
    } catch (e) {
      console.error("Failed to fetch role:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    // First get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // Then listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchRole(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  // Demo mode overrides
  const effectiveUser = isDemoMode ? DEMO_USER : user;
  const effectiveRole = isDemoMode ? (demoRole as AppRole) : role;
  const effectiveLoading = isDemoMode ? false : loading;

  return (
    <AuthContext.Provider value={{ user: effectiveUser, session, role: effectiveRole, loading: effectiveLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
