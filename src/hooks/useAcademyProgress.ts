import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAcademyProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: completedModules = [], isLoading } = useQuery({
    queryKey: ["academy-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_progress" as any)
        .select("module_id, completed_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data as any[]).map((r) => r.module_id as string);
    },
    enabled: !!user,
  });

  const markComplete = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase
        .from("academy_progress" as any)
        .insert({ user_id: user!.id, module_id: moduleId } as any);
      if (error && error.code !== "23505") throw error; // ignore duplicate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-progress", user?.id] });
    },
  });

  const unmarkComplete = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase
        .from("academy_progress" as any)
        .delete()
        .eq("user_id", user!.id)
        .eq("module_id", moduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-progress", user?.id] });
    },
  });

  const isCompleted = (moduleId: string) => completedModules.includes(moduleId);

  const getProgress = (totalModules: number) => {
    if (totalModules === 0) return 0;
    return Math.round((completedModules.length / totalModules) * 100);
  };

  return {
    completedModules,
    isLoading,
    isCompleted,
    getProgress,
    markComplete: markComplete.mutate,
    unmarkComplete: unmarkComplete.mutate,
    completedCount: completedModules.length,
  };
}
