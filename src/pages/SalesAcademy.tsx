import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, FileText, HelpCircle, Lock, CheckCircle, Trophy, Star, BookOpen, ArrowRight, Download, Check, PartyPopper, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademyModules, getPdfUrl, type AcademyModule } from "@/hooks/useAcademyModules";
import { useAcademyProgress } from "@/hooks/useAcademyProgress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AcademyAdminPanel from "@/components/AcademyAdminPanel";

// Fallback hardcoded modules when no DB content exists
const fallbackModules = [
  { id: "high-ticket-close", title: "אמנות סגירת ה-High-Ticket", type: "video", duration: "32 דקות", description: "למד את הטכניקות שיועצי משכנתאות מובילים משתמשים כדי לסגור עסקאות של מיליוני שקלים", video_url: null, pdf_path: null, quiz_data: null },
  { id: "lead-psychology", title: "פסיכולוגיה של לידים למשכנתאות", type: "pdf", duration: "18 עמודים", description: "הבן את המוטיבציות הנסתרות של הלקוח ואיך להוביל אותו להחלטה", video_url: null, pdf_path: null, quiz_data: null },
  { id: "bank-refusals", title: "טיפול בסירובי בנקים ככלי מכירה", type: "quiz", duration: "10 שאלות", description: "הפוך סירוב בנקאי להזדמנות מכירה — שאלון אינטראקטיבי", video_url: null, pdf_path: null, quiz_data: [
    { question: "לקוח קיבל סירוב מהבנק. מה הצעד הראשון שלך?", options: ["להגיד לו שאין מה לעשות", "לבדוק את הסיבה המדויקת לסירוב ולמפות חלופות", "לשלוח לבנק אחר מיד", "להמתין חודש ולנסות שוב"], correct: 1 },
    { question: "מה היתרון המרכזי שלך כיועץ כשיש סירוב?", options: ["הלקוח ייאלץ לשלם יותר", "אתה יכול להראות ערך מוסף שהלקוח לא יכול להשיג לבד", "הבנק ישנה את דעתו", "אין יתרון — סירוב הוא סוף הדרך"], correct: 1 },
    { question: "איזה מידע קריטי חייב להיות בדוח האלטרנטיבי שאתה מגיש?", options: ["רק את הציון האשראי", "ניתוח מלא — הכנסות, התחייבויות, תוכנית שיפור ולוח זמנים", "רק את סכום המשכנתא המבוקש", "פרטי הבנק שדחה"], correct: 1 },
  ] },
];

const typeIcons: Record<string, typeof Play> = { video: Play, pdf: FileText, quiz: HelpCircle };

function VideoModule({ mod }: { mod: any }) {
  const hasVideo = !!mod.video_url;
  const isEmbed = hasVideo && (mod.video_url.includes("youtube") || mod.video_url.includes("youtu.be") || mod.video_url.includes("vimeo"));

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtu.be/")) return `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split("?")[0]}`;
    if (url.includes("youtube.com/watch")) {
      const id = new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("vimeo.com/")) return `https://player.vimeo.com/video/${url.split("vimeo.com/")[1].split("?")[0]}`;
    return url;
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary/50 border border-border">
        {isEmbed ? (
          <iframe src={getEmbedUrl(mod.video_url)} className="absolute inset-0 w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
        ) : hasVideo ? (
          <video src={mod.video_url} controls className="absolute inset-0 w-full h-full object-contain bg-black" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-accent mr-[-2px]" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{mod.title}</p>
                <p className="text-sm text-muted-foreground">{mod.duration} · מאסטרקלאס</p>
              </div>
              <p className="text-xs text-muted-foreground">תוכן וידאו יתווסף בקרוב</p>
            </div>
          </div>
        )}
      </div>
      {mod.description && (
        <p className="text-sm text-muted-foreground">{mod.description}</p>
      )}
    </div>
  );
}

