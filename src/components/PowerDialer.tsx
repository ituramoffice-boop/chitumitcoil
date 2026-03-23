import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Phone, PhoneOff, SkipForward, Pause, Play, Mic, MicOff,
  Loader2, CheckCircle2, X, Clock, User, FileText, Brain,
  AlertTriangle, ChevronRight, Sparkles, Volume2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  mortgage_amount: number | null;
  monthly_income: number | null;
  notes: string | null;
  last_contact: string | null;
  next_step: string | null;
  lead_source: string | null;
}

type CallState = "idle" | "dialing" | "connected" | "wrap_up" | "processing_ai";

interface CallResult {
  duration: number;
  notes: string;
  leadId: string;
  leadName: string;
}

interface AIAnalysis {
  summary: string[];
  sentiment: "positive" | "neutral" | "negative";
  actionItems: string[];
  nextStep: string;
  buyingSignals?: string[];
  objections?: string[];
  salesTechnique?: string;
  closingLine?: string;
  closingStrategy?: string;
  heatScore?: number;
  leadScore?: number;
  leadScoreBreakdown?: { intent: number; urgency: number; authority: number };
}

interface PowerDialerProps {
  queue: Lead[];
  onClose: () => void;
  onCallComplete: (leadId: string, notes: string, aiAnalysis?: AIAnalysis) => void;
}

