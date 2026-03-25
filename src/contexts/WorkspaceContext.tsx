import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { checkSubscription, getTierByProductId, type StripeTierKey } from "@/lib/stripe";

type BusinessType = "solo" | "agency";

interface WorkspaceContextType {
  businessType: BusinessType;
  setBusinessType: (type: BusinessType) => Promise<void>;
  isAgency: boolean;
  loading: boolean;
  subscriptionTier: StripeTierKey | null;
  isSubscribed: boolean;
  subscriptionEnd: string | null;
  refreshSubscription: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  businessType: "solo",
  setBusinessType: async () => {},
  isAgency: false,
  loading: true,
  subscriptionTier: null,
  isSubscribed: false,
  subscriptionEnd: null,
  refreshSubscription: async () => {},
});

export const useWorkspace = () => useContext(WorkspaceContext);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businessType, setBusinessTypeState] = useState<BusinessType>("solo");
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<StripeTierKey | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const refreshSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const data = await checkSubscription();
      setIsSubscribed(data.subscribed);
      setSubscriptionEnd(data.subscription_end);
      setSubscriptionTier(data.product_id ? getTierByProductId(data.product_id) : null);
    } catch (e) {
      console.error("Failed to check subscription:", e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("business_type")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.business_type) {
          setBusinessTypeState(data.business_type as BusinessType);
        }
        setLoading(false);
      });

    refreshSubscription();
  }, [user, refreshSubscription]);

  // Auto-refresh subscription every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshSubscription, 60_000);
    return () => clearInterval(interval);
  }, [user, refreshSubscription]);

  const setBusinessType = async (type: BusinessType) => {
    if (!user) return;
    setBusinessTypeState(type);
    await supabase
      .from("profiles")
      .update({ business_type: type } as any)
      .eq("user_id", user.id);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        businessType,
        setBusinessType,
        isAgency: businessType === "agency",
        loading,
        subscriptionTier,
        isSubscribed,
        subscriptionEnd,
        refreshSubscription,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
