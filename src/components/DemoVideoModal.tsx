import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Sparkles, FileText, BarChart3, Shield, CheckCircle2, Users, Brain, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { cn } from "@/lib/utils";

interface DemoVideoModalProps {
  open: boolean;
  onClose: () => void;
}

const SCENES = [
  { id: "intro", duration: 3000, title: "חיתומית AI", subtitle: "מערכת החיתום החכמה בישראל", icon: Brain, bg: "from-background via-primary/5 to-background" },
  { id: "upload", duration: 3500, title: "העלאת מסמכים חכמה", subtitle: "המערכת מזהה, מסווגת ומאמתת מסמכים באופן אוטומטי", icon: FileText, bg: "from-background via-cyan-500/5 to-background", mockItems: ["תלושי שכר ✓", "דפי עו\"ש ✓", 'דו"ח BDI ✓'] },
  { id: "analysis", duration: 4000, title: "ניתוח חיתום AI", subtitle: "סריקת 47 פרמטרים פיננסיים בזמן אמת", icon: BarChart3, bg: "from-background via-gold/5 to-background", score: 93 },
  { id: "risk", duration: 3500, title: "מגן ציות רגולטורי", subtitle: "בדיקת LTV, DTI והתאמת מדיניות בנקים", icon: Shield, bg: "from-background via-emerald-500/5 to-background", checks: ["LTV 60% ✓", "DTI 19% ✓", "הון עצמי מספיק ✓"] },
  { id: "crm", duration: 3500, title: "CRM חכם — ניהול לידים", subtitle: "דירוג אוטומטי, ציון Chitumit Score וחיזוי סגירה", icon: Users, bg: "from-background via-primary/5 to-background", leads: [{ name: "דוד כהן", score: 96, status: "סיכוי גבוה" }, { name: "שרה לוי", score: 72, status: "סיכוי בינוני" }] },
  { id: "profit", duration: 3500, title: "מנוע רווחיות", subtitle: "חישוב שכר טרחה אוטומטי וניהול צבר הכנסות", icon: Crown, bg: "from-background via-gold/5 to-background", fee: "₪15,180" },
  { id: "outro", duration: 3000, title: "חיתומית — תהיה מאושר.", subtitle: "10 לידים ראשונים בחינם. בלי כרטיס אשראי.", icon: Zap, bg: "from-background via-gold/5 to-background" },
];

const TOTAL_DURATION = SCENES.reduce((sum, s) => sum + s.duration, 0);

