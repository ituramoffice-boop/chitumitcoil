import { useState, useRef, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Pen, Eraser, Undo2, Loader2, CheckCircle2, FileText, Upload, Brain,
  Sparkles, AlertTriangle, Plus, X, Download, MessageCircle, FileUp,
} from "lucide-react";

interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  mortgage_amount: number | null;
  property_value: number | null;
  monthly_income: number | null;
  status: string;
  sign_token?: string | null;
}

interface SmartField {
  id: string;
  label: string;
  value: string;
  type: string;
  required: boolean;
  placeholder?: string;
  source: "auto" | "manual";
}

interface MissingField {
  field: string;
  reason: string;
  priority: "critical" | "important" | "optional";
}

interface SmartPdfSignerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

const DOCUMENT_TYPES = [
  { value: "consultation", label: "הסכם ייעוץ משכנתא" },
  { value: "power_of_attorney", label: "ייפוי כוח" },
  { value: "fee_agreement", label: "הסכם שכר טרחה" },
  { value: "privacy_consent", label: "הסכמה לשימוש במידע" },
  { value: "custom", label: "מסמך מותאם אישית" },
];

export function SmartPdfSigner({ open, onOpenChange, lead }: SmartPdfSignerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sigRef = useRef<SignatureCanvas | null>(null);

  const [step, setStep] = useState<"setup" | "fields" | "sign">("setup");
  const [docType, setDocType] = useState("consultation");
  const [customContext, setCustomContext] = useState("");
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [useUploadedPdf, setUseUploadedPdf] = useState(false);

  const [fields, setFields] = useState<SmartField[]>([]);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [agreementText, setAgreementText] = useState("");
  const [additionalClauses, setAdditionalClauses] = useState<string[]>([]);
  const [enabledClauses, setEnabledClauses] = useState<Set<number>>(new Set());

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // AI Analysis
  const analyzeFields = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-fields", {
        body: {
          lead: {
            full_name: lead.full_name,
            phone: lead.phone,
            email: lead.email,
            mortgage_amount: lead.mortgage_amount,
            property_value: lead.property_value,
            monthly_income: lead.monthly_income,
          },
          documentType: DOCUMENT_TYPES.find(d => d.value === docType)?.label || docType,
          customFields: customContext || undefined,
        },
      });
      if (error) throw error;

      setFields(data.fields || []);
      setMissingFields(data.missingFields || []);
      setAgreementText(data.agreementText || "");
      setAdditionalClauses(data.additionalClauses || []);
      setEnabledClauses(new Set());
      setStep("fields");
      toast({ title: "ניתוח AI הושלם! ✨" });
    } catch (err: any) {
      toast({ title: "שגיאה בניתוח", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const updateField = (id: string, value: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, value, source: "manual" as const } : f));
  };

  const addCustomField = () => {
    const id = `custom_${Date.now()}`;
    setFields(prev => [...prev, {
      id, label: "שדה חדש", value: "", type: "text", required: false,
      placeholder: "ערך...", source: "manual",
    }]);
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const toggleClause = (idx: number) => {
    setEnabledClauses(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  // Signature
  const handleEnd = useCallback(() => {
    if (sigRef.current) setStrokes(prev => [...prev, sigRef.current!.toDataURL()]);
  }, []);
  const handleClear = () => { sigRef.current?.clear(); setStrokes([]); };
  const handleUndo = () => {
    if (!sigRef.current || strokes.length <= 1) { handleClear(); return; }
    const ns = strokes.slice(0, -1);
    setStrokes(ns);
    sigRef.current.clear();
    if (ns.length > 0) sigRef.current.fromDataURL(ns[ns.length - 1]);
  };
  const isEmpty = () => sigRef.current?.isEmpty() ?? true;

  // PDF Generation
  const generateSmartPDF = useCallback((): Blob => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 25;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, w, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("SmartMortgage", w / 2, 18, { align: "center" });
    doc.setFontSize(10);
    const typeLabel = DOCUMENT_TYPES.find(d => d.value === docType)?.label || "Digital Agreement";
    doc.text(typeLabel, w / 2, 28, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y = 55;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(typeLabel, w / 2, y, { align: "center" });
    y += 15;

    // Fields section
    const filledFields = fields.filter(f => f.value);
    if (filledFields.length > 0) {
      const boxH = Math.max(55, filledFields.length * 7 + 20);
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, w - margin * 2, boxH, 3, 3, "FD");
      y += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Document Details", margin + 5, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      filledFields.forEach(field => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text(`${field.label}:`, margin + 5, y);
        doc.setFont("helvetica", "normal");
        const displayValue = field.type === "currency" && field.value
          ? `ILS ${Number(field.value).toLocaleString()}`
          : field.value;
        doc.text(displayValue || "N/A", margin + 55, y);
        y += 6;
      });
      y += 15;
    }

    // Agreement text
    if (agreementText) {
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Terms & Conditions", margin, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(agreementText, w - margin * 2);
      lines.forEach((line: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 5;
      });
      y += 5;
    }

    // Additional clauses
    const activeClauses = additionalClauses.filter((_, i) => enabledClauses.has(i));
    if (activeClauses.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Additional Clauses", margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      activeClauses.forEach((clause, i) => {
        const clauseLines = doc.splitTextToSize(`${i + 1}. ${clause}`, w - margin * 2);
        clauseLines.forEach((line: string) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, margin, y);
          y += 5;
        });
        y += 2;
      });
      y += 5;
    }

    // Date
    if (y > 250) { doc.addPage(); y = 20; }
    const now = new Date();
    doc.setFontSize(10);
    doc.text(`Date: ${now.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" })}`, margin, y);
    y += 15;

    // Signature
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setDrawColor(100, 100, 100);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y + 30, w / 2 - 10, y + 30);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Client Signature", margin, y + 36);
    doc.setTextColor(0, 0, 0);

    if (sigRef.current && !sigRef.current.isEmpty()) {
      doc.addImage(sigRef.current.toDataURL("image/png"), "PNG", margin, y, 60, 28);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by SmartMortgage AI Platform | ${now.toISOString()}`, w / 2, footerY, { align: "center" });

    return doc.output("blob");
  }, [fields, agreementText, additionalClauses, enabledClauses, docType]);

  // Save
  const handleSave = async () => {
    if (isEmpty()) {
      toast({ title: "נא לחתום לפני השמירה", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const pdfBlob = generateSmartPDF();
      const fileName = `smart_${docType}_${lead.id}_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("signed-documents")
        .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("signed-documents").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("leads")
        .update({
          signed_at: new Date().toISOString(),
          signature_url: urlData.publicUrl,
          status: "approved" as any,
        })
        .eq("id", lead.id);
      if (updateError) throw updateError;

      if (user) {
        await supabase.from("activity_log").insert({
          lead_id: lead.id,
          user_id: user.id,
          activity_type: "signature",
          title: `חתימה דיגיטלית — ${DOCUMENT_TYPES.find(d => d.value === docType)?.label}`,
          description: `${lead.full_name} חתם על ${DOCUMENT_TYPES.find(d => d.value === docType)?.label}`,
          metadata: { signature_url: urlData.publicUrl, document_type: docType, fields_count: fields.length },
        });
      }

      // WhatsApp
      if (sendWhatsApp && lead.phone) {
        const cleanPhone = lead.phone.replace(/\D/g, "");
        const intlPhone = cleanPhone.startsWith("0") ? `972${cleanPhone.slice(1)}` : cleanPhone;
        const message = encodeURIComponent(
          `שלום ${lead.full_name} 👋\n\nהמסמך שלך נחתם בהצלחה ✅\nלהורדת המסמך החתום:\n${urlData.publicUrl}\n\nתודה, SmartMortgage 🏠`
        );
        window.open(`https://wa.me/${intlPhone}?text=${message}`, "_blank");
      }

      queryClient.invalidateQueries({ queryKey: ["signature-management"] });
      queryClient.invalidateQueries({ queryKey: ["lead-management"] });
      toast({ title: "המסמך נחתם ונשמר בהצלחה! ✅" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPreview = () => {
    const blob = generateSmartPDF();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `preview_${docType}_${lead.full_name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            חתימה חכמה על PDF — {lead.full_name}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-2">
          {["setup", "fields", "sign"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                step === s ? "bg-primary text-primary-foreground" :
                  ["setup", "fields", "sign"].indexOf(step) > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>{i + 1}</div>
              <span className={cn("text-xs", step === s ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s === "setup" ? "הגדרה" : s === "fields" ? "שדות חכמים" : "חתימה"}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Setup */}
        {step === "setup" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>סוג מסמך</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(dt => (
                    <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {docType === "custom" && (
              <div className="space-y-2">
                <Label>תיאור המסמך</Label>
                <Textarea
                  value={customContext}
                  onChange={e => setCustomContext(e.target.value)}
                  placeholder="תאר את סוג המסמך שברצונך ליצור..."
                  rows={3}
                />
              </div>
            )}

            {/* Upload existing PDF */}
            <div className="p-4 rounded-lg border border-dashed border-border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">העלאת PDF קיים (אופציונלי)</span>
                </div>
                <Switch checked={useUploadedPdf} onCheckedChange={setUseUploadedPdf} />
              </div>
              {useUploadedPdf && (
                <div>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={e => setUploadedPdf(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  {uploadedPdf && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📄 {uploadedPdf.name} ({(uploadedPdf.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Lead preview */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "שם", value: lead.full_name },
                { label: "סכום משכנתא", value: lead.mortgage_amount ? `₪${lead.mortgage_amount.toLocaleString()}` : "—" },
                { label: "הכנסה", value: lead.monthly_income ? `₪${lead.monthly_income.toLocaleString()}` : "—" },
              ].map(item => (
                <div key={item.label} className="p-2 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="font-bold text-xs">{item.value}</p>
                </div>
              ))}
            </div>

            <Button onClick={analyzeFields} disabled={analyzing} className="w-full" size="lg">
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Brain className="h-4 w-4 ml-2" />
              )}
              {analyzing ? "AI מנתח את המסמך..." : "התחל ניתוח AI חכם"}
            </Button>
          </div>
        )}

        {/* Step 2: Smart Fields */}
        {step === "fields" && (
          <div className="space-y-4">
            {/* Missing fields warning */}
            {missingFields.filter(m => m.priority === "critical").length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1">
                <p className="text-sm font-semibold flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  שדות חסרים קריטיים
                </p>
                {missingFields.filter(m => m.priority === "critical").map((mf, i) => (
                  <p key={i} className="text-xs text-destructive/80">• {mf.reason}</p>
                ))}
              </div>
            )}

            {/* Fields grid */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {fields.map(field => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">{field.label}</Label>
                      {field.source === "auto" && field.value && (
                        <Badge variant="outline" className="text-[10px] h-4 bg-primary/5 text-primary border-primary/20">
                          <Sparkles className="h-2.5 w-2.5 ml-0.5" />
                          מילוי אוטומטי
                        </Badge>
                      )}
                      {field.required && <span className="text-destructive text-[10px]">*</span>}
                    </div>
                    <Input
                      value={field.value || ""}
                      onChange={e => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder || `הזן ${field.label}...`}
                      className="h-8 text-sm"
                      type={field.type === "email" ? "email" : field.type === "number" || field.type === "currency" ? "number" : "text"}
                    />
                  </div>
                  {!field.required && field.id.startsWith("custom_") && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 mt-5" onClick={() => removeField(field.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addCustomField} className="text-xs gap-1">
              <Plus className="h-3 w-3" /> הוסף שדה מותאם
            </Button>

            {/* Additional clauses */}
            {additionalClauses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">סעיפים נוספים (AI מומלץ)</p>
                {additionalClauses.map((clause, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                    <Switch
                      checked={enabledClauses.has(i)}
                      onCheckedChange={() => toggleClause(i)}
                      className="mt-0.5"
                    />
                    <p className={cn("text-xs flex-1", enabledClauses.has(i) ? "text-foreground" : "text-muted-foreground")}>
                      {clause}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("setup")} className="flex-1">חזור</Button>
              <Button onClick={() => setStep("sign")} className="flex-1">המשך לחתימה</Button>
            </div>
          </div>
        )}

        {/* Step 3: Sign */}
        {step === "sign" && (
          <div className="space-y-4">
            {/* Signature Pad */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Pen className="h-4 w-4 text-primary" />
                  חתום כאן
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={handleUndo} className="h-7 text-xs">
                    <Undo2 className="h-3 w-3 ml-1" />בטל
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs text-destructive hover:text-destructive">
                    <Eraser className="h-3 w-3 ml-1" />נקה
                  </Button>
                </div>
              </div>
              <div className="relative border-2 border-dashed border-primary/30 rounded-xl overflow-hidden bg-white dark:bg-slate-950 hover:border-primary/50 transition-colors">
                <SignatureCanvas
                  ref={sigRef}
                  penColor="#1e40af"
                  canvasProps={{ className: "w-full", style: { width: "100%", height: 180 } }}
                  onEnd={handleEnd}
                  dotSize={2} minWidth={1.5} maxWidth={3} velocityFilterWeight={0.7}
                />
                {isEmpty() && strokes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground/40 text-sm">חתום בעזרת העכבר או המסך</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs space-y-1">
              <p className="font-semibold text-sm">סיכום המסמך:</p>
              <p>📄 סוג: {DOCUMENT_TYPES.find(d => d.value === docType)?.label}</p>
              <p>📝 שדות: {fields.filter(f => f.value).length} מתוך {fields.length}</p>
              <p>📋 סעיפים נוספים: {enabledClauses.size}</p>
            </div>

            {/* WhatsApp toggle */}
            {lead.phone && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">שלח PDF חתום בוואטסאפ</span>
                </div>
                <Switch checked={sendWhatsApp} onCheckedChange={setSendWhatsApp} />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("fields")} className="flex-1">חזור</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <CheckCircle2 className="h-4 w-4 ml-2" />}
                {saving ? "שומר..." : "חתום ושמור"}
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownloadPreview} title="תצוגה מקדימה">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              בלחיצה על "חתום ושמור" אתה מאשר את תנאי ההסכם. המסמך ישמר באופן מאובטח.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
