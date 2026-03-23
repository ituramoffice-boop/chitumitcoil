import { useState, useRef, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Pen, Eraser, Undo2, Download, Loader2, CheckCircle2, FileText,
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
  notes: string | null;
  created_at: string;
}

interface SignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

// Hebrew-safe PDF text helper (reverses Hebrew text for jsPDF)
function hebrewLine(text: string): string {
  // jsPDF doesn't natively support RTL — we reverse Hebrew segments
  return text.split("").reverse().join("");
}

export function SignatureModal({ open, onOpenChange, lead }: SignatureModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [saving, setSaving] = useState(false);
  const [strokes, setStrokes] = useState<string[]>([]);

  const handleEnd = useCallback(() => {
    if (sigRef.current) {
      setStrokes(prev => [...prev, sigRef.current!.toDataURL()]);
    }
  }, []);

  const handleClear = () => {
    sigRef.current?.clear();
    setStrokes([]);
  };

  const handleUndo = () => {
    if (!sigRef.current || strokes.length <= 1) {
      handleClear();
      return;
    }
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    sigRef.current.clear();
    if (newStrokes.length > 0) {
      sigRef.current.fromDataURL(newStrokes[newStrokes.length - 1]);
    }
  };

  const isEmpty = () => sigRef.current?.isEmpty() ?? true;

  const generatePDF = useCallback((): Blob => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 25;

    // Header bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, w, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("SmartMortgage", w / 2, 18, { align: "center" });
    doc.setFontSize(10);
    doc.text("Digital Agreement", w / 2, 28, { align: "center" });
    doc.setTextColor(0, 0, 0);

    y = 55;

    // Agreement title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Mortgage Consultation Agreement", w / 2, y, { align: "center" });
    y += 15;

    // Lead details section
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

    // Agreement text
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

    terms.forEach(term => {
      doc.text(term, margin, y);
      y += 6;
    });

    y += 10;

    // Date
    const now = new Date();
    const dateStr = now.toLocaleDateString("he-IL", {
      year: "numeric", month: "long", day: "numeric",
    });
    doc.setFontSize(10);
    doc.text(`Date: ${dateStr}`, margin, y);
    y += 15;

    // Signature area
    doc.setDrawColor(100, 100, 100);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y + 30, w / 2 - 10, y + 30);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Client Signature", margin, y + 36);
    doc.setTextColor(0, 0, 0);

    // Embed signature image
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const sigData = sigRef.current.toDataURL("image/png");
      doc.addImage(sigData, "PNG", margin, y, 60, 28);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated by SmartMortgage AI Platform | ${now.toISOString()}`,
      w / 2, footerY, { align: "center" }
    );

    return doc.output("blob");
  }, [lead]);

  const handleSave = async () => {
    if (isEmpty()) {
      toast({ title: "נא לחתום לפני השמירה", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // 1. Generate PDF
      const pdfBlob = generatePDF();
      const fileName = `agreement_${lead.id}_${Date.now()}.pdf`;

      // 2. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("signed-documents")
        .upload(fileName, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from("signed-documents")
        .getPublicUrl(fileName);

      // 4. Update lead record
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          signed_at: new Date().toISOString(),
          signature_url: urlData.publicUrl,
          status: "approved" as any,
        })
        .eq("id", lead.id);
      if (updateError) throw updateError;

      // 5. Log activity
      if (user) {
        await supabase.from("activity_log").insert({
          lead_id: lead.id,
          user_id: user.id,
          activity_type: "signature",
          title: "חתימה דיגיטלית",
          description: `${lead.full_name} חתם על הסכם ייעוץ משכנתא`,
          metadata: { signature_url: urlData.publicUrl },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["lead-management"] });
      toast({ title: "ההסכם נחתם ונשמר בהצלחה! ✅" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "שגיאה בשמירה", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPreview = () => {
    const pdfBlob = generatePDF();
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agreement_preview_${lead.full_name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            חתימה דיגיטלית — {lead.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lead Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">סכום משכנתא</p>
              <p className="font-bold text-sm">
                {lead.mortgage_amount ? `₪${lead.mortgage_amount.toLocaleString()}` : "—"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">שווי נכס</p>
              <p className="font-bold text-sm">
                {lead.property_value ? `₪${lead.property_value.toLocaleString()}` : "—"}
              </p>
            </div>
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
                  <Undo2 className="h-3 w-3 ml-1" />
                  בטל
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs text-destructive hover:text-destructive">
                  <Eraser className="h-3 w-3 ml-1" />
                  נקה
                </Button>
              </div>
            </div>
            <div className="relative border-2 border-dashed border-primary/30 rounded-xl overflow-hidden bg-white dark:bg-slate-950 transition-colors hover:border-primary/50">
              <SignatureCanvas
                ref={sigRef}
                penColor="#1e40af"
                canvasProps={{
                  className: "w-full",
                  style: { width: "100%", height: 200 },
                }}
                onEnd={handleEnd}
                dotSize={2}
                minWidth={1.5}
                maxWidth={3}
                velocityFilterWeight={0.7}
              />
              {isEmpty() && strokes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-muted-foreground/40 text-sm">חתום בעזרת העכבר או המסך</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 ml-2" />
              )}
              {saving ? "שומר..." : "חתום ושמור הסכם"}
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownloadPreview} title="הורד תצוגה מקדימה">
              <Download className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            בלחיצה על "חתום ושמור" אתה מאשר את תנאי ההסכם. המסמך ישמר באופן מאובטח.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
