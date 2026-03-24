import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDemo } from "@/contexts/DemoContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Detects if the current logged-in user landed on a page with ?ref= 
 * pointing to a different advisor, and checks if a sync already exists.
 * Returns the advisor info + whether to show the consent modal.
 */
export function useAdvisorSync() {
  const { user, role } = useAuth();
  const { isDemoMode } = useDemo();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [advisorId, setAdvisorId] = useState<string | null>(null);
  const [advisorName, setAdvisorName] = useState<string | null>(null);

  useEffect(() => {
    if (!user || role !== "client") return;

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref || ref === user.id) return;

    // In demo mode, show modal immediately with mock data
    if (isDemoMode) {
      setAdvisorId(ref);
      setAdvisorName("יועץ דמו");
      setShowSyncModal(true);
      return;
    }

    // Check if sync already exists
    (async () => {
      try {
        const { data: existing } = await supabase
          .from("advisor_client_sync" as any)
          .select("id, status")
          .eq("client_user_id", user.id)
          .eq("advisor_user_id", ref)
          .maybeSingle();

        if (existing && (existing as any).status === "active") return; // already synced

        // Fetch advisor name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", ref)
          .maybeSingle();

        setAdvisorId(ref);
        setAdvisorName(profile?.full_name || null);
        setShowSyncModal(true);
      } catch (err) {
        console.error("Advisor sync check failed:", err);
      }
    })();
  }, [user, role, isDemoMode]);

  return { showSyncModal, setShowSyncModal, advisorId, advisorName };
}
