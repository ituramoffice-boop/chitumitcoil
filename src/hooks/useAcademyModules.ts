import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AcademyModule {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  type: string;
  duration: string | null;
  sort_order: number;
  is_published: boolean;
  video_url: string | null;
  pdf_path: string | null;
  quiz_data: any;
}

export function useAcademyModules() {
  return useQuery({
    queryKey: ["academy-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_modules")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AcademyModule[];
    },
  });
}

export function getPdfUrl(pdfPath: string) {
  const { data } = supabase.storage.from("academy-content").getPublicUrl(pdfPath);
  return data.publicUrl;
}