function PdfModule({ mod }: { mod: any }) {
  const hasPdf = !!mod.pdf_path;
  const pdfUrl = hasPdf ? getPdfUrl(mod.pdf_path) : null;

  return (
    <div className="space-y-4">
      {hasPdf ? (
        <>
          <div className="aspect-[3/4] max-h-[600px] rounded-xl overflow-hidden border border-border">
            <iframe src={pdfUrl + "#toolbar=1"} className="w-full h-full" />
          </div>
          <div className="flex gap-3 justify-center">
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <a href={pdfUrl!} target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4 ml-1" />
                פתח PDF
              </a>
            </Button>
            <Button asChild variant="outline" className="border-accent/30 text-accent hover:bg-accent/10">
              <a href={pdfUrl!} download>
                <Download className="w-4 h-4 ml-1" />
                הורד עותק
              </a>
            </Button>
          </div>
        </>
      ) : (
        <Card className="p-8 border-border bg-card/80 text-center">
          <FileText className="w-16 h-16 text-accent mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">{mod.title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{mod.description || "מדריך מקיף"}</p>
          <p className="text-xs text-muted-foreground">קובץ PDF יתווסף בקרוב</p>
        </Card>
      )}
    </div>
  );
}

function QuizModule({ mod }: { mod: any }) {
  const questions = mod.quiz_data || [];
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [answered, setAnswered] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);

  if (!questions.length) {
    return (
      <Card className="p-8 border-border bg-card/80 text-center">
        <HelpCircle className="w-16 h-16 text-accent mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">{mod.title}</h3>
        <p className="text-sm text-muted-foreground">שאלון יתווסף בקרוב</p>
      </Card>
    );
  }

  const done = answered.length === questions.length;

  const handleAnswer = () => {
    const isCorrect = parseInt(selected) === questions[currentQ].correct;
    if (isCorrect) setScore((s) => s + 1);
    setAnswered([...answered, isCorrect]);
    setSelected("");
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 500);
    }
  };

  if (done) {
    return (
      <Card className="p-8 border-accent/20 bg-card/80 text-center">
        <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-foreground mb-2">
          {score === questions.length ? "מושלם! 🎉" : `${score}/${questions.length} תשובות נכונות`}
        </h3>
        <p className="text-muted-foreground mb-4">
          {score === questions.length ? "אתה מוכן להפוך סירובים להזדמנויות" : "חזור על החומר ונסה שוב — אתה בדרך הנכונה"}
        </p>
        <Button onClick={() => { setCurrentQ(0); setAnswered([]); setScore(0); }} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          נסה שוב
        </Button>
      </Card>
    );
  }

  const q = questions[currentQ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge className="bg-accent/10 text-accent border-accent/20">שאלה {currentQ + 1}/{questions.length}</Badge>
        <Progress value={(currentQ / questions.length) * 100} className="w-32 h-2" />
      </div>
      <Card className="p-6 border-border bg-card/80">
        <h3 className="text-lg font-bold text-foreground mb-4">{q.question}</h3>
        <RadioGroup value={selected} onValueChange={setSelected} className="space-y-3">
          {q.options.map((opt: string, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/30 transition-colors">
              <RadioGroupItem value={String(i)} id={`q${currentQ}-opt${i}`} />
              <Label htmlFor={`q${currentQ}-opt${i}`} className="cursor-pointer flex-1 text-foreground">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
        <Button onClick={handleAnswer} disabled={!selected} className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground w-full">
          בדוק תשובה
          <ArrowRight className="w-4 h-4 mr-1" />
        </Button>
      </Card>
    </div>
  );
}

export default function SalesAcademy() {
  const { user } = useAuth();
  const { data: dbModules = [], isLoading } = useAcademyModules();
  const { isCompleted, getProgress, markComplete, unmarkComplete, completedCount } = useAcademyProgress();
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return !!data;
    },
    enabled: !!user,
  });

  const modules = dbModules.length > 0 ? dbModules : fallbackModules;
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const active = activeModule || modules[0]?.id;
  const activeMod = modules.find(m => m.id === active);
  const progress = getProgress(modules.length);

  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      setShowSuccess(true);
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const handleToggleComplete = (moduleId: string) => {
    if (isCompleted(moduleId)) {
      unmarkComplete(moduleId);
      toast("סימון ההשלמה הוסר");
    } else {
      markComplete(moduleId);
      toast.success("מודול סומן כהושלם! 🎉");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">
            <Trophy className="w-3.5 h-3.5 ml-1" />
            Sales Mastery Academy
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-assistant mb-2">
            אקדמיית מכירות <span className="text-accent">ליועצי משכנתאות</span>
          </h1>
          <p className="text-muted-foreground">שלוט באמנות המכירה — מהליד הראשון ועד הסגירה</p>
        </motion.div>

        {isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <AcademyAdminPanel />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {modules.map((mod, i) => {
              const Icon = typeIcons[mod.type] || Play;
              const isActive = active === mod.id;
              const completed = isCompleted(mod.id);
              return (
                <motion.div key={mod.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card
                    onClick={() => setActiveModule(mod.id)}
                    className={`p-4 cursor-pointer transition-all duration-200 ${isActive ? "border-accent/40 bg-accent/5 shadow-[0_0_20px_-5px_hsl(43_74%_52%/0.15)]" : "border-border bg-card/80 hover:border-accent/20"} ${completed ? "ring-1 ring-green-500/30" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${completed ? "bg-green-500/20 text-green-500" : isActive ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>
                        {completed ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${completed ? "text-green-500" : "text-foreground"}`}>{mod.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{mod.duration}</p>
                      </div>
                      {completed && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                      {isActive && !completed && <CheckCircle className="w-5 h-5 text-accent shrink-0" />}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
            <Card className="p-4 border-border bg-card/80 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">ההתקדמות שלך</span>
              </div>
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">{completedCount} מתוך {modules.length} מודולים הושלמו ({progress}%)</p>
              {progress === 100 && (
                <Badge className="mt-2 bg-green-500/10 text-green-500 border-green-500/20">
                  <Trophy className="w-3 h-3 ml-1" /> סיימת את כל המודולים! 🎉
                </Badge>
              )}
            </Card>
          </div>

          <div className="lg:col-span-2">
            {activeMod && (
              <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {activeMod.type === "video" && <VideoModule mod={activeMod} />}
                {activeMod.type === "pdf" && <PdfModule mod={activeMod} />}
                {activeMod.type === "quiz" && <QuizModule mod={activeMod} />}

                <div className="mt-6 flex justify-center">
                  <Button
                    variant={isCompleted(activeMod.id) ? "outline" : "default"}
                    onClick={() => handleToggleComplete(activeMod.id)}
                    className={isCompleted(activeMod.id)
                      ? "border-green-500/40 text-green-500 hover:bg-green-500/10"
                      : "bg-accent hover:bg-accent/90 text-accent-foreground"}
                  >
                    {isCompleted(activeMod.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 ml-1" />
                        הושלם — לחץ לביטול
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 ml-1" />
                        סמן כהושלם
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
