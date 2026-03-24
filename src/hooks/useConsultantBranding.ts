import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ConsultantBranding {
  consultantId: string;
  fullName: string | null;
  logoUrl: string | null;
  whatsappPhone: string | null;
  plan: string;
}

/**
 * Hook that reads ?ref= from the URL and fetches consultant branding.
 * Falls back to DEFAULT_CONSULTANT_ID when no ref is present.
 */
export function useConsultantBranding(defaultConsultantId: string) {
  const [branding, setBranding] = useState<ConsultantBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || defaultConsultantId;

    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, full_name, logo_url, whatsapp_phone, plan")
          .eq("user_id", ref)
          .maybeSingle();

        if (data) {
          setBranding({
            consultantId: data.user_id,
            fullName: data.full_name,
            logoUrl: (data as any).logo_url,
            whatsappPhone: (data as any).whatsapp_phone,
            plan: (data as any).plan || "free",
          });
        } else {
          setBranding({
            consultantId: ref,
            fullName: null,
            logoUrl: null,
            whatsappPhone: null,
            plan: "free",
          });
        }
      } catch {
        setBranding({
          consultantId: ref,
          fullName: null,
          logoUrl: null,
          whatsappPhone: null,
          plan: "free",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [defaultConsultantId]);

  return { branding, loading };
}

/** Plan lead limits */
export const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  pro: 100,
  enterprise: Infinity,
};
