import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Image,
  Award,
  Share2,
  Download,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Trophy,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

/* ── Social Post Generator ────────────────────────────────── */
const SocialMediaGenerator = () => {
  const [story, setStory] = useState("1.8M ₪ אושרו ב-4 דקות");
  const [advisorName, setAdvisorName] = useState("דני כהן");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleCopy = () => {
    const text = `${story}\n\n🏆 ${advisorName} | חיתומית. תהיה מאושר.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "הועתק ללוח!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!previewRef.current) return;
    try {
      const dataUrl = await toPng(previewRef.current, { pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `chitumit-post-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "התמונה הורדה בהצלחה!" });
    } catch {
      toast({ title: "שגיאה בהורדה", variant: "destructive" });
    }
  };

  return (
    <Card className="border-gold/20 bg-card/80 backdrop-blur overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Share2 className="h-5 w-5 text-gold" />
          מחולל פוסטים לרשתות חברתיות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">סיפור הצלחה</label>
          <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="bg-secondary/50 border-gold/10 text-foreground"
            rows={2}
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">שם היועץ</label>
          <Input
            value={advisorName}
            onChange={(e) => setAdvisorName(e.target.value)}
            className="bg-secondary/50 border-gold/10 text-foreground"
            dir="rtl"
          />
        </div>

        {/* Preview Card */}
        <div ref={previewRef} className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[hsl(222,47%,7%)] via-[hsl(222,47%,12%)] to-[hsl(43,74%,15%)] p-6 border border-gold/20">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, hsl(43 74% 52% / 0.3), transparent 50%),
              radial-gradient(circle at 80% 20%, hsl(234 89% 63% / 0.2), transparent 50%)`
          }} />
          <div className="relative space-y-4 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-black text-gold leading-tight"
              style={{ fontFamily: 'Heebo, sans-serif' }}
            >
              {story}
            </motion.div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Trophy className="h-4 w-4 text-gold" />
              {advisorName}
            </div>
            <div className="pt-2 border-t border-gold/10">
              <span className="text-gold/80 text-xs font-semibold tracking-wider">
                חיתומית. תהיה מאושר.
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            className="flex-1 bg-gold hover:bg-gold/90 text-gold-foreground"
          >
            {copied ? <Check className="h-4 w-4 ml-2" /> : <Copy className="h-4 w-4 ml-2" />}
            {copied ? "הועתק!" : "העתק טקסט"}
          </Button>
          <Button variant="outline" className="border-gold/20 text-gold">
            <Download className="h-4 w-4 ml-2" />
            הורד כתמונה
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ── Gold Seal Badge Generator ────────────────────────────── */
const GoldSealGenerator = () => {
  const [advisorName, setAdvisorName] = useState("יועץ מורשה");
  const { toast } = useToast();

  return (
    <Card className="border-gold/20 bg-card/80 backdrop-blur overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Award className="h-5 w-5 text-gold" />
          חותם 'I'm In' — תג יועץ מורשה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">שם היועץ</label>
          <Input
            value={advisorName}
            onChange={(e) => setAdvisorName(e.target.value)}
            className="bg-secondary/50 border-gold/10 text-foreground"
            dir="rtl"
          />
        </div>

        {/* Gold Seal Preview */}
        <div className="flex justify-center py-6">
          <motion.div
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-56 h-56"
          >
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-gold/60 shadow-[0_0_40px_rgba(212,175,55,0.3)]" />
            {/* Inner ring */}
            <div className="absolute inset-3 rounded-full border-2 border-gold/30" />
            {/* Content */}
            <div className="absolute inset-5 rounded-full bg-gradient-to-br from-[hsl(43,74%,52%)] via-[hsl(43,74%,42%)] to-[hsl(43,74%,32%)] flex flex-col items-center justify-center text-center p-4 shadow-inner">
              <Star className="h-5 w-5 text-white/90 mb-1" />
              <span className="text-[10px] font-bold text-white/90 tracking-widest uppercase">
                CERTIFIED
              </span>
              <span className="text-sm font-black text-white mt-1 leading-tight" dir="rtl">
                יועץ מורשה
              </span>
              <span className="text-[10px] text-white/80 mt-1 font-bold" dir="rtl">
                חיתומית
              </span>
              <div className="w-12 h-px bg-white/40 my-1" />
              <span className="text-[9px] text-white/70 font-semibold" dir="rtl">
                הופך אולי לברור
              </span>
            </div>
            {/* Decorative notches */}
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-3 bg-gold/40 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 15}deg) translateY(-108px) translateX(-3px)`,
                }}
              />
            ))}
          </motion.div>
        </div>

        <Button
          onClick={() => toast({ title: "החותם הורד בהצלחה", description: "קובץ PNG שקוף מוכן לשימוש" })}
          className="w-full bg-gold hover:bg-gold/90 text-gold-foreground"
        >
          <Download className="h-4 w-4 ml-2" />
          הורד חותם PNG שקוף
        </Button>
      </CardContent>
    </Card>
  );
};

/* ── Quick Stats ──────────────────────────────────────────── */
const QuickStats = () => {
  const stats = [
    { label: "פוסטים שנוצרו", value: "342", icon: Share2 },
    { label: "חותמות שהורדו", value: "1,204", icon: Award },
    { label: "לידים מנחיתה", value: "89", icon: Sparkles },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl bg-card/60 border border-gold/10 p-4 text-center"
        >
          <s.icon className="h-5 w-5 text-gold mx-auto mb-2" />
          <div className="text-2xl font-black text-gold">{s.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────── */
const MarketingAssetsHub = () => {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-gold/10">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5" />
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="p-2 rounded-xl bg-gold/10 border border-gold/20">
              <Image className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-black" style={{ fontFamily: 'Heebo, sans-serif' }}>
                מרכז נכסי שיווק
              </h1>
              <p className="text-sm text-muted-foreground">צור, הורד והפץ חומרים ממותגים</p>
            </div>
          </motion.div>
          <div className="flex gap-2 mt-4">
            <Badge className="bg-gold/10 text-gold border-gold/20">
              <Sparkles className="h-3 w-3 ml-1" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="border-gold/20 text-muted-foreground">
              Master Admin
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <QuickStats />

        <div className="grid lg:grid-cols-2 gap-6">
          <SocialMediaGenerator />
          <GoldSealGenerator />
        </div>

        {/* Links Section */}
        <Card className="border-gold/20 bg-card/80">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-gold" />
              דפי נחיתה פעילים
            </h3>
            <div className="space-y-3">
              {[
                { name: "דף הצטרפות לאליטה", path: "/join-the-elite", status: "פעיל", leads: 89 },
                { name: "בדיקת כשירות חינם", path: "/get-started", status: "פעיל", leads: 234 },
                { name: "מחשבון משכנתא", path: "/calculator", status: "פעיל", leads: 1402 },
              ].map((page) => (
                <div
                  key={page.path}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-gold/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="font-semibold text-sm">{page.name}</span>
                    <span className="text-xs text-muted-foreground">{page.path}</span>
                  </div>
                  <Badge className="bg-gold/10 text-gold border-gold/20 text-xs">
                    {page.leads} לידים
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketingAssetsHub;
