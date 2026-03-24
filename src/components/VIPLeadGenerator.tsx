import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Upload, Copy, Check, Sparkles, Link2, Eye, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface VIPLink {
  id: string;
  advisorName: string;
  slug: string;
  message: string;
  logoUrl: string | null;
  annualPotential: number;
  createdAt: Date;
  views: number;
}

export function VIPLeadGenerator() {
  const [open, setOpen] = useState(false);
  const [advisorName, setAdvisorName] = useState("");
  const [specialMessage, setSpecialMessage] = useState("");
  const [annualPotential, setAnnualPotential] = useState("2400000");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [links, setLinks] = useState<VIPLink[]>([
    {
      id: "1",
      advisorName: "יוסי כהן",
      slug: "yossi-cohen",
      message: "יוסי, בוא נכפיל לך את שכר הטרחה החודש.",
      logoUrl: null,
      annualPotential: 2_400_000,
      createdAt: new Date(Date.now() - 86400000 * 2),
      views: 3,
    },
    {
      id: "2",
      advisorName: "מיכל לוי",
      slug: "michal-levi",
      message: "מיכל, הצטרפי לנבחרת שמרוויחה יותר.",
      logoUrl: null,
      annualPotential: 1_800_000,
      createdAt: new Date(Date.now() - 86400000),
      views: 1,
    },
  ]);

  const generateSlug = (name: string) =>
    name
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\u0590-\u05FFa-zA-Z0-9-]/g, "")
      .toLowerCase() || "advisor";

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = useCallback(() => {
    if (!advisorName.trim()) {
      toast({ title: "שם היועץ חסר", variant: "destructive" });
      return;
    }
    const slug = generateSlug(advisorName);
    const newLink: VIPLink = {
      id: crypto.randomUUID(),
      advisorName: advisorName.trim(),
      slug,
      message: specialMessage || `${advisorName.trim()}, בוא נכפיל לך את שכר הטרחה.`,
      logoUrl: logoPreview,
      annualPotential: parseInt(annualPotential) || 2_400_000,
      createdAt: new Date(),
      views: 0,
    };
    setLinks(prev => [newLink, ...prev]);
    toast({
      title: "🔗 לינק VIP נוצר!",
      description: `הלינק ליועץ ${advisorName} מוכן להפצה.`,
    });
    setAdvisorName("");
    setSpecialMessage("");
    setLogoPreview(null);
    setAnnualPotential("2400000");
    setOpen(false);
  }, [advisorName, specialMessage, logoPreview, annualPotential]);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/vip/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "📋 הלינק הועתק!" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="glass-card p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Crown className="w-5 h-5 text-gold" />
          </motion.div>
          <h2 className="font-bold text-sm text-foreground">VIP Lead Generator</h2>
          <Badge variant="outline" className="border-gold/30 text-gold text-[9px]">
            {links.length} לינקים פעילים
          </Badge>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-gold to-amber-500 text-black font-bold gap-1 shadow-[0_0_20px_hsl(var(--gold)/0.3)]">
              <Sparkles className="w-4 h-4" />
              צור לינק VIP חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg glass-card border-gold/20" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gold">
                <Crown className="w-5 h-5" />
                יצירת כרטיס כניסה VIP
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">שם היועץ</Label>
                <Input
                  value={advisorName}
                  onChange={e => setAdvisorName(e.target.value)}
                  placeholder="למשל: יוסי כהן"
                  className="border-gold/20 focus:border-gold/40"
                />
                {advisorName && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    /vip/{generateSlug(advisorName)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">לוגו משרד (אופציונלי)</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gold/30 hover:border-gold/60 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">העלה לוגו</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  {logoPreview && (
                    <motion.img
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      src={logoPreview}
                      alt="Logo"
                      className="w-10 h-10 rounded-lg object-cover border border-gold/30"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">הודעה אישית</Label>
                <Textarea
                  value={specialMessage}
                  onChange={e => setSpecialMessage(e.target.value)}
                  placeholder="יוסי, בוא נכפיל לך את שכר הטרחה החודש."
                  rows={2}
                  className="border-gold/20 focus:border-gold/40"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">פוטנציאל שנתי (₪)</Label>
                <Input
                  type="number"
                  value={annualPotential}
                  onChange={e => setAnnualPotential(e.target.value)}
                  className="border-gold/20 focus:border-gold/40"
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={!advisorName.trim()}
                className="w-full bg-gradient-to-r from-gold to-amber-500 text-black font-bold gap-2 py-5 shadow-[0_0_20px_hsl(var(--gold)/0.3)]"
              >
                <Sparkles className="w-4 h-4" />
                צור כרטיס כניסה VIP
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Links List */}
      <div className="space-y-3">
        <AnimatePresence>
          {links.map((link, i) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/20 bg-secondary/10 hover:bg-secondary/20 transition-all"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-amber-500/20 flex items-center justify-center text-[10px] font-black text-gold shrink-0 border border-gold/20">
                {link.advisorName.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{link.advisorName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{link.message}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Eye className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{link.views}</span>
              </div>

              {/* Potential */}
              <Badge variant="outline" className="border-gold/20 text-gold text-[9px] shrink-0">
                ₪{(link.annualPotential / 1_000_000).toFixed(1)}M
              </Badge>

              {/* Copy */}
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => copyLink(link.slug)}
              >
                {copied === link.slug ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Tracking note */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/10">
        <Bell className="w-3.5 h-3.5 text-gold/60" />
        <p className="text-[10px] text-muted-foreground">
          תקבל התראה מיידית ברגע שיועץ יפתח את הלינק שלו
        </p>
      </div>
    </motion.div>
  );
}
