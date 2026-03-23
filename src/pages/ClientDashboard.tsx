import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Brain,
  LogOut,
  FileText,
  User,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";

const ClientDashboard = () => {
  const { user, signOut } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SmartMortgage AI</h1>
              <p className="text-xs text-muted-foreground">אזור אישי</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 ml-2" />
            יציאה
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                שלום, {profile?.full_name || "לקוח"}!
              </h2>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center space-y-3">
            <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">המסמכים שלי</h3>
            <p className="text-sm text-muted-foreground">
              העלה ונהל את מסמכי המשכנתא שלך
            </p>
            <Button variant="outline" className="w-full" disabled>
              בקרוב
            </Button>
          </div>

          <div className="glass-card p-6 text-center space-y-3">
            <div className="p-3 rounded-full bg-success/10 w-fit mx-auto">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">סטטוס תיק</h3>
            <p className="text-sm text-muted-foreground">
              עקוב אחרי ההתקדמות של תיק המשכנתא
            </p>
            <Button variant="outline" className="w-full" disabled>
              בקרוב
            </Button>
          </div>

          <div className="glass-card p-6 text-center space-y-3">
            <div className="p-3 rounded-full bg-warning/10 w-fit mx-auto">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground">פגישות</h3>
            <p className="text-sm text-muted-foreground">
              קבע פגישה עם היועץ שלך
            </p>
            <Button variant="outline" className="w-full" disabled>
              בקרוב
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