export function DemoVideoModal({ open, onClose }: DemoVideoModalProps) {
  const [playing, setPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [globalProgress, setGlobalProgress] = useState(0);

  const reset = useCallback(() => {
    setCurrentScene(0);
    setSceneProgress(0);
    setGlobalProgress(0);
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (open) {
      reset();
      const t = setTimeout(() => setPlaying(true), 600);
      return () => clearTimeout(t);
    }
  }, [open, reset]);

  useEffect(() => {
    if (!playing) return;
    const scene = SCENES[currentScene];
    if (!scene) { setPlaying(false); return; }
    const interval = 50;
    const timer = setInterval(() => {
      setSceneProgress((prev) => {
        const next = prev + interval;
        if (next >= scene.duration) {
          if (currentScene < SCENES.length - 1) {
            setCurrentScene((s) => s + 1);
            return 0;
          } else {
            setPlaying(false);
            return scene.duration;
          }
        }
        return next;
      });
      setGlobalProgress((prev) => Math.min(prev + interval, TOTAL_DURATION));
    }, interval);
    return () => clearInterval(timer);
  }, [playing, currentScene]);

  const scene = SCENES[currentScene];
  const SceneIcon = scene?.icon || Brain;
  const np = scene ? sceneProgress / scene.duration : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-background/98 backdrop-blur-2xl flex flex-col"
          dir="rtl"
        >
          <Button variant="ghost" size="icon" onClick={() => { reset(); onClose(); }}
            className="fixed top-5 left-5 z-[201] text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </Button>

          <div className="flex-1 flex items-center justify-center px-6">
            <div className="w-full max-w-3xl">
              <div className="relative rounded-2xl border border-border/30 bg-card/80 overflow-hidden shadow-2xl">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/20 bg-card">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-[10px] text-muted-foreground font-mono">chitumit.co.il — Demo</span>
                  </div>
                  <ChitumitLogo size={14} />
                </div>

                {/* Scene */}
                <div className={cn("relative h-[400px] md:h-[480px] bg-gradient-to-b overflow-hidden", scene?.bg)}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={scene?.id}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.05, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                    >
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 5, -5, 0] }} transition={{ duration: 0.6, delay: 0.1 }}
                        className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-6">
                        <SceneIcon className="w-8 h-8 text-gold" />
                      </motion.div>
                      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-2xl md:text-3xl font-black text-foreground mb-3">{scene?.title}</motion.h2>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                        className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">{scene?.subtitle}</motion.p>

                      {/* Upload scene */}
                      {scene?.id === "upload" && scene.mockItems && (
                        <div className="space-y-2">
                          {scene.mockItems.map((item: string, i: number) => (
                            <motion.div key={item} initial={{ opacity: 0, x: 20 }}
                              animate={np > (i + 1) * 0.25 ? { opacity: 1, x: 0 } : {}}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
                              <CheckCircle2 className="w-4 h-4 text-success" />
                              <span className="text-sm text-foreground">{item}</span>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Analysis scene */}
                      {scene?.id === "analysis" && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: np > 0.3 ? 1 : 0 }}
                          className="w-24 h-24 rounded-full bg-gradient-to-b from-gold/15 to-gold/5 border-2 border-gold/30 flex items-center justify-center">
                          <div className="text-center">
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: np > 0.5 ? 1 : 0 }}
                              className="text-3xl font-black text-emerald-400">{scene.score}</motion.span>
                            <p className="text-[8px] text-muted-foreground uppercase tracking-widest">SCORE</p>
                          </div>
                        </motion.div>
                      )}

                      {/* Risk scene */}
                      {scene?.id === "risk" && scene.checks && (
                        <div className="space-y-2">
                          {scene.checks.map((check: string, i: number) => (
                            <motion.div key={check} initial={{ opacity: 0, x: 20 }}
                              animate={np > (i + 1) * 0.25 ? { opacity: 1, x: 0 } : {}}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <Shield className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm text-foreground">{check}</span>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* CRM scene */}
                      {scene?.id === "crm" && scene.leads && (
                        <div className="space-y-3 w-full max-w-sm">
                          {scene.leads.map((lead: { name: string; score: number; status: string }, i: number) => (
                            <motion.div key={lead.name} initial={{ opacity: 0, y: 10 }}
                              animate={np > (i + 1) * 0.3 ? { opacity: 1, y: 0 } : {}}
                              className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card/80">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-foreground">{lead.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{lead.status}</p>
                                </div>
                              </div>
                              <div className="text-lg font-black text-gold">{lead.score}</div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Profit scene */}
                      {scene?.id === "profit" && (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }}
                          animate={np > 0.3 ? { scale: 1, opacity: 1 } : {}}
                          className="p-6 rounded-2xl border border-gold/20 bg-gold/5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">RECOMMENDED FEE</p>
                          <p className="text-4xl font-black text-gold">{scene.fee}</p>
                          <p className="text-xs text-emerald-400 mt-2">Certainty Score: 98%</p>
                        </motion.div>
                      )}

                      {/* Outro */}
                      {scene?.id === "outro" && (
                        <motion.div initial={{ scale: 0 }} animate={np > 0.3 ? { scale: 1 } : {}}
                          transition={{ type: "spring", damping: 12 }}>
                          <ChitumitLogo size={60} className="drop-shadow-[0_0_30px_hsl(43,74%,52%,0.4)]" />
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <div className="absolute bottom-4 left-4 text-[10px] text-muted-foreground font-mono">{currentScene + 1} / {SCENES.length}</div>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4 h-1 rounded-full bg-secondary/30 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-gold via-amber-400 to-gold transition-all duration-100"
                  style={{ width: `${(globalProgress / TOTAL_DURATION) * 100}%` }} />
              </div>

              {/* Controls */}
              <div className="mt-4 flex items-center justify-center gap-3">
                {!playing && globalProgress >= TOTAL_DURATION - 100 ? (
                  <Button size="sm" variant="outline" className="border-gold/20 text-gold hover:bg-gold/10" onClick={reset}>
                    <Play className="w-3.5 h-3.5 ml-1.5" /> נגן שוב
                  </Button>
                ) : !playing ? (
                  <Button size="sm" variant="outline" className="border-gold/20 text-gold hover:bg-gold/10" onClick={() => setPlaying(true)}>
                    <Play className="w-3.5 h-3.5 ml-1.5" /> המשך
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}