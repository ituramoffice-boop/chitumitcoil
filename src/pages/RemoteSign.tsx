import { useState, useRef, useCallback, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Pen, Eraser, Undo2, Loader2, CheckCircle2, FileText, ShieldCheck, Building2,
} from "lucide-react";
import { useParams } from "react-router-dom";

interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  mortgage_amount: number | null;
  property_value: number | null;
  monthly_income: number | null;
  status: string;
  signed_at: string | null;
  signature_url: string | null;
  sign_token: string | null;
}

export default function RemoteSign() {
  const { token } = useParams<{ token: string }>();
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signed, setSigned] = useState(false);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const EXPIRY_DAYS = 7;

  useEffect(() => {
    if (!token) { setError("קישור לא תקין"); setLoading(false); return; }
    (async () => {
      const { data, error: fetchError } = await supabase
        .from("leads")
        .select("*")
        .eq("sign_token", token)
        .single();
      if (fetchError || !data) {
        setError("הקישור לא נמצא או פג תוקף");
      } else {
        const leadData = data as unknown as Lead;
        // Check expiration
        const created = new Date(leadData.created_at || "");
        const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (!leadData.signed_at && diffDays > EXPIRY_DAYS) {
          setError("הקישור פג תוקף. אנא פנה ליועץ המשכנתא שלך לקבלת קישור חדש.");
        } else {
          setLead(leadData);
          if (leadData.signed_at) setSigned(true);
        }
      }
      setLoading(false);
    })();
  }, [token]);

  const handleEnd = useCallback(() => {
    if (sigRef.current) setStrokes(prev => [...prev, sigRef.current!.toDataURL()]);
  }, []);

  const handleClear = () => { sigRef.current?.clear(); setStrokes([]); };

  const handleUndo = () => {
    if (!sigRef.current || strokes.length <= 1) { handleClear(); return; }
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    sigRef.current.clear();
    if (newStrokes.length > 0) sigRef.current.fromDataURL(newStrokes[newStrokes.length - 1]);
  };

  const isEmpty = () => sigRef.current?.isEmpty() ?? true;

  const generatePDF = useCallback((): Blob => {
    if (!lead) throw new Error("No lead");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 25;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, w, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("SmartMortgage", w / 2, 18, { align: "center" });
    doc.setFontSize(10);
    doc.text("Digital Agreement - Remote Signing", w / 2, 28, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y = 55;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Mortgage Consultation Agreement", w / 2, y, { align: "center" });
    y += 15;

    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, w - margin * 2, 55, 3, 3, "FD");
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Client Details", margin + 5, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const details = [
      ["Full Name", lead.full_name],
      ["Phone", lead.phone || "N/A"],
      ["Email", lead.email || "N/A"],
      ["Mortgage Amount", lead.mortgage_amount ? `ILS ${lead.mortgage_amount.toLocaleString()}` : "N/A"],
      ["Property Value", lead.property_value ? `ILS ${lead.property_value.toLocaleString()}` : "N/A"],
      ["Monthly Income", lead.monthly_income ? `ILS ${lead.monthly_income.toLocaleString()}` : "N/A"],
    ];
    details.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin + 5, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 50, y);
      y += 6;
    });
    y += 15;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const terms = [
      "1. The client authorizes SmartMortgage to process their mortgage application.",
      "2. All personal information will be handled in accordance with privacy regulations.",
      "3. The client confirms the accuracy of all provided financial information.",
      "4. SmartMortgage will compare offers from multiple banking institutions.",
      "5. This agreement does not constitute a binding financial commitment.",
      "6. Consultation fees, if applicable, will be disclosed separately.",
      "7. The client may terminate this agreement at any time with written notice.",
    ];
    terms.forEach(term => { doc.text(term, margin, y); y += 6; });
    y += 10;

    const now = new Date();
    doc.setFontSize(10);
    doc.text(`Date: ${now.toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" })}`, margin, y);
    y += 15;

    doc.setDrawColor(100, 100, 100);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y + 30, w / 2 - 10, y + 30);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Client Signature (Remote)", margin, y + 36);
    doc.setTextColor(0, 0, 0);

    if (sigRef.current && !sigRef.current.isEmpty()) {
      doc.addImage(sigRef.current.toDataURL("image/png"), "PNG", margin, y, 60, 28);
    }

    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by SmartMortgage AI Platform | Remote Sign | ${now.toISOString()}`, w / 2, footerY, { align: "center" });

    return doc.output("blob");
  }, [lead]);

  const handleSign = async () => {
    if (isEmpty() || !lead) {
      toast({ title: "נא לחתום לפני השליחה", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const pdfBlob = generatePDF();
      const fileName = `remote_agreement_${lead.id}_${Date.now()}.pdf`;

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
        .eq("sign_token", token);
      if (updateError) throw updateError;

      setSigned(true);
      toast({ title: "ההסכם נחתם בהצלחה! ✅" });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <FileText className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">הקישור לא תקין</h2>
            <p className="text-muted-foreground text-sm">{error || "לא נמצא מסמך לחתימה"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">ההסכם נחתם בהצלחה!</h2>
            <p className="text-muted-foreground">תודה {lead.full_name}, ההסכם נשמר במערכת ויועץ המשכנתא שלך יקבל עדכון.</p>
            {lead.signature_url && (
              <Button variant="outline" onClick={() => window.open(lead.signature_url!, "_blank")}>
                <FileText className="h-4 w-4 ml-2" />
                הורד עותק חתום
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-lg w-full shadow-xl border-border/50">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SmartMortgage</span>
          </div>
          <CardTitle className="text-lg">חתימה דיגיטלית על הסכם ייעוץ</CardTitle>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            חתימה מאובטחת ומוצפנת
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Lead Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">שם מלא</p>
              <p className="font-bold text-sm">{lead.full_name}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">סכום משכנתא</p>
              <p className="font-bold text-sm">
                {lead.mortgage_amount ? `₪${lead.mortgage_amount.toLocaleString()}` : "—"}
              </p>
            </div>
          </div>

          {/* Terms summary */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-sm mb-2">עיקרי ההסכם:</p>
            <p>• הלקוח מאשר לSmartMortgage לטפל בבקשת המשכנתא</p>
            <p>• כל המידע האישי יטופל בהתאם לתקנות הפרטיות</p>
            <p>• ההסכם אינו מהווה התחייבות פיננסית מחייבת</p>
            <p>• ניתן לבטל את ההסכם בכל עת בהודעה בכתב</p>
          </div>

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
            <div className="relative border-2 border-dashed border-primary/30 rounded-xl overflow-hidden bg-white dark:bg-slate-950 transition-colors hover:border-primary/50">
              <SignatureCanvas
                ref={sigRef}
                penColor="#1e40af"
                canvasProps={{ className: "w-full", style: { width: "100%", height: 200 } }}
                onEnd={handleEnd}
                dotSize={2}
                minWidth={1.5}
                maxWidth={3}
                velocityFilterWeight={0.7}
              />
              {isEmpty() && strokes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-muted-foreground/40 text-sm">חתום בעזרת האצבע או העכבר</p>
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleSign} disabled={saving} className="w-full" size="lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <CheckCircle2 className="h-4 w-4 ml-2" />}
            {saving ? "שומר חתימה..." : "חתום ואשר הסכם"}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            בלחיצה על "חתום ואשר" אתה מאשר את תנאי ההסכם. המסמך ישמר באופן מאובטח.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
