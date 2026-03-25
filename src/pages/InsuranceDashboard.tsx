import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";

const InsuranceDashboard = () => {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || "סוכן";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 flex items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-xl px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">לוח בקרה — ביטוח</span>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 ml-1" />
          יציאה
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            שלום, {displayName} 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            ברוכים הבאים ללוח הבקרה לסוכני ביטוח. התכנים בבנייה ויהיו זמינים בקרוב.
          </p>
          <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            🚧 בקרוב — ניהול פוליסות, לקוחות, ודוחות
          </div>
        </div>
      </main>
    </div>
  );
};

export default InsuranceDashboard;
