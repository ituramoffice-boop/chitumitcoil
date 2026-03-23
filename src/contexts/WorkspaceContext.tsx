import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type BusinessType = "solo" | "agency";

interface WorkspaceContextType {
  businessType: BusinessType;
  setBusinessType: (type: BusinessType) => Promise<void>;
  isAgency: boolean;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  businessType: "solo",
  setBusinessType: async () => {},
  isAgency: false,
  loading: true,
});

export const useWorkspace = () => useContext(WorkspaceContext);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businessType, setBusinessTypeState] = useState<BusinessType>("solo");
  const [loading, setLoading] = useState(true);

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
  }, [user]);

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
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