export function PowerDialer({ queue, onClose, onCallComplete }: PowerDialerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [callState, setCallState] = useState<CallState>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [wrapUpTimer, setWrapUpTimer] = useState(15);
  const [callNotes, setCallNotes] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [completedCalls, setCompletedCalls] = useState<CallResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const wrapUpRef = useRef<ReturnType<typeof setInterval>>();

  const currentLead = queue[currentIndex];
  const isSessionComplete = currentIndex >= queue.length;

  // Call duration timer
  useEffect(() => {
    if (callState === "connected" && !isPaused) {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState, isPaused]);

  // Wrap-up countdown
  useEffect(() => {
    if (callState === "wrap_up") {
      setWrapUpTimer(15);
      wrapUpRef.current = setInterval(() => {
        setWrapUpTimer(t => {
          if (t <= 1) {
            clearInterval(wrapUpRef.current);
            moveToNext();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (wrapUpRef.current) clearInterval(wrapUpRef.current); };
  }, [callState]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startCall = useCallback(() => {
    if (!currentLead?.phone) {
      toast({ title: "אין מספר טלפון ללידה הזו", variant: "destructive" });
      return;
    }
    setCallState("dialing");
    setCallDuration(0);
    setCallNotes("");
    setAiAnalysis(null);

    // Simulate dialing (2-4 seconds)
    const dialTime = 2000 + Math.random() * 2000;
    setTimeout(() => {
      setCallState("connected");
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 2000);
      toast({ title: `📞 שיחה התחברה עם ${currentLead.full_name}` });
    }, dialTime);
  }, [currentLead]);

  const endCall = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = callDuration;

    setCompletedCalls(prev => [...prev, {
      duration, notes: callNotes, leadId: currentLead.id, leadName: currentLead.full_name,
    }]);

    // Run AI analysis
    setCallState("processing_ai");
    setAiLoading(true);
    let analysisResult: AIAnalysis | null = null;
    try {
      const { data, error } = await supabase.functions.invoke("analyze-call", {
        body: {
          leadName: currentLead.full_name,
          callDuration: duration,
          notes: callNotes,
          leadId: currentLead.id,
          leadContext: {
            mortgage_amount: currentLead.mortgage_amount,
            monthly_income: currentLead.monthly_income,
            status: currentLead.status,
            last_contact: currentLead.last_contact,
          },
        },
      });
      if (!error && data) {
        analysisResult = data;
        setAiAnalysis(data);
      }
    } catch {
      // AI analysis is optional
    }
    setAiLoading(false);
    setCallState("wrap_up");

    // Save call log to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("call_logs").insert({
          lead_id: currentLead.id,
          user_id: user.id,
          duration_seconds: duration,
          notes: callNotes || null,
          ai_summary: analysisResult ? { summary: analysisResult.summary } : null,
          sentiment: analysisResult?.sentiment || null,
          action_items: analysisResult?.actionItems || null,
          next_step: analysisResult?.nextStep || null,
          status: "completed",
        } as any);
      }
    } catch {
      // Non-critical: log saving is best-effort
    }
  }, [callDuration, callNotes, currentLead]);

  const skipLead = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (wrapUpRef.current) clearInterval(wrapUpRef.current);
    setCallState("idle");
    setCallDuration(0);
    setCallNotes("");
    setAiAnalysis(null);
    setCurrentIndex(i => i + 1);
  }, []);

  const moveToNext = useCallback(() => {
    if (wrapUpRef.current) clearInterval(wrapUpRef.current);
    onCallComplete(currentLead.id, callNotes, aiAnalysis || undefined);
    setCallState("idle");
    setCallDuration(0);
    setCallNotes("");
    setAiAnalysis(null);
    setCurrentIndex(i => i + 1);
  }, [currentLead, callNotes, aiAnalysis, onCallComplete]);

  // Auto-start next call
  useEffect(() => {
    if (callState === "idle" && !isSessionComplete && currentIndex > 0) {
      const t = setTimeout(() => startCall(), 1500);
      return () => clearTimeout(t);
    }
  }, [callState, currentIndex, isSessionComplete]);

  if (isSessionComplete) {
    return (
      <div className="fixed bottom-4 left-4 z-50 w-[420px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" dir="rtl">
        <div className="bg-green-500/10 p-6 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-bold">סשן החיוג הסתיים!</h3>
          <p className="text-sm text-muted-foreground">
            {completedCalls.length} שיחות מתוך {queue.length} לידים
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            {completedCalls.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-1.5">
                <span>{c.leadName}</span>
                <span>{formatTime(c.duration)}</span>
              </div>
            ))}
          </div>
          <Button onClick={onClose} className="w-full mt-2">סגור</Button>
        </div>
      </div>
    );
  }

  const sentimentConfig = {
    positive: { label: "חיובי", color: "text-green-500", bg: "bg-green-500/10" },
    neutral: { label: "ניטרלי", color: "text-warning", bg: "bg-warning/10" },
    negative: { label: "שלילי", color: "text-destructive", bg: "bg-destructive/10" },
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[420px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" dir="rtl">
      {/* Success pulse animation */}
      {showPulse && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 bg-green-500/20 animate-ping rounded-2xl" />
        </div>
      )}

      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-3 transition-colors",
        callState === "connected" ? "bg-green-500/10" :
        callState === "dialing" ? "bg-warning/10" :
        callState === "wrap_up" ? "bg-primary/10" :
        callState === "processing_ai" ? "bg-purple-500/10" : "bg-muted/50"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            callState === "connected" ? "bg-green-500 animate-pulse" :
            callState === "dialing" ? "bg-warning animate-pulse" :
            "bg-muted-foreground"
          )} />
          <span className="text-sm font-medium">
            {callState === "dialing" ? "מחייג..." :
             callState === "connected" ? "שיחה פעילה" :
             callState === "wrap_up" ? "סיכום שיחה" :
             callState === "processing_ai" ? "ניתוח AI..." :
             "Power Dialer"}
          </span>
          {callState === "connected" && (
            <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 animate-pulse">
              <Mic className="h-2.5 w-2.5 ml-0.5" />
              REC
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {currentIndex + 1}/{queue.length}
          </Badge>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Lead Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm">{currentLead.full_name}</h4>
            <p className="text-xs text-muted-foreground">{currentLead.phone || "אין טלפון"}</p>
            <div className="flex items-center gap-2 mt-1">
              {currentLead.mortgage_amount && (
                <span className="text-[10px] bg-muted rounded px-1.5 py-0.5">
                  ₪{currentLead.mortgage_amount.toLocaleString()}
                </span>
              )}
              {currentLead.last_contact && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDistanceToNow(new Date(currentLead.last_contact), { locale: he, addSuffix: true })}
                </span>
              )}
            </div>
          </div>
          {/* Timer */}
          {(callState === "connected" || callState === "dialing") && (
            <div className="text-lg font-mono font-bold tabular-nums">
              {formatTime(callDuration)}
            </div>
          )}
        </div>

        {/* Call controls */}
        {callState === "idle" && (
          <div className="flex items-center gap-2">
            <Button onClick={startCall} className="flex-1 gap-2 bg-green-600 hover:bg-green-700" disabled={!currentLead.phone}>
              <Phone className="h-4 w-4" />
              התקשר ל{currentLead.full_name}
            </Button>
            <Button variant="outline" size="icon" onClick={skipLead} title="דלג">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        )}

        {callState === "dialing" && (
          <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={skipLead} className="flex-1 gap-2">
              <PhoneOff className="h-4 w-4" />
              בטל חיוג
            </Button>
            <div className="flex items-center gap-1">
              <Volume2 className="h-4 w-4 text-muted-foreground animate-pulse" />
              <span className="text-xs text-muted-foreground">מצלצל...</span>
            </div>
          </div>
        )}

        {callState === "connected" && (
          <>
            <Textarea
              placeholder="רשום הערות תוך כדי שיחה..."
              value={callNotes}
              onChange={e => setCallNotes(e.target.value)}
              className="text-sm h-20 resize-none"
            />
            <div className="flex items-center gap-2">
              <Button variant="destructive" onClick={endCall} className="flex-1 gap-2">
                <PhoneOff className="h-4 w-4" />
                סיים שיחה
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className={cn(isMuted && "bg-destructive/10 text-destructive")}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPaused(!isPaused)}
                className={cn(isPaused && "bg-warning/10 text-warning")}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={skipLead} title="דלג">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {callState === "processing_ai" && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
            <span className="text-sm text-purple-500 font-medium">מנתח שיחה עם AI...</span>
          </div>
        )}

        {callState === "wrap_up" && (
          <div className="space-y-3">
            {/* AI Analysis Results */}
            {aiAnalysis && (
              <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-bold">ניתוח AI מכירתי</span>
                    <Badge className={cn("text-[10px]", sentimentConfig[aiAnalysis.sentiment].bg, sentimentConfig[aiAnalysis.sentiment].color)} variant="outline">
                      {sentimentConfig[aiAnalysis.sentiment].label}
                    </Badge>
                  </div>
                  {aiAnalysis.heatScore !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">חום:</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className={cn(
                            "w-1.5 h-3 rounded-sm",
                            i < (aiAnalysis.heatScore || 0)
                              ? i < 3 ? "bg-blue-400" : i < 7 ? "bg-yellow-400" : "bg-red-500"
                              : "bg-muted"
                          )} />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold">{aiAnalysis.heatScore}/10</span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">סיכום</p>
                  {aiAnalysis.summary.map((s, i) => (
                    <p key={i} className="text-xs text-foreground flex items-start gap-1">
                      <span className="text-primary mt-0.5">•</span>{s}
                    </p>
                  ))}
                </div>

                {/* Buying Signals */}
                {aiAnalysis.buyingSignals && aiAnalysis.buyingSignals.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">🟢 אותות קנייה</p>
                    {aiAnalysis.buyingSignals.map((s, i) => (
                      <p key={i} className="text-xs text-green-700 dark:text-green-400 flex items-start gap-1">
                        <span className="mt-0.5">✓</span>{s}
                      </p>
                    ))}
                  </div>
                )}

                {/* Objections */}
                {aiAnalysis.objections && aiAnalysis.objections.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">🔴 התנגדויות</p>
                    {aiAnalysis.objections.map((o, i) => (
                      <p key={i} className="text-xs text-red-700 dark:text-red-400 flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />{o}
                      </p>
                    ))}
                  </div>
                )}

                {/* Closing Line */}
                {aiAnalysis.closingLine && (
                  <div className="text-xs bg-green-500/10 rounded-lg px-3 py-2 border border-green-500/30">
                    <span className="font-bold text-green-700 dark:text-green-300">🎯 משפט הסגירה:</span>
                    <p className="text-green-800 dark:text-green-200 font-medium mt-0.5 leading-relaxed">"{aiAnalysis.closingLine}"</p>
                  </div>
                )}

                {/* Sales Technique */}
                {aiAnalysis.salesTechnique && (
                  <div className="text-xs bg-purple-500/10 rounded px-2 py-1.5 border border-purple-500/20">
                    <span className="font-medium text-purple-700 dark:text-purple-300">💡 טקטיקה:</span>{" "}
                    <span className="text-purple-600 dark:text-purple-400">{aiAnalysis.salesTechnique}</span>
                  </div>
                )}

                {/* Action Items */}
                {aiAnalysis.actionItems.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">משימות</p>
                    {aiAnalysis.actionItems.map((a, i) => (
                      <p key={i} className="text-xs flex items-start gap-1">
                        <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />{a}
                      </p>
                    ))}
                  </div>
                )}

                {aiAnalysis.nextStep && (
                  <div className="flex items-center gap-1 text-xs bg-primary/5 rounded px-2 py-1">
                    <ChevronRight className="h-3 w-3 text-primary" />
                    <span className="font-medium">צעד הבא:</span> {aiAnalysis.nextStep}
                  </div>
                )}
              </div>
            )}

            {/* Wrap-up controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  ליד הבא בעוד {wrapUpTimer} שניות
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" onClick={moveToNext} className="h-7 text-xs gap-1">
                  <ChevronRight className="h-3 w-3" />
                  הבא עכשיו
                </Button>
                <Button variant="outline" size="sm" onClick={skipLead} className="h-7 text-xs gap-1">
                  <SkipForward className="h-3 w-3" />
                  דלג
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Queue Preview */}
      {queue.length > 1 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">תור הבא</p>
          <div className="flex gap-1.5 overflow-x-auto">
            {queue.slice(currentIndex + 1, currentIndex + 4).map((lead, i) => (
              <div key={lead.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border/30 min-w-0 flex-shrink-0">
                <span className="text-[10px] text-muted-foreground">{currentIndex + 2 + i}.</span>
                <span className="text-[11px] font-medium truncate max-w-[80px]">{lead.full_name}</span>
              </div>
            ))}
            {queue.length - currentIndex - 1 > 3 && (
              <span className="text-[10px] text-muted-foreground self-center">+{queue.length - currentIndex - 4}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
