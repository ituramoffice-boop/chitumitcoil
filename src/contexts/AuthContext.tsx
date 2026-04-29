import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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
  const fetchedForUserRef = useRef<string | null>(null);
  const roleFetchPromiseRef = useRef<Promise<void> | null>(null);
  const roleFetchUserRef = useRef<string | null>(null);

  const fetchRoleAndProfession = async (userId: string): Promise<void> => {
    if (fetchedForUserRef.current === userId) return;
    if (roleFetchPromiseRef.current && roleFetchUserRef.current === userId) {
      return roleFetchPromiseRef.current;
    }

    roleFetchUserRef.current = userId;
    roleFetchPromiseRef.current = (async () => {
      // Use the global authenticated client — it sends the user's JWT automatically.
      const [roleRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("profession").eq("user_id", userId).maybeSingle(),
      ]);
      if (roleRes.error) throw roleRes.error;
      if (profileRes.error) throw profileRes.error;
      setRole((roleRes.data?.role as AppRole) ?? null);
      setProfession(((profileRes.data as any)?.profession as Profession) ?? null);
      fetchedForUserRef.current = userId;
    })()
      .catch((e) => {
        console.error("Failed to fetch role/profession:", e);
      })
      .finally(() => {
        if (roleFetchUserRef.current === userId) {
          roleFetchPromiseRef.current = null;
          roleFetchUserRef.current = null;
        }
      });

    return roleFetchPromiseRef.current;
  };

  useEffect(() => {
    let mounted = true;

    // Set up listener FIRST (Supabase best practice) — synchronous state updates only.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_OUT" || !newSession?.user) {
        fetchedForUserRef.current = null;
        roleFetchPromiseRef.current = null;
        roleFetchUserRef.current = null;
        setRole(null);
        setProfession(null);
        setLoading(false);
        return;
      }

      // Token refresh: keep existing role/profession and never trigger a route denial.
      if (event === "TOKEN_REFRESHED" && fetchedForUserRef.current === newSession.user.id) {
        setLoading(false);
        return;
      }

      // SIGNED_IN / INITIAL_SESSION — defer DB call to avoid deadlock with auth lock.
      if (fetchedForUserRef.current !== newSession.user.id) {
        setLoading(true);
        setTimeout(() => {
          if (!mounted) return;
          fetchRoleAndProfession(newSession.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        }, 0);
      } else {
        setLoading(false);
      }
    });

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
