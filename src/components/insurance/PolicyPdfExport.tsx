import jsPDF from "jspdf";
import { toast } from "sonner";

const POLICY_TYPES: Record<string, string> = {
  life: "חיים",
  health: "בריאות",
  car: "רכב",
  home: "דירה",
  business: "עסק",
  pension: "פנסיה",
  disability: "אובדן כושר",
};

const STATUS_LABELS: Record<string, string> = {
  active: "פעילה",
  expired: "פג תוקף",
  claim: "תביעה",
  cancelled: "בוטלה",
};

interface PolicyData {
  policy_number: string;
  client_name: string;
  policy_type: string;
  insurance_company: string;
  monthly_premium: number;
  coverage_amount: number;
  status: string;
  end_date: string;
}

export async function exportPoliciesToPdf(
  policies: PolicyData[],
  agentName: string
) {
  try {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // --- Load Hebrew font ---
    // jsPDF default fonts don't support Hebrew, so we use a workaround:
    // Draw text right-aligned and reverse chars for display
    const reverseHebrew = (text: string): string => {
      // Split by spaces, reverse each Hebrew segment order
      return text.split("").reverse().join("");
    };

    // Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageW, pageH, "F");

    // Gold header bar
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 0, pageW, 28, "F");

    // Header text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    const title = reverseHebrew("דוח פוליסות ביטוח");
    doc.text(title, pageW - 15, 12, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const subtitle = reverseHebrew(`סוכן: ${agentName}`);
    doc.text(subtitle, pageW - 15, 20, { align: "right" });

    const dateStr = new Date().toLocaleDateString("he-IL");
    const dateLabel = reverseHebrew(`תאריך: ${dateStr}`);
    doc.text(dateLabel, 15, 20, { align: "left" });

    // Logo placeholder — gold circle with ח
    doc.setFillColor(212, 175, 55);
    doc.circle(25, 14, 8, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("C", 25, 17, { align: "center" }); // Chitumit initial

    // Summary cards
    const totalPolicies = policies.length;
    const activePolicies = policies.filter((p) => p.status === "active").length;
    const totalPremium = policies.reduce((s, p) => s + p.monthly_premium, 0);
    const totalCoverage = policies.reduce((s, p) => s + p.coverage_amount, 0);

    const summaryY = 36;
    const cardW = 55;
    const cardH = 18;
    const gap = 8;
    const startX = (pageW - (4 * cardW + 3 * gap)) / 2;

    const summaryItems = [
      { label: reverseHebrew("סה״כ פוליסות"), value: totalPolicies.toString() },
      { label: reverseHebrew("פעילות"), value: activePolicies.toString() },
      { label: reverseHebrew("פרמיה חודשית"), value: `₪${totalPremium.toLocaleString()}` },
      { label: reverseHebrew("כיסוי כולל"), value: `₪${totalCoverage.toLocaleString()}` },
    ];

    summaryItems.forEach((item, i) => {
      const x = startX + i * (cardW + gap);
      doc.setFillColor(30, 41, 59); // slate-800
      doc.roundedRect(x, summaryY, cardW, cardH, 3, 3, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(212, 175, 55);
      doc.text(item.value, x + cardW / 2, summaryY + 8, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(item.label, x + cardW / 2, summaryY + 14, { align: "center" });
    });

    // Table
    const tableY = 62;
    const colWidths = [30, 40, 25, 30, 35, 40, 25, 35];
    const headers = [
      reverseHebrew("סטטוס"),
      reverseHebrew("כיסוי"),
      reverseHebrew("פרמיה"),
      reverseHebrew("חברה"),
      reverseHebrew("סוג"),
      reverseHebrew("לקוח"),
      reverseHebrew("מס׳ פוליסה"),
      reverseHebrew("תוקף"),
    ].reverse();

    // Table header
    doc.setFillColor(30, 41, 59);
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableStartX = (pageW - tableWidth) / 2;
    doc.roundedRect(tableStartX, tableY, tableWidth, 10, 2, 2, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 175, 55);

    let hx = tableStartX;
    headers.forEach((h, i) => {
      doc.text(h, hx + colWidths[i] / 2, tableY + 7, { align: "center" });
      hx += colWidths[i];
    });

    // Table rows
    let rowY = tableY + 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    policies.forEach((p, idx) => {
      if (rowY > pageH - 20) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageW, pageH, "F");
        rowY = 15;
      }

      // Alternate row bg
      if (idx % 2 === 0) {
        doc.setFillColor(22, 33, 50);
        doc.rect(tableStartX, rowY - 4, tableWidth, 9, "F");
      }

      doc.setTextColor(226, 232, 240);
      const rowData = [
        p.end_date || "—",
        p.policy_number,
        reverseHebrew(p.client_name),
        reverseHebrew(POLICY_TYPES[p.policy_type] || p.policy_type),
        reverseHebrew(p.insurance_company),
        `₪${p.monthly_premium.toLocaleString()}`,
        p.coverage_amount > 0 ? `₪${p.coverage_amount.toLocaleString()}` : "—",
        reverseHebrew(STATUS_LABELS[p.status] || p.status),
      ];

      let rx = tableStartX;
      rowData.forEach((cell, i) => {
        doc.text(cell, rx + colWidths[i] / 2, rowY + 2, { align: "center" });
        rx += colWidths[i];
      });

      rowY += 9;
    });

    // Footer
    const footerY = pageH - 10;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.3);
    doc.line(20, footerY - 3, pageW - 20, footerY - 3);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Powered by Chitumit Insurance Platform", pageW / 2, footerY, { align: "center" });
    doc.text("CONFIDENTIAL", 15, footerY, { align: "left" });

    doc.save(`insurance-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("הדוח יוצא בהצלחה כ-PDF");
  } catch (err) {
    console.error("PDF export error:", err);
    toast.error("שגיאה ביצוא הדוח");
  }
}
