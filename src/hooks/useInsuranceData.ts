import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useInsuranceClients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["insurance-clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useInsurancePolicies() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["insurance-policies", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_policies")
        .select("*, insurance_clients(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddInsuranceClient() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: {
      full_name: string;
      phone?: string;
      email?: string;
      id_number?: string;
      city?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("insurance_clients")
        .insert({ ...client, agent_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insurance-clients"] });
      toast.success("הלקוח נוסף בהצלחה");
    },
    onError: () => toast.error("שגיאה בהוספת הלקוח"),
  });
}

export function useAddInsurancePolicy() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (policy: {
      client_id: string;
      policy_type: string;
      insurance_company?: string;
      monthly_premium?: number;
      coverage_amount?: number;
      policy_number?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("insurance_policies")
        .insert({ ...policy, agent_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insurance-policies"] });
      toast.success("הפוליסה נוספה בהצלחה");
    },
    onError: () => toast.error("שגיאה בהוספת הפוליסה"),
  });
}
