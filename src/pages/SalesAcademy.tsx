import { useState } from "react";
import { motion } from "framer-motion";
import { Play, FileText, HelpCircle, Lock, CheckCircle, Trophy, Star, BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";

const modules = [
  {
    id: "high-ticket-close",
    title: "אמנות סגירת ה-High-Ticket",
    titleEn: "The Art of the High-Ticket Close",
    type: "video" as const,
    icon: Play,
    duration: "32 דקות",
    description: "למד את הטכניקות שיועצי משכנתאות מובילים משתמשים כדי לסגור עסקאות של מיליוני שקלים",
    locked: false,
  },
  {
    id: "lead-psychology",
    title: "פסיכולוגיה של לידים למשכנתאות",
    titleEn: "Psychology of Mortgage Leads",
    type: "pdf" as const,
    icon: FileText,
    duration: "18 עמודים",
    description: "הבן את המוטיבציות הנסתרות של הלקוח ואיך להוביל אותו להחלטה",
    locked: false,
  },
  {
    id: "bank-refusals",
    title: "טיפול בסירובי בנקים ככלי מכירה",
    titleEn: "Handling Bank Refusals as a Sales Tool",
    type: "quiz" as const,
    icon: HelpCircle,
    duration: "10 שאלות",
    description: "הפוך סירוב בנקאי להזדמנות מכירה — שאלון אינטראקטיבי",
    locked: false,
  },
];

const quizQuestions = [
  {
    question: "לקוח קיבל סירוב מהבנק. מה הצעד הראשון שלך?",
    options: [
      "להגיד לו שאין מה לעשות",
      "לבדוק את הסיבה המדויקת לסירוב ולמפות חלופות",
      "לשלוח לבנק אחר מיד",
      "להמתין חודש ולנסות שוב",
    ],
    correct: 1,
  },
  {
    question: "מה היתרון המרכזי שלך כיועץ כשיש סירוב?",
    options: [
      "הלקוח ייאלץ לשלם יותר",
      "אתה יכול להראות ערך מוסף שהלקוח לא יכול להשיג לבד",
      "הבנק ישנה את דעתו",
      "אין יתרון — סירוב הוא סוף הדרך",
    ],
    correct: 1,
  },
  {
    question: "איזה מידע קריטי חייב להיות בדוח האלטרנטיבי שאתה מגיש?",
    options: [
      "רק את הציון האשראי",
      "ניתוח מלא — הכנסות, התחייבויות, תוכנית שיפור ולוח זמנים",
      "רק את סכום המשכנתא המבוקש",
      "פרטי הבנק שדחה",
    ],
    correct: 1,
  },
];

function VideoModule() {
  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary/50 border border-border">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mx-auto">
              <Play className="w-8 h-8 text-accent mr-[-2px]" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">אמנות סגירת ה-High-Ticket</p>
              <p className="text-sm text-muted-foreground">32 דקות · מאסטרקלאס</p>
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Play className="w-4 h-4 ml-1" />
              צפה עכשיו
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["טכניקת ה-Mirror", "בניית דחיפות אמיתית", "סגירה ללא לחץ"].map((topic, i) => (
          <Card key={i} className="p-3 border-border bg-card/80 hover:border-accent/30 transition-colors cursor-pointer">
            <p className="text-xs text-muted-foreground">פרק {i + 1}</p>
            <p className="text-sm font-medium text-foreground">{topic}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PdfModule() {
  return (
    <div className="space-y-4">
      <Card className="p-8 border-border bg-card/80 text-center">
        <FileText className="w-16 h-16 text-accent mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">פסיכולוגיה של לידים למשכנתאות</h3>
        <p className="text-sm text-muted-foreground mb-6">מדריך מקיף של 18 עמודים — כולל תרשימים ודוגמאות מהשטח</p>
        <div className="flex gap-3 justify-center">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <FileText className="w-4 h-4 ml-1" />
            פתח PDF
          </Button>
          <Button variant="outline" className="border-accent/30 text-accent hover:bg-accent/10">
            הורד עותק
          </Button>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {["5 טריגרים רגשיים", "מיפוי צרכים נסתרים", "שפת גוף דיגיטלית", "מודל AIDA למשכנתאות"].map((ch, i) => (
          <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-secondary/30">
            <BookOpen className="w-4 h-4 text-accent shrink-0" />
            <span className="text-foreground">{ch}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizModule() {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [answered, setAnswered] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const done = answered.length === quizQuestions.length;

  const handleAnswer = () => {
    const isCorrect = parseInt(selected) === quizQuestions[currentQ].correct;
    if (isCorrect) setScore((s) => s + 1);
    setAnswered([...answered, isCorrect]);
    setSelected("");
    if (currentQ < quizQuestions.length - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 500);
    }
  };

  if (done) {
    return (
      <Card className="p-8 border-accent/20 bg-card/80 text-center">
        <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-foreground mb-2">
          {score === quizQuestions.length ? "מושלם! 🎉" : `${score}/${quizQuestions.length} תשובות נכונות`}
        </h3>
        <p className="text-muted-foreground mb-4">
          {score === quizQuestions.length
            ? "אתה מוכן להפוך סירובים להזדמנויות"
            : "חזור על החומר ונסה שוב — אתה בדרך הנכונה"}
        </p>
        <Button
          onClick={() => { setCurrentQ(0); setAnswered([]); setScore(0); }}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          נסה שוב
        </Button>
      </Card>
    );
  }

  const q = quizQuestions[currentQ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge className="bg-accent/10 text-accent border-accent/20">שאלה {currentQ + 1}/{quizQuestions.length}</Badge>
        <Progress value={(currentQ / quizQuestions.length) * 100} className="w-32 h-2" />
      </div>
      <Card className="p-6 border-border bg-card/80">
        <h3 className="text-lg font-bold text-foreground mb-4">{q.question}</h3>
        <RadioGroup value={selected} onValueChange={setSelected} className="space-y-3">
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/30 transition-colors">
              <RadioGroupItem value={String(i)} id={`q${currentQ}-opt${i}`} />
              <Label htmlFor={`q${currentQ}-opt${i}`} className="cursor-pointer flex-1 text-foreground">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
        <Button
          onClick={handleAnswer}
          disabled={!selected}
          className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground w-full"
        >
          בדוק תשובה
          <ArrowRight className="w-4 h-4 mr-1" />
        </Button>
      </Card>
    </div>
  );
}

export default function SalesAcademy() {
  const [activeModule, setActiveModule] = useState("high-ticket-close");

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">
            <Trophy className="w-3.5 h-3.5 ml-1" />
            Sales Mastery Academy
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold font-assistant mb-2">
            אקדמיית מכירות <span className="text-accent">ליועצי משכנתאות</span>
          </h1>
          <p className="text-muted-foreground">שלוט באמנות המכירה — מהליד הראשון ועד הסגירה</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Module List */}
          <div className="space-y-3">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    onClick={() => !mod.locked && setActiveModule(mod.id)}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      isActive
                        ? "border-accent/40 bg-accent/5 shadow-[0_0_20px_-5px_hsl(43_74%_52%/0.15)]"
                        : "border-border bg-card/80 hover:border-accent/20"
                    } ${mod.locked ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                      }`}>
                        {mod.locked ? <Lock className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{mod.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{mod.duration}</p>
                      </div>
                      {isActive && <CheckCircle className="w-5 h-5 text-accent shrink-0" />}
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {/* Progress Card */}
            <Card className="p-4 border-border bg-card/80 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">ההתקדמות שלך</span>
              </div>
              <Progress value={33} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">1 מתוך 3 מודולים הושלמו</p>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeModule === "high-ticket-close" && <VideoModule />}
              {activeModule === "lead-psychology" && <PdfModule />}
              {activeModule === "bank-refusals" && <QuizModule />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
