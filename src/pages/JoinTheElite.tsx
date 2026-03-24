import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Shield, CheckCircle, TrendingUp, Crown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChitumitLogo } from "@/components/ChitumitLogo";

const JoinTheElite = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        full_name: name,
        phone,
        email: email || null,
        consultant_id: "7216126b-7293-488c-9689-917e172ad5ce",
        lead_source: "join-the-elite",
        is_marketplace: true,
        notes: "מועמדות דרך דף האליטה",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error("Lead insert error:", err);
      toast({ title: "שגיאה", description: err?.message || "אנא נסו שוב", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const socialProof = [
    "2,000+ יועצים פעילים",
    "₪4.2B בצנרת פעילה",
    "אישור ממוצע תוך 72 שעות",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden" dir="rtl">
      {/* Golden liquid animated BG */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[hsl(43,74%,8%)]" />
        {/* Liquid gold blobs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              background: `radial-gradient(circle, hsl(43 74% 52%), transparent)`,
              width: 300 + i * 100,
              height: 300 + i * 100,
              top: `${10 + i * 15}%`,
              left: `${-10 + i * 20}%`,
            }}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -20, 30, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{
              duration: 12 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-24">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-12"
        >
          <ChitumitLogo size={56} showSlogan />
        </motion.div>

        {/* Hero */}
        <div className="text-center space-y-6 mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-black leading-tight"
            style={{ fontFamily: 'Heebo, sans-serif' }}
          >
            <span className="text-gold">הבנק לא אומר לא</span>
            <br />
            <span className="text-foreground">לחיתומית.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            המערכת שהופכת יועצי משכנתאות לכוח שאי אפשר לעצור.
            AI חיתומי, נרטיב בנקאי אוטומטי, וציון אשראי שפותח דלתות.
          </motion.p>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 mt-6"
          >
            {socialProof.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 bg-gold/5 border border-gold/10 rounded-full px-4 py-2 text-sm"
              >
                <CheckCircle className="h-4 w-4 text-gold" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {[
            {
              icon: Shield,
              title: "נרטיב AI חיתומי",
              desc: "המערכת כותבת את הסיפור שהבנק רוצה לשמוע. אוטומטית, מבוסס נתונים, בלתי ניתן לסירוב.",
            },
            {
              icon: TrendingUp,
              title: "ציון חיתומית 0-100",
              desc: "הלקוח יודע את הציון שלו לפני שהוא נכנס לבנק. אתה יודע בדיוק מה לתקן.",
            },
            {
              icon: Crown,
              title: "שוק לידים פרימיום",
              desc: "לידים מוכנים עם ציון, BDI ונרטיב מוכן. אתה רק סוגר.",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-card/40 border border-gold/10 backdrop-blur-sm"
            >
              <f.icon className="h-8 w-8 text-gold mb-4" />
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA Form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="max-w-lg mx-auto"
        >
          {submitted ? (
            <div className="text-center p-8 rounded-2xl bg-card/60 border border-gold/20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
              >
                <CheckCircle className="h-16 w-16 text-gold mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-black text-gold mb-2">קיבלנו את המועמדות</h3>
              <p className="text-muted-foreground">נחזור אליך תוך 24 שעות עם גישה למערכת.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 p-8 rounded-2xl bg-card/60 border border-gold/20 backdrop-blur">
              <h3 className="text-xl font-bold text-center mb-2">הגישו מועמדות למערכת</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                המקומות מוגבלים. רק יועצים שעומדים בקריטריונים מקבלים גישה.
              </p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם מלא"
                className="bg-secondary/50 border-gold/10"
                dir="rtl"
                required
              />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="טלפון"
                className="bg-secondary/50 border-gold/10"
                dir="rtl"
                required
              />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="אימייל (אופציונלי)"
                type="email"
                className="bg-secondary/50 border-gold/10"
                dir="rtl"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-gold via-[hsl(43,74%,42%)] to-gold hover:brightness-110 text-gold-foreground shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                {loading ? "שולח..." : "אני רוצה להוביל. הגישו מועמדות למערכת"}
                {!loading && <ArrowLeft className="h-5 w-5 mr-2" />}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                מאובטח ב-256bit SSL. אנחנו לא משתפים מידע עם צד שלישי.
              </p>
            </form>
          )}
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-16 text-xs text-muted-foreground space-y-2">
          <p>חיתומית. תהיה מאושר.</p>
          <div className="flex justify-center gap-4">
            <a href="/privacy" className="hover:text-gold transition-colors">מדיניות פרטיות</a>
            <a href="/terms" className="hover:text-gold transition-colors">תנאי שימוש</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinTheElite;
