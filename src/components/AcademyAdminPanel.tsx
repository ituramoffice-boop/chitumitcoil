import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Trash2, Edit, Settings, Eye, EyeOff, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface AcademyModule {
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
  created_at: string;
}

export default function AcademyAdminPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<AcademyModule | null>(null);
  const [form, setForm] = useState({
    title: "",
    title_en: "",
    description: "",
    type: "video",
    duration: "",
    is_published: false,
    video_url: "",
    quiz_data: "[]",
  });
  const [uploading, setUploading] = useState(false);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["academy-modules-admin"],
    queryFn: async () => {
      // Admin can see all modules (published + unpublished) via RLS
      const { data, error } = await supabase
        .from("academy_modules")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AcademyModule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (moduleData: typeof form & { id?: string; pdf_path?: string }) => {
      const payload = {
        title: moduleData.title,
        title_en: moduleData.title_en || null,
        description: moduleData.description || null,
        type: moduleData.type,
        duration: moduleData.duration || null,
        is_published: moduleData.is_published,
        video_url: moduleData.video_url || null,
        pdf_path: moduleData.pdf_path || null,
        quiz_data: moduleData.type === "quiz" ? JSON.parse(moduleData.quiz_data) : null,
        created_by: user!.id,
        sort_order: modules.length,
      };

      if (moduleData.id) {
        const { error } = await supabase
          .from("academy_modules")
          .update(payload)
          .eq("id", moduleData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("academy_modules")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-modules-admin"] });
      queryClient.invalidateQueries({ queryKey: ["academy-modules"] });
      toast.success(editingModule ? "המודול עודכן" : "מודול חדש נוצר");
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-modules-admin"] });
      queryClient.invalidateQueries({ queryKey: ["academy-modules"] });
      toast.success("המודול נמחק");
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("academy_modules")
        .update({ is_published: published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-modules-admin"] });
      queryClient.invalidateQueries({ queryKey: ["academy-modules"] });
    },
  });

  const resetForm = () => {
    setForm({ title: "", title_en: "", description: "", type: "video", duration: "", is_published: false, video_url: "", quiz_data: "[]" });
    setEditingModule(null);
    setIsOpen(false);
  };

  const openEdit = (mod: AcademyModule) => {
    setEditingModule(mod);
    setForm({
      title: mod.title,
      title_en: mod.title_en || "",
      description: mod.description || "",
      type: mod.type,
      duration: mod.duration || "",
      is_published: mod.is_published,
      video_url: mod.video_url || "",
      quiz_data: mod.quiz_data ? JSON.stringify(mod.quiz_data, null, 2) : "[]",
    });
    setIsOpen(true);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("יש להעלות קובץ PDF בלבד");
      return;
    }
    setUploading(true);
    const path = `pdfs/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("academy-content").upload(path, file);
    if (error) {
      toast.error("שגיאה בהעלאה: " + error.message);
      setUploading(false);
      return;
    }
    toast.success("PDF הועלה בהצלחה");
    setUploading(false);
    // Save with the pdf path
    saveMutation.mutate({ ...form, id: editingModule?.id, pdf_path: path });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("יש להעלות קובץ וידאו בלבד");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("הקובץ גדול מ-100MB");
      return;
    }
    setUploading(true);
    const path = `videos/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("academy-content").upload(path, file);
    if (error) {
      toast.error("שגיאה בהעלאה: " + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("academy-content").getPublicUrl(path);
    setForm(f => ({ ...f, video_url: urlData.publicUrl }));
    toast.success("וידאו הועלה בהצלחה");
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">ניהול תוכן האקדמיה</h2>
        </div>
        <Dialog open={isOpen} onOpenChange={(o) => { if (!o) resetForm(); setIsOpen(o); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4 ml-1" />
              מודול חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingModule ? "עריכת מודול" : "יצירת מודול חדש"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>שם המודול (עברית)</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>שם באנגלית (אופציונלי)</Label>
                <Input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} />
              </div>
              <div>
                <Label>תיאור</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>סוג</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">וידאו</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="quiz">שאלון</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>משך / היקף</Label>
                  <Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="32 דקות / 18 עמודים" />
                </div>
              </div>

              {form.type === "video" && (
                <div className="space-y-3">
                  <Label>וידאו</Label>
                  <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="קישור YouTube/Vimeo או העלה קובץ" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="video-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-accent/30 rounded-lg text-sm text-accent hover:bg-accent/5 transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploading ? "מעלה..." : "העלה וידאו"}
                      </div>
                    </Label>
                    <input id="video-upload" type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploading} />
                  </div>
                </div>
              )}

              {form.type === "pdf" && (
                <div>
                  <Label>קובץ PDF</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Label htmlFor="pdf-upload" className="cursor-pointer flex-1">
                      <div className="flex items-center justify-center gap-2 px-3 py-4 border border-dashed border-accent/30 rounded-lg text-sm text-accent hover:bg-accent/5 transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploading ? "מעלה..." : "העלה PDF"}
                      </div>
                    </Label>
                    <input id="pdf-upload" type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploading} />
                  </div>
                </div>
              )}

              {form.type === "quiz" && (
                <div>
                  <Label>שאלות (JSON)</Label>
                  <Textarea
                    value={form.quiz_data}
                    onChange={e => setForm(f => ({ ...f, quiz_data: e.target.value }))}
                    rows={8}
                    className="font-mono text-xs"
                    placeholder='[{"question":"...","options":["a","b","c","d"],"correct":1}]'
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
                <Label>פורסם (גלוי ליועצים)</Label>
              </div>

              {form.type !== "pdf" && (
                <Button
                  onClick={() => saveMutation.mutate({ ...form, id: editingModule?.id })}
                  disabled={!form.title || saveMutation.isPending}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {saveMutation.isPending ? "שומר..." : editingModule ? "עדכן" : "צור מודול"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">טוען...</p>
      ) : modules.length === 0 ? (
        <Card className="p-8 border-border bg-card/80 text-center">
          <p className="text-muted-foreground">אין מודולים עדיין — צור את הראשון</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {modules.map((mod) => (
            <Card key={mod.id} className="p-3 border-border bg-card/80 flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{mod.title}</p>
                <p className="text-xs text-muted-foreground">{mod.type} · {mod.duration || "—"}</p>
              </div>
              <Badge variant={mod.is_published ? "default" : "secondary"} className={mod.is_published ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}>
                {mod.is_published ? "פורסם" : "טיוטה"}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => togglePublish.mutate({ id: mod.id, published: !mod.is_published })}>
                {mod.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(mod)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(mod.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
