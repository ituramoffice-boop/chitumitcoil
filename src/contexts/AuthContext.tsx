import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
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

  const fetchRoleAndProfession = async (userId: string, accessToken: string, attempt = 0): Promise<void> => {
    try {
      const authedClient = createClient<Database>(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        },
      );
      const [roleRes, profileRes] = await Promise.all([
        authedClient.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        authedClient.from("profiles").select("profession").eq("user_id", userId).maybeSingle(),
      ]);
      if (roleRes.data) {
        setRole(roleRes.data.role as AppRole);
      } else if (attempt < 2) {
        // Retry — race with token propagation can yield 0 rows under RLS
        await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
        return fetchRoleAndProfession(userId, accessToken, attempt + 1);
      }
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
