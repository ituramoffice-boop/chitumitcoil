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
  profession: null,
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
  const [profession, setProfession] = useState<Profession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleAndProfession = async (userId: string) => {
    try {
      const [roleRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
        supabase.from("profiles").select("profession").eq("user_id", userId).single(),
      ]);
      if (roleRes.data) setRole(roleRes.data.role as AppRole);
      if (profileRes.data) setProfession((profileRes.data as any).profession as Profession);
    } catch (e) {
      console.error("Failed to fetch role/profession:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoleAndProfession(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchRoleAndProfession(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setRole(null);
          setProfession(null);
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
    setProfession(null);
  };

  // Demo mode overrides
  const effectiveUser = isDemoMode ? DEMO_USER : user;
  const effectiveRole = isDemoMode ? (demoRole as AppRole) : role;
  const effectiveProfession = isDemoMode ? ("mortgage_advisor" as Profession) : profession;
  const effectiveLoading = isDemoMode ? false : loading;

  return (
    <AuthContext.Provider value={{ user: effectiveUser, session, role: effectiveRole, profession: effectiveProfession, loading: effectiveLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
