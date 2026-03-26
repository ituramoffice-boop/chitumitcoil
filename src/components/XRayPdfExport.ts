import jsPDF from "jspdf";
import { toast } from "sonner";

interface XRayInsight {
  source: string;
  severity: "opportunity" | "warning" | "alert";
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
}

const reverseHebrew = (text: string): string => text.split("").reverse().join("");

const SEVERITY_LABELS: Record<string, string> = {
  opportunity: "הזדמנות",
  warning: "אזהרה",
  alert: "התראה",
};

export function exportXRayToPdf(insights: XRayInsight[], clientName?: string) {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, pageH, "F");

    // Gold header bar
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 0, pageW, 32, "F");

    // Logo circle
    doc.setFillColor(15, 23, 42);
    doc.circle(pageW / 2, 16, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 175, 55);
    doc.text("C", pageW / 2, 19, { align: "center" });

    // Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Financial X-Ray Report", pageW / 2, 12, { align: "center" });

    // Subtitle
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleDateString("he-IL");
    doc.text(`360° AI Scanner  |  ${dateStr}`, pageW / 2, 28, { align: "center" });

    // Client info bar
    let y = 40;
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(15, y, pageW - 30, 14, 3, 3, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 175, 55);
    if (clientName) {
      doc.text(reverseHebrew(`לקוח: ${clientName}`), pageW - 22, y + 9, { align: "right" });
    }
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`${insights.length} AI Findings`, 22, y + 9, { align: "left" });

    // Summary cards
    y = 62;
    const opportunities = insights.filter(i => i.severity === "opportunity").length;
    const warnings = insights.filter(i => i.severity === "warning").length;
    const alerts = insights.filter(i => i.severity === "alert").length;

    const summaryCards = [
      { label: reverseHebrew("הזדמנויות"), value: opportunities.toString(), color: [0, 188, 212] },
      { label: reverseHebrew("אזהרות"), value: warnings.toString(), color: [251, 191, 36] },
      { label: reverseHebrew("התראות"), value: alerts.toString(), color: [248, 113, 113] },
      { label: reverseHebrew("סה״כ ממצאים"), value: insights.length.toString(), color: [212, 175, 55] },
    ];

    const cardW = 38;
    const cardGap = 6;
    const totalCardsW = 4 * cardW + 3 * cardGap;
    const cardsStartX = (pageW - totalCardsW) / 2;

    summaryCards.forEach((card, i) => {
      const cx = cardsStartX + i * (cardW + cardGap);
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(cx, y, cardW, 20, 3, 3, "F");

      // Top accent line
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.rect(cx + 2, y, cardW - 4, 1.5, "F");

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.text(card.value, cx + cardW / 2, y + 11, { align: "center" });

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(card.label, cx + cardW / 2, y + 17, { align: "center" });
    });

    // Insights section
    y = 92;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 175, 55);
    doc.text("AI Discovery Findings", pageW / 2, y, { align: "center" });

    y += 8;

    insights.forEach((insight, idx) => {
      // Check page overflow
      if (y > pageH - 40) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageW, pageH, "F");
        y = 20;
      }

      const cardH = 38;
      const severityColor = insight.severity === "opportunity"
        ? [0, 188, 212] : insight.severity === "warning"
        ? [251, 191, 36] : [248, 113, 113];

      // Card bg
      doc.setFillColor(22, 33, 50);
      doc.roundedRect(15, y, pageW - 30, cardH, 3, 3, "F");

      // Left accent bar
      doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.rect(pageW - 17, y + 2, 2, cardH - 4, "F");

      // Severity badge
      doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.roundedRect(pageW - 55, y + 3, 36, 6, 2, 2, "F");
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const sevLabel = reverseHebrew(SEVERITY_LABELS[insight.severity] || insight.severity);
      doc.text(`AI Alert: ${sevLabel}`, pageW - 37, y + 7.5, { align: "center" });

      // Source badge
      doc.setFillColor(30, 41, 59);
      doc.setDrawColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(pageW - 95, y + 3, 36, 6, 2, 2, "FD");
      doc.setFontSize(6);
      doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.text(reverseHebrew(insight.source), pageW - 77, y + 7.5, { align: "center" });

      // Title
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(226, 232, 240);
      doc.text(reverseHebrew(insight.title), pageW - 22, y + 16, { align: "right" });

      // Description
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      const descLines = doc.splitTextToSize(reverseHebrew(insight.description), pageW - 50);
      doc.text(descLines.slice(0, 2), pageW - 22, y + 22, { align: "right" });

      // Metric box
      doc.setFillColor(30, 41, 59);
      doc.setDrawColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(18, y + 28, 45, 8, 2, 2, "FD");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.text(insight.metric, 40, y + 33.5, { align: "center" });

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(reverseHebrew(insight.metricLabel), 68, y + 33.5, { align: "left" });

      y += cardH + 5;
    });

    // Footer
    y = pageH - 12;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.3);
    doc.line(20, y - 3, pageW - 20, y - 3);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Powered by Chitumit Financial X-Ray  |  AI-Generated Report", pageW / 2, y, { align: "center" });
    doc.setFontSize(6);
    doc.text("CONFIDENTIAL", 15, y, { align: "left" });
    doc.text(reverseHebrew("אין באמור ייעוץ פיננסי או ביטוחי"), pageW - 15, y + 4, { align: "right" });

    doc.save(`financial-xray-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("דוח Financial X-Ray יוצא בהצלחה");
  } catch (err) {
    console.error("X-Ray PDF export error:", err);
    toast.error("שגיאה ביצוא הדוח");
  }
}
