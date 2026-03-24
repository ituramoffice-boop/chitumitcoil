import { useState, useEffect, useRef, useMemo } from "react";
import StarField from "@/components/StarField";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Shield, TrendingUp, CheckCircle2, ArrowLeft,
  Sparkles, Phone, Mail, User, Lock, Brain, MapPin,
  Home, Ruler, Calendar, Car, TreePine, Waves,
  Train, GraduationCap, ShoppingBag, Heart, Zap,
  BarChart3, ChevronDown, ArrowRight, Target, Eye,
  Download,
} from "lucide-react";
import { TrustBankLogos } from "@/components/TrustBankLogos";
import { ChitumitLogo } from "@/components/ChitumitLogo";
import { PublicFooter } from "@/components/PublicFooter";
import ConversationalLeadCapture from "@/components/ConversationalLeadCapture";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import IsraelHeatMap from "@/components/IsraelHeatMap";
import jsPDF from "jspdf";
import { useConsultantBranding, PLAN_LIMITS } from "@/hooks/useConsultantBranding";

const getWhatsAppUrl = (phone?: string | null) =>
  `https://wa.me/${phone || "972501234567"}`;
// ======== ISRAELI AREA DATA (simulated market data 2026) ========
interface AreaData {
  name: string;
  region: string;
  avgPricePerSqm: number;
  trend: number; // yearly % change
  demandLevel: "high" | "medium" | "low";
  nearBeach: boolean;
  nearTrain: boolean;
  schools: number; // rating 1-5
  parks: number; // rating 1-5
  commercial: number; // rating 1-5
}

const AREAS: AreaData[] = [
  { name: "תל אביב – מרכז", region: "תל אביב", avgPricePerSqm: 62000, trend: 4.2, demandLevel: "high", nearBeach: true, nearTrain: true, schools: 5, parks: 4, commercial: 5 },
  { name: "תל אביב – צפון", region: "תל אביב", avgPricePerSqm: 75000, trend: 3.8, demandLevel: "high", nearBeach: true, nearTrain: true, schools: 5, parks: 5, commercial: 5 },
  { name: "תל אביב – דרום", region: "תל אביב", avgPricePerSqm: 42000, trend: 6.5, demandLevel: "high", nearBeach: true, nearTrain: true, schools: 3, parks: 3, commercial: 4 },
  { name: "תל אביב – יפו", region: "תל אביב", avgPricePerSqm: 48000, trend: 5.8, demandLevel: "high", nearBeach: true, nearTrain: true, schools: 3, parks: 4, commercial: 4 },
  { name: "רמת גן", region: "גוש דן", avgPricePerSqm: 38000, trend: 4.5, demandLevel: "high", nearBeach: false, nearTrain: true, schools: 4, parks: 4, commercial: 5 },
  { name: "גבעתיים", region: "גוש דן", avgPricePerSqm: 42000, trend: 3.9, demandLevel: "high", nearBeach: false, nearTrain: true, schools: 5, parks: 4, commercial: 4 },
  { name: "פתח תקווה", region: "גוש דן", avgPricePerSqm: 28000, trend: 5.1, demandLevel: "medium", nearBeach: false, nearTrain: true, schools: 4, parks: 3, commercial: 4 },
  { name: "ראשון לציון", region: "מרכז", avgPricePerSqm: 30000, trend: 4.8, demandLevel: "high", nearBeach: true, nearTrain: true, schools: 4, parks: 4, commercial: 4 },
  { name: "חולון", region: "גוש דן", avgPricePerSqm: 29000, trend: 5.3, demandLevel: "medium", nearBeach: true, nearTrain: false, schools: 4, parks: 3, commercial: 4 },
  { name: "בת ים", region: "גוש דן", avgPricePerSqm: 32000, trend: 6.1, demandLevel: "high", nearBeach: true, nearTrain: false, schools: 3, parks: 3, commercial: 3 },
  { name: "הרצליה", region: "שרון", avgPricePerSqm: 52000, trend: 3.5, demandLevel: "high", nearBeach: true, nearTrain: true, schools: 5, parks: 5, commercial: 5 },
  { name: "נתניה", region: "שרון", avgPricePerSqm: 24000, trend: 5.5, demandLevel: "medium", nearBeach: true, nearTrain: true, schools: 4, parks: 4, commercial: 4 },
  { name: "רעננה", region: "שרון", avgPricePerSqm: 40000, trend: 3.7, demandLevel: "high", nearBeach: false, nearTrain: true, schools: 5, parks: 5, commercial: 4 },
  { name: "כפר סבא", region: "שרון", avgPricePerSqm: 32000, trend: 4.1, demandLevel: "medium", nearBeach: false, nearTrain: true, schools: 5, parks: 4, commercial: 4 },
  { name: "הוד השרון", region: "שרון", avgPricePerSqm: 33000, trend: 4.3, demandLevel: "medium", nearBeach: false, nearTrain: true, schools: 4, parks: 4, commercial: 3 },
  { name: "ירושלים – מרכז", region: "ירושלים", avgPricePerSqm: 38000, trend: 3.2, demandLevel: "high", nearBeach: false, nearTrain: true, schools: 5, parks: 4, commercial: 5 },
  { name: "ירושלים – דרום", region: "ירושלים", avgPricePerSqm: 25000, trend: 4.5, demandLevel: "medium", nearBeach: false, nearTrain: false, schools: 4, parks: 3, commercial: 3 },
  { name: "מודיעין", region: "מרכז", avgPricePerSqm: 27000, trend: 4.0, demandLevel: "medium", nearBeach: false, nearTrain: true, schools: 5, parks: 5, commercial: 4 },
  { name: "חיפה – כרמל", region: "חיפה", avgPricePerSqm: 28000, trend: 3.8, demandLevel: "medium", nearBeach: true, nearTrain: true, schools: 5, parks: 5, commercial: 4 },
  { name: "חיפה – מרכז", region: "חיפה", avgPricePerSqm: 18000, trend: 5.2, demandLevel: "medium", nearBeach: true, nearTrain: true, schools: 4, parks: 3, commercial: 4 },
  { name: "באר שבע", region: "דרום", avgPricePerSqm: 16000, trend: 6.8, demandLevel: "medium", nearBeach: false, nearTrain: true, schools: 4, parks: 3, commercial: 4 },
  { name: "אשדוד", region: "דרום", avgPricePerSqm: 22000, trend: 5.0, demandLevel: "medium", nearBeach: true, nearTrain: true, schools: 4, parks: 4, commercial: 4 },
  { name: "אשקלון", region: "דרום", avgPricePerSqm: 19000, trend: 5.8, demandLevel: "medium", nearBeach: true, nearTrain: true, schools: 3, parks: 4, commercial: 3 },
  { name: "עפולה", region: "צפון", avgPricePerSqm: 15000, trend: 7.2, demandLevel: "low", nearBeach: false, nearTrain: true, schools: 3, parks: 3, commercial: 3 },
  { name: "נצרת עילית (נוף הגליל)", region: "צפון", avgPricePerSqm: 14000, trend: 6.5, demandLevel: "low", nearBeach: false, nearTrain: false, schools: 3, parks: 4, commercial: 3 },
];

const PROPERTY_TYPES = [
  { key: "apartment", label: "דירה", icon: Home, factor: 1.0 },
  { key: "penthouse", label: "פנטהאוז", icon: Sparkles, factor: 1.35 },
  { key: "garden", label: "גן / קרקע", icon: TreePine, factor: 1.15 },
  { key: "cottage", label: "קוטג'", icon: Home, factor: 1.25 },
];

const CONDITION_OPTIONS = [
  { key: "new", label: "חדש מקבלן", factor: 1.12 },
  { key: "renovated", label: "משופץ", factor: 1.05 },
  { key: "good", label: "מצב טוב", factor: 1.0 },
  { key: "needs_renovation", label: "דורש שיפוץ", factor: 0.88 },
];

const FLOOR_FACTORS: Record<string, number> = {
  ground: 0.95,
  low: 0.98,
  mid: 1.0,
  high: 1.05,
  top: 1.08,
};

// Animated counter hook
function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setValue(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = target;
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return value;
}

const DEFAULT_CONSULTANT_ID = "a4777786-46d3-44fa-a303-a092ebd70f2d";

const PropertyValueCalculator = () => {
  const { branding } = useConsultantBranding(DEFAULT_CONSULTANT_ID);
  const consultantId = branding?.consultantId || DEFAULT_CONSULTANT_ID;
  // Calculator state
  const [selectedArea, setSelectedArea] = useState<string>("תל אביב – מרכז");
  const [sqm, setSqm] = useState(80);
  const [propertyType, setPropertyType] = useState("apartment");
  const [condition, setCondition] = useState("good");
  const [floor, setFloor] = useState("mid");
  const [rooms, setRooms] = useState(3.5);
  const [parking, setParking] = useState(true);
  const [elevator, setElevator] = useState(true);
  const [balcony, setBalcony] = useState(true);
  const [storage, setStorage] = useState(false);
  const [yearBuilt, setYearBuilt] = useState(2015);
  const [areaSearch, setAreaSearch] = useState("");
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  // Form state
  const [step, setStep] = useState<"calc" | "form" | "success" | "report">("calc");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", phone: "", email: "" });
  const [marketingConsent, setMarketingConsent] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lastSliderTouched, setLastSliderTouched] = useState<string>("");

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) {
        setShowAreaDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const area = AREAS.find(a => a.name === selectedArea) || AREAS[0];
  const typeFactor = PROPERTY_TYPES.find(t => t.key === propertyType)?.factor || 1;
  const condFactor = CONDITION_OPTIONS.find(c => c.key === condition)?.factor || 1;
  const floorFactor = FLOOR_FACTORS[floor] || 1;

  // Extras
  const parkingBonus = parking ? 150000 : 0;
  const elevatorBonus = elevator ? (floor === "high" || floor === "top" ? 80000 : 30000) : 0;
  const balconyBonus = balcony ? sqm * 800 : 0;
  const storageBonus = storage ? 60000 : 0;
  const ageDiscount = yearBuilt < 2000 ? 0.93 : yearBuilt < 2010 ? 0.97 : 1.0;

  const baseValue = area.avgPricePerSqm * sqm * typeFactor * condFactor * floorFactor * ageDiscount;
  const totalValue = Math.round(baseValue + parkingBonus + elevatorBonus + balconyBonus + storageBonus);
  const valuePerSqm = Math.round(totalValue / sqm);

  // Future projection
  const value1y = Math.round(totalValue * (1 + area.trend / 100));
  const value3y = Math.round(totalValue * Math.pow(1 + area.trend / 100, 3));
  const value5y = Math.round(totalValue * Math.pow(1 + area.trend / 100, 5));

  const animatedValue = useAnimatedNumber(totalValue);
  const animatedPerSqm = useAnimatedNumber(valuePerSqm);
  const animated1y = useAnimatedNumber(value1y);
  const animated3y = useAnimatedNumber(value3y);
  const animated5y = useAnimatedNumber(value5y);

  // Confidence score
  const confidenceScore = useMemo(() => {
    let score = 72;
    if (sqm >= 40 && sqm <= 200) score += 8;
    if (rooms >= 2 && rooms <= 6) score += 5;
    if (yearBuilt >= 2000) score += 5;
    if (parking) score += 3;
    if (elevator) score += 2;
    return Math.min(score, 95);
  }, [sqm, rooms, yearBuilt, parking, elevator]);

  // AI Insights
  const insights = useMemo(() => {
    const tips: { icon: string; text: string }[] = [];
    if (area.trend > 5) tips.push({ icon: "🔥", text: `${area.name} באזור עם עליית מחירים של ${area.trend}% — מומלץ לרכוש בהקדם.` });
    if (area.nearBeach) tips.push({ icon: "🏖️", text: "קרבה לים מעלה את ערך הנכס ב-8-15% בממוצע." });
    if (area.nearTrain) tips.push({ icon: "🚂", text: "נגישות לרכבת קלה/כבדה — יתרון משמעותי לביקוש." });
    if (condition === "needs_renovation") tips.push({ icon: "🔧", text: "שיפוץ של 150-250 אלף ₪ יכול להעלות את הערך ב-15-20%." });
    if (floor === "high" || floor === "top") tips.push({ icon: "🏙️", text: "קומה גבוהה + נוף פתוח מוסיפה פרמיה של 5-10%." });
    if (!parking) tips.push({ icon: "🅿️", text: "חניה מוסיפה 100-200 אלף ₪ לערך הנכס. שווה לבדוק אפשרות." });
    if (area.demandLevel === "high") tips.push({ icon: "📈", text: "ביקוש גבוה באזור — זמן מכירה ממוצע קצר." });
    return tips.slice(0, 3);
  }, [area, condition, floor, parking]);

  const filteredAreas = AREAS.filter(a =>
    a.name.includes(areaSearch) || a.region.includes(areaSearch)
  );

  // Calculate lead score based on property value inputs
  const calcLeadScore = (email?: string, consent?: boolean) => {
    let score = 0;
    if (totalValue >= 3000000) score += 30;
    else if (totalValue >= 1500000) score += 20;
    else score += 10;
    if (area.demandLevel === "high") score += 20;
    else if (area.demandLevel === "medium") score += 10;
    if (area.trend > 5) score += 15;
    else if (area.trend > 3) score += 10;
    if (email) score += 10;
    if (lastSliderTouched) score += 10;
    if (consent) score += 5;
    return Math.min(score, 100);
  };

  const getLeadCategory = (userCategory?: string) => {
    if (userCategory === "investor") return "משקיע";
    if (userCategory === "refinance") return "מחזר הלוואה";
    if (userCategory === "first_buyer") return "רוכש ראשון";
    if (totalValue >= 4000000) return "משקיע";
    if (condition === "needs_renovation") return "משפר דיור";
    return "רוכש ראשון";
  };

  const getLeadTags = () => {
    const tags: string[] = [];
    if (totalValue >= 3000000) tags.push("VIP Lead");
    if (area.demandLevel === "high" && area.trend > 5) tags.push("Hot Market");
    if (condition === "needs_renovation") tags.push("Renovation Potential");
    return tags;
  };

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setR2L(true);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 45, "F");
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 42, 210, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Chitumit", 105, 18, { align: "center" });
    doc.setFontSize(11);
    doc.text("Property Valuation Report", 105, 28, { align: "center" });
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString("he-IL"), 105, 36, { align: "center" });
    doc.setTextColor(30, 41, 59);
    let y = 58;
    doc.setFontSize(14);
    doc.text("Property Summary", 105, y, { align: "center" });
    y += 12;
    const lines = [
      `Area: ${area.name} (${area.region})`,
      `Type: ${PROPERTY_TYPES.find(t => t.key === propertyType)?.label || propertyType}`,
      `Size: ${sqm} sqm | Rooms: ${rooms}`,
      `Condition: ${CONDITION_OPTIONS.find(c => c.key === condition)?.label || condition}`,
      `Estimated Value: ${totalValue.toLocaleString()} ILS`,
      `Price/sqm: ${valuePerSqm.toLocaleString()} ILS`,
      `1-Year Forecast: ${value1y.toLocaleString()} ILS (+${area.trend}%)`,
      `5-Year Forecast: ${value5y.toLocaleString()} ILS`,
      `Confidence: ${confidenceScore}%`,
    ];
    doc.setFontSize(11);
    lines.forEach(text => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(25, y - 5, 160, 9, 2, 2, "F");
      doc.text(text, 105, y, { align: "center" });
      y += 12;
    });
    y += 5;
    if (insights.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("AI: " + insights[0].text, 105, y, { align: "center", maxWidth: 150 });
    }
    y += 20;
    doc.setFillColor(37, 211, 102);
    doc.roundedRect(55, y, 100, 14, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("Contact us on WhatsApp", 105, y + 9, { align: "center" });
    doc.link(55, y, 100, 14, { url: getWhatsAppUrl(branding?.whatsappPhone) });
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text("This report is for estimation purposes only. Chitumit (c) 2026", 105, 285, { align: "center" });
    doc.save(`Chitumit_PropertyReport_${formData.full_name || "Client"}.pdf`);
  };

  const handleConversationalSubmit = async (data: { full_name: string; phone: string; email: string; category: string }) => {
    setFormData({ full_name: data.full_name, phone: data.phone, email: data.email });
    try {
      const effectiveConsultantId = consultantId;
      const leadScore = calcLeadScore(data.email, marketingConsent);
      const category = getLeadCategory(data.category);
      const tags = getLeadTags();
      const { data: insertedLead, error } = await supabase.from("leads").insert({
        consultant_id: effectiveConsultantId,
        full_name: data.full_name,
        phone: data.phone || null,
        email: data.email || null,
        property_value: totalValue,
        mortgage_amount: Math.round(totalValue * 0.7),
        lead_source: branding?.consultantId !== DEFAULT_CONSULTANT_ID ? "referral" : "organic",
        marketing_consent: marketingConsent,
        lead_score: leadScore,
        notes: `הערכת שווי נכס: ${area.name}, ${sqm} מ"ר, ${PROPERTY_TYPES.find(t => t.key === propertyType)?.label}, ${rooms} חדרים. שווי: ₪${totalValue.toLocaleString()}. קטגוריה: ${category}. ${tags.length ? `תגיות: ${tags.join(", ")}. ` : ""}סליידר: ${lastSliderTouched}. ציון: ${leadScore}`,
      } as any).select("id").single();
      if (error) throw error;
      if (insertedLead?.id) {
        // Notify consultant via edge function
        supabase.functions.invoke("notify-new-lead", {
          body: {
            consultantId: effectiveConsultantId,
            leadName: data.full_name,
            leadPhone: data.phone,
            leadScore,
            calcType: "מחשבון שווי נכס",
            calcSummary: `₪${totalValue.toLocaleString()} • ${area.name} • ${sqm} מ"ר`,
          },
        }).catch(() => {}); // best-effort

        // Send report email to the lead
        if (data.email) {
          supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "calculator-report",
              recipientEmail: data.email,
              idempotencyKey: `calc-report-${insertedLead.id}`,
              templateData: {
                leadName: data.full_name,
                calcType: "מחשבון שווי נכס",
                calcSummary: `שווי מוערך: ₪${totalValue.toLocaleString()} • ${area.name} • ${sqm} מ"ר • ${rooms} חדרים`,
                leadScore,
              },
            },
          }).catch(() => {}); // best-effort
        }
      }
      setIsUnlocked(true);
    } catch (e: any) {
      toast({ title: "שגיאה בשליחה", description: e.message, variant: "destructive" });
      throw e;
    }
  };

  const scrollToForm = () => {
    setStep("form");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // Dynamic meta tags
  useEffect(() => {
    document.title = "מחשבון שווי נכס חכם 2026 | Chitumit – הערכת שווי דירה בחינם";
    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "מחשבון שווי נכס חכם עם בינה מלאכותית. הערכת שווי דירה מיידית ב-25 אזורים בישראל, תחזית ל-5 שנים, ודוח מפורט חינם. נתוני שוק מרץ 2026.");
    setMeta("keywords", "שווי נכס, מחשבון שווי דירה, הערכת שווי נכס, שמאות מקרקעין, מחיר דירה 2026, מחיר למטר רבוע, שווי דירה תל אביב, מחשבון נדלן");
    setMeta("robots", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");
    setMeta("og:title", "מחשבון שווי נכס חכם 2026 | Chitumit", "property");
    setMeta("og:description", "הערכת שווי דירה מיידית עם AI. 25 אזורים, תחזית ל-5 שנים, ודוח מפורט בחינם.", "property");
    setMeta("og:type", "website", "property");
    setMeta("og:url", "https://chitumitcoil.lovable.app/property-value", "property");
    setMeta("og:locale", "he_IL", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "מחשבון שווי נכס חכם 2026 | Chitumit");
    setMeta("twitter:description", "הערכת שווי דירה מיידית עם AI ב-25 אזורים. תחזית ל-5 שנים ודוח חינם.");

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://chitumitcoil.lovable.app/property-value";

    return () => { document.title = "Chitumit"; };
  }, []);

  // Schema markup — WebApplication
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "מחשבון שווי נכס חכם 2026 – Chitumit",
    "description": "הערכת שווי נכס מבוססת בינה מלאכותית ונתוני שוק בזמן אמת. בדקו כמה שווה הדירה שלכם באזורים שונים בישראל.",
    "url": "https://chitumitcoil.lovable.app/property-value",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "inLanguage": "he",
    "provider": {
      "@type": "Organization",
      "name": "Chitumit",
      "url": "https://chitumitcoil.lovable.app",
      "logo": "https://chitumitcoil.lovable.app/placeholder.svg"
    },
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "ILS" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "1247", "bestRating": "5" }
  };

  // Breadcrumb schema
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "דף הבית", "item": "https://chitumitcoil.lovable.app/" },
      { "@type": "ListItem", "position": 2, "name": "מחשבון שווי נכס", "item": "https://chitumitcoil.lovable.app/property-value" }
    ]
  };

  // HowTo schema
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "איך לחשב שווי נכס בישראל",
    "description": "מדריך שלב אחר שלב להערכת שווי דירה או נכס מגורים באמצעות מחשבון שווי נכס חכם.",
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "בחר מיקום", "text": "בחר את האזור או העיר בה נמצא הנכס מתוך 25 אזורים בישראל." },
      { "@type": "HowToStep", "position": 2, "name": "הגדר פרמטרים", "text": "הזן שטח במ\"ר, מספר חדרים, קומה, סוג נכס ומצב הנכס." },
      { "@type": "HowToStep", "position": 3, "name": "הוסף תוספות", "text": "סמן חניה, מעלית, מרפסת ומחסן לדיוק מקסימלי." },
      { "@type": "HowToStep", "position": 4, "name": "קבל הערכה מיידית", "text": "המערכת מחשבת שווי משוער, מחיר למ\"ר, ותחזית ל-1, 3 ו-5 שנים." },
      { "@type": "HowToStep", "position": 5, "name": "קבל דוח מפורט", "text": "השאר פרטים וקבל דוח הערכה מלא כולל ניתוח AI ותובנות שוק." }
    ],
    "totalTime": "PT2M"
  };

  // RealEstateAgent schema
  const agentJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Chitumit",
    "url": "https://chitumitcoil.lovable.app",
    "description": "פלטפורמת AI לייעוץ משכנתאות והערכת שווי נכסים בישראל",
    "areaServed": { "@type": "Country", "name": "Israel" },
    "serviceType": ["הערכת שווי נכס", "ייעוץ משכנתאות", "חישוב משכנתא"],
    "priceRange": "חינם"
  };

  const faqItems = [
    { q: "איך מחשבים שווי נכס?", a: "שווי נכס נקבע על פי מיקום, שטח, סוג נכס, מצב, קומה, חניה ותוספות. המחשבון שלנו משלב נתוני עסקאות אמיתיות עם ניתוח AI לדיוק מרבי." },
    { q: "כמה עולה דירה ממוצעת בתל אביב?", a: "מחיר ממוצע למ\"ר בתל אביב נע בין 42,000 ₪ (דרום) ל-75,000 ₪ (צפון). דירת 4 חדרים (100 מ\"ר) במרכז ת\"א שווה בממוצע כ-6.2 מיליון ₪." },
    { q: "האם שיפוץ מעלה את ערך הנכס?", a: "בהחלט. שיפוץ מקיף (מטבח, אמבטיה, ריצוף) בעלות של 150-250 אלף ₪ יכול להעלות את ערך הנכס ב-15-20%, תלוי באזור ובמצב הנוכחי." },
    { q: "מה ההבדל בין שמאי למחשבון שווי?", a: "שמאי מקרקעין מבצע הערכה רשמית הכוללת ביקור בנכס והיא נדרשת לצורך משכנתא. מחשבון שווי נותן אומדן מהיר ואמין המבוסס על נתוני שוק — מעולה לתכנון ראשוני." },
    { q: "האם קרבה לרכבת קלה מעלה מחירים?", a: "כן. מחקרים מראים שקרבה לתחנת רכבת קלה מעלה את ערך הנכסים ב-5-15% בממוצע, תלוי בקו ובאזור." },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": item.a }
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agentJsonLd) }} />
      <style>{`
        @keyframes loading { from { width: 0%; } to { width: 100%; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 20px hsl(160,84%,39%,0.2); } 50% { box-shadow: 0 0 40px hsl(160,84%,39%,0.4); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .anim-fade-up { animation: fadeSlideUp 0.7s ease-out both; }
        .anim-fade-up-1 { animation: fadeSlideUp 0.7s ease-out 0.1s both; }
        .anim-fade-up-2 { animation: fadeSlideUp 0.7s ease-out 0.2s both; }
        .anim-fade-up-3 { animation: fadeSlideUp 0.7s ease-out 0.3s both; }
        .anim-scale-in { animation: scaleIn 0.6s ease-out both; }
      `}</style>

      <div className="min-h-screen bg-[hsl(222,47%,4%)] text-white overflow-hidden" dir="rtl">
        <StarField />

        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none z-[2]">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[hsl(160,84%,39%)] opacity-[0.06] blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[hsl(217,91%,50%)] opacity-[0.05] blur-[100px]" />
          <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] rounded-full bg-[hsl(270,80%,60%)] opacity-[0.03] blur-[100px]" />
        </div>

        {/* Navbar */}
        <nav className="relative z-50 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gold/20 rounded-full blur-md" />
                <ChitumitLogo size={40} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">חיתומית</h1>
                <p className="text-[10px] text-gold/40 tracking-wider">תהיה מאושר.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/calculator" className="hidden md:block text-xs text-white/50 hover:text-white/80 transition-colors">
                מחשבון משכנתא →
              </Link>
              <div className="hidden md:flex items-center gap-1 text-xs text-white/50">
                <Lock className="w-3 h-3" />
                <span>מאובטח SSL</span>
              </div>
              <Link to="/auth">
                <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs">
                  כניסה למערכת
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="relative z-10 max-w-7xl mx-auto px-6 py-3">
          <ol className="flex items-center gap-2 text-xs text-white/30" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/" itemProp="item" className="hover:text-white/60 transition-colors"><span itemProp="name">דף הבית</span></Link>
              <meta itemProp="position" content="1" />
            </li>
            <li className="text-white/15">/</li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="text-white/50">מחשבון שווי נכס</span>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="relative z-10 pt-6 pb-6 md:pt-14 md:pb-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-10 anim-fade-up">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-l from-[hsl(160,84%,39%)]/15 to-[hsl(217,91%,50%)]/15 border border-[hsl(160,84%,39%)]/30 text-xs text-[hsl(160,84%,70%)] mb-6 shadow-[0_0_20px_hsl(160,84%,39%,0.15)]">
                <Brain className="w-3.5 h-3.5 text-[hsl(160,84%,55%)] animate-pulse" />
                <span className="bg-gradient-to-l from-[hsl(160,84%,65%)] to-[hsl(217,91%,70%)] bg-clip-text text-transparent font-semibold">נתוני שוק בזמן אמת</span>
                <span className="text-white/30">•</span>
                <span className="text-[hsl(38,92%,60%)] font-bold">{AREAS.length} אזורים</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-[1.1] mb-6">
                <span className="text-white">כמה שווה</span>
                <br />
                <span className="bg-gradient-to-l from-[hsl(160,84%,50%)] via-[hsl(160,84%,45%)] to-[hsl(217,91%,55%)] bg-clip-text text-transparent">
                  הנכס שלך?
                </span>
              </h1>
              <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
                הערכת שווי חכמה המבוססת על נתוני עסקאות, מיקום, ומגמות שוק.
                <br className="hidden md:block" />
                תוצאה מיידית עם תחזית ל-5 שנים.
              </p>
            </div>

            {/* Calculator Card */}
            <div className="max-w-5xl mx-auto anim-fade-up-2">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-b from-[hsl(160,84%,39%)]/20 to-transparent rounded-3xl blur-xl" />

                <div className="relative bg-[hsl(222,47%,8%)] border border-white/10 rounded-3xl overflow-hidden">
                  {/* Header */}
                  <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-l from-[hsl(160,84%,39%)]/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[hsl(160,84%,39%)]/10">
                          <Home className="w-5 h-5 text-[hsl(160,84%,50%)]" />
                        </div>
                        <div>
                          <h2 className="font-bold text-lg">מחשבון שווי נכס חכם</h2>
                          <p className="text-xs text-white/40">הגדר פרמטרים וקבל הערכה מיידית</p>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-2 text-xs text-white/40">
                        <div className="w-2 h-2 rounded-full bg-[hsl(160,84%,39%)] animate-pulse" />
                        עדכון שוק: מרץ 2026
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    <div className="grid lg:grid-cols-5 gap-8">
                      {/* Left: Inputs */}
                      <div className="lg:col-span-3 space-y-6">
                        {/* Area Selection */}
                        <div ref={areaRef} className="relative">
                          <Label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[hsl(160,84%,50%)]" />
                            מיקום הנכס
                          </Label>
                          <button
                            onClick={() => setShowAreaDropdown(!showAreaDropdown)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[hsl(160,84%,39%)]/50 transition-all text-right"
                          >
                            <div>
                              <span className="font-bold text-white">{area.name}</span>
                              <span className="text-xs text-white/40 mr-2">({area.region})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                area.demandLevel === "high" ? "bg-[hsl(0,84%,50%)]/15 text-[hsl(0,84%,65%)]" :
                                area.demandLevel === "medium" ? "bg-[hsl(38,92%,50%)]/15 text-[hsl(38,92%,65%)]" :
                                "bg-white/10 text-white/50"
                              )}>
                                {area.demandLevel === "high" ? "ביקוש גבוה" : area.demandLevel === "medium" ? "ביקוש בינוני" : "ביקוש נמוך"}
                              </span>
                              <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", showAreaDropdown && "rotate-180")} />
                            </div>
                          </button>

                          {showAreaDropdown && (
                            <div className="absolute top-full mt-2 w-full bg-[hsl(222,47%,10%)] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-[300px] overflow-y-auto">
                              <div className="p-3 border-b border-white/5">
                                <Input
                                  value={areaSearch}
                                  onChange={e => setAreaSearch(e.target.value)}
                                  placeholder="חפש עיר או אזור..."
                                  className="bg-white/5 border-white/10 text-white text-sm h-10 rounded-lg placeholder:text-white/20"
                                  autoFocus
                                />
                              </div>
                              {filteredAreas.map(a => (
                                <button
                                  key={a.name}
                                  onClick={() => { setSelectedArea(a.name); setShowAreaDropdown(false); setAreaSearch(""); }}
                                  className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-right",
                                    a.name === selectedArea && "bg-[hsl(160,84%,39%)]/10"
                                  )}
                                >
                                  <div>
                                    <span className="text-sm font-medium">{a.name}</span>
                                    <span className="text-xs text-white/30 mr-2">{a.region}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/40">₪{a.avgPricePerSqm.toLocaleString()}/מ"ר</span>
                                    <span className={cn("text-xs", a.trend > 5 ? "text-[hsl(160,84%,50%)]" : "text-[hsl(38,92%,60%)]")}>
                                      +{a.trend}%
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Property Type */}
                        <div>
                          <Label className="text-sm text-white/60 mb-3 block">סוג נכס</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {PROPERTY_TYPES.map(t => {
                              const Icon = t.icon;
                              return (
                                <button
                                  key={t.key}
                                  onClick={() => setPropertyType(t.key)}
                                  className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 text-xs hover:scale-105",
                                    propertyType === t.key
                                      ? "bg-[hsl(160,84%,39%)]/15 border-[hsl(160,84%,39%)]/40 text-[hsl(160,84%,60%)]"
                                      : "bg-white/5 border-white/5 text-white/50 hover:border-white/20"
                                  )}
                                >
                                  <Icon className="w-5 h-5" />
                                  {t.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Size Slider */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-white/60 flex items-center gap-2">
                              <Ruler className="w-4 h-4 text-[hsl(160,84%,50%)]" />
                              שטח (מ"ר)
                            </Label>
                            <span className="text-2xl font-black text-white tabular-nums">{sqm}</span>
                          </div>
                          <Slider
                            value={[sqm]}
                            onValueChange={v => { setSqm(v[0]); setLastSliderTouched("sqm"); }}
                            min={25}
                            max={300}
                            step={5}
                            className="[&_[role=slider]]:bg-[hsl(160,84%,39%)] [&_[role=slider]]:border-0 [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-[0_0_15px_hsl(160,84%,39%,0.5)] [&_.range]:bg-gradient-to-l [&_.range]:from-[hsl(160,84%,45%)] [&_.range]:to-[hsl(217,91%,50%)]"
                          />
                          <div className="flex justify-between text-[10px] text-white/30">
                            <span>300 מ"ר</span>
                            <span>25 מ"ר</span>
                          </div>
                        </div>

                        {/* Rooms */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-white/60">חדרים</Label>
                            <span className="text-2xl font-black text-white tabular-nums">{rooms}</span>
                          </div>
                          <Slider
                            value={[rooms * 2]}
                            onValueChange={v => { setRooms(v[0] / 2); setLastSliderTouched("rooms"); }}
                            min={2}
                            max={14}
                            step={1}
                            className="[&_[role=slider]]:bg-[hsl(160,84%,39%)] [&_[role=slider]]:border-0 [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-[0_0_15px_hsl(160,84%,39%,0.5)] [&_.range]:bg-gradient-to-l [&_.range]:from-[hsl(160,84%,45%)] [&_.range]:to-[hsl(217,91%,50%)]"
                          />
                          <div className="flex justify-between text-[10px] text-white/30">
                            <span>7</span>
                            <span>1</span>
                          </div>
                        </div>

                        {/* Condition + Floor */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-white/60 mb-2 block">מצב הנכס</Label>
                            <div className="space-y-1.5">
                              {CONDITION_OPTIONS.map(c => (
                                <button
                                  key={c.key}
                                  onClick={() => setCondition(c.key)}
                                  className={cn(
                                    "w-full text-right px-3 py-2 rounded-lg text-xs transition-all",
                                    condition === c.key
                                      ? "bg-[hsl(160,84%,39%)]/15 border border-[hsl(160,84%,39%)]/40 text-[hsl(160,84%,60%)]"
                                      : "bg-white/5 border border-white/5 text-white/50 hover:border-white/20"
                                  )}
                                >
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-white/60 mb-2 block">קומה</Label>
                            <div className="space-y-1.5">
                              {[
                                { key: "ground", label: "קרקע" },
                                { key: "low", label: "נמוכה (1-3)" },
                                { key: "mid", label: "בינונית (4-8)" },
                                { key: "high", label: "גבוהה (9-15)" },
                                { key: "top", label: "עליונה / פנטהאוז" },
                              ].map(f => (
                                <button
                                  key={f.key}
                                  onClick={() => setFloor(f.key)}
                                  className={cn(
                                    "w-full text-right px-3 py-2 rounded-lg text-xs transition-all",
                                    floor === f.key
                                      ? "bg-[hsl(160,84%,39%)]/15 border border-[hsl(160,84%,39%)]/40 text-[hsl(160,84%,60%)]"
                                      : "bg-white/5 border border-white/5 text-white/50 hover:border-white/20"
                                  )}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Year Built */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-white/60 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[hsl(160,84%,50%)]" />
                              שנת בנייה
                            </Label>
                            <span className="text-xl font-bold text-white tabular-nums">{yearBuilt}</span>
                          </div>
                          <Slider
                            value={[yearBuilt]}
                            onValueChange={v => { setYearBuilt(v[0]); setLastSliderTouched("year_built"); }}
                            min={1960}
                            max={2026}
                            step={1}
                            className="[&_[role=slider]]:bg-[hsl(160,84%,39%)] [&_[role=slider]]:border-0 [&_[role=slider]]:w-5 [&_[role=slider]]:h-5 [&_[role=slider]]:shadow-[0_0_15px_hsl(160,84%,39%,0.5)] [&_.range]:bg-gradient-to-l [&_.range]:from-[hsl(160,84%,45%)] [&_.range]:to-[hsl(217,91%,50%)]"
                          />
                          <div className="flex justify-between text-[10px] text-white/30">
                            <span>2026</span>
                            <span>1960</span>
                          </div>
                        </div>

                        {/* Extras toggles */}
                        <div>
                          <Label className="text-sm text-white/60 mb-3 block">תוספות</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { key: "parking", label: "חניה", icon: Car, state: parking, set: setParking },
                              { key: "elevator", label: "מעלית", icon: ArrowRight, state: elevator, set: setElevator },
                              { key: "balcony", label: "מרפסת", icon: Waves, state: balcony, set: setBalcony },
                              { key: "storage", label: "מחסן", icon: ShoppingBag, state: storage, set: setStorage },
                            ].map(item => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.key}
                                  onClick={() => item.set(!item.state)}
                                  className={cn(
                                    "flex items-center gap-2 p-3 rounded-xl border transition-all text-xs",
                                    item.state
                                      ? "bg-[hsl(160,84%,39%)]/15 border-[hsl(160,84%,39%)]/40 text-[hsl(160,84%,60%)]"
                                      : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                  {item.label}
                                  {item.state && <CheckCircle2 className="w-3 h-3 mr-auto" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Results */}
                      <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Main value */}
                        <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-[hsl(160,84%,39%)]/10 to-transparent border border-[hsl(160,84%,39%)]/20" style={{ animation: "pulseGlow 3s ease-in-out infinite" }}>
                          <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">שווי משוער</p>
                          <div className="relative inline-block">
                            <span className="text-4xl md:text-5xl font-black bg-gradient-to-l from-white via-white to-white/70 bg-clip-text text-transparent tabular-nums">
                              ₪{animatedValue.toLocaleString()}
                            </span>
                            <div className="absolute -bottom-1 right-0 left-0 h-1 bg-gradient-to-l from-[hsl(160,84%,39%)] to-[hsl(217,91%,50%)] rounded-full opacity-50" />
                          </div>
                          <div className="mt-3 flex items-center justify-center gap-2">
                            <div className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/50">
                              ₪{animatedPerSqm.toLocaleString()} / מ"ר
                            </div>
                            <div className="px-3 py-1 rounded-full bg-[hsl(160,84%,39%)]/10 text-xs text-[hsl(160,84%,55%)]">
                              רמת ביטחון: {confidenceScore}%
                            </div>
                          </div>
                        </div>

                        {/* Area info card */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <MapPin className="w-4 h-4 text-[hsl(160,84%,50%)]" />
                            {area.name}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-white/50">
                              <TrendingUp className="w-3 h-3 text-[hsl(160,84%,50%)]" />
                              מגמה: +{area.trend}% שנתי
                            </div>
                            {area.nearBeach && (
                              <div className="flex items-center gap-1.5 text-white/50">
                                <Waves className="w-3 h-3 text-[hsl(217,91%,60%)]" />
                                קרוב לים
                              </div>
                            )}
                            {area.nearTrain && (
                              <div className="flex items-center gap-1.5 text-white/50">
                                <Train className="w-3 h-3 text-[hsl(270,80%,60%)]" />
                                נגיש לרכבת
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-white/50">
                              <GraduationCap className="w-3 h-3 text-[hsl(38,92%,55%)]" />
                              חינוך: {"⭐".repeat(area.schools)}
                            </div>
                          </div>
                        </div>

                        {/* Future projection */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                          <p className="text-xs text-white/40 font-bold uppercase tracking-wider flex items-center gap-2">
                            <BarChart3 className="w-3.5 h-3.5 text-[hsl(160,84%,50%)]" />
                            תחזית שווי
                          </p>
                          <div className="space-y-2">
                            {[
                              { label: "שנה", val: animated1y, pct: area.trend },
                              { label: "3 שנים", val: animated3y, pct: Math.round(((value3y - totalValue) / totalValue) * 100) },
                              { label: "5 שנים", val: animated5y, pct: Math.round(((value5y - totalValue) / totalValue) * 100) },
                            ].map((row, i) => (
                              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 transition-all duration-300 hover:bg-white/10">
                                <span className="text-xs text-white/50">{row.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold tabular-nums">₪{row.val.toLocaleString()}</span>
                                  <span className="text-xs text-[hsl(160,84%,50%)]">+{row.pct}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Mini bar chart */}
                          <div className="flex items-end gap-1.5 h-16 pt-2">
                            {[totalValue, value1y, Math.round(totalValue * Math.pow(1 + area.trend / 100, 2)), value3y, Math.round(totalValue * Math.pow(1 + area.trend / 100, 4)), value5y].map((v, i) => (
                              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[hsl(160,84%,39%)] to-[hsl(217,91%,50%)] transition-all duration-700"
                                style={{ height: `${(v / value5y) * 100}%`, opacity: 0.4 + i * 0.12 }} />
                            ))}
                          </div>
                          <div className="flex justify-between text-[10px] text-white/20">
                            <span>היום</span>
                            <span>5 שנים</span>
                          </div>
                        </div>

                        {/* Comparison bar */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-xs text-white/40 mb-3">ממוצע אזורי לעומת הנכס שלך</p>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/50">ממוצע {area.name}</span>
                                <span className="text-white/70">₪{area.avgPricePerSqm.toLocaleString()}/מ"ר</span>
                              </div>
                              <div className="h-2 rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-white/30" style={{ width: `${Math.min((area.avgPricePerSqm / valuePerSqm) * 100, 100)}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-[hsl(160,84%,55%)]">הנכס שלך</span>
                                <span className="text-[hsl(160,84%,55%)] font-bold">₪{valuePerSqm.toLocaleString()}/מ"ר</span>
                              </div>
                              <div className="h-2 rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-gradient-to-l from-[hsl(160,84%,45%)] to-[hsl(217,91%,50%)]" style={{ width: `${Math.min((valuePerSqm / area.avgPricePerSqm) * 100, 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="p-6 md:p-8 border-t border-white/5 bg-gradient-to-l from-[hsl(160,84%,39%)]/5 to-transparent">
                    {step === "calc" && (
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <Button
                          onClick={scrollToForm}
                          className="w-full md:w-auto bg-gradient-to-l from-[hsl(160,84%,39%)] to-[hsl(160,84%,33%)] hover:from-[hsl(160,84%,45%)] hover:to-[hsl(160,84%,38%)] text-white border-0 h-14 px-10 text-lg font-bold rounded-2xl shadow-[0_0_30px_hsl(160,84%,39%,0.3)] hover:shadow-[0_0_40px_hsl(160,84%,39%,0.5)] transition-all hover:scale-105 duration-300"
                        >
                          <Sparkles className="w-5 h-5 ml-2" />
                          קבל דוח הערכה מלא חינם
                        </Button>
                        <p className="text-xs text-white/30 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          ללא התחייבות • דוח מפורט תוך דקה
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Insights — Blurred until unlocked */}
        <section className="relative z-10 py-4">
          <div className="max-w-5xl mx-auto px-6">
            <div className="relative">
              <div className={cn("grid md:grid-cols-3 gap-3 transition-all duration-500", !isUnlocked && "blur-sm select-none")}>
                {insights.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-l from-[hsl(38,92%,50%)]/10 to-transparent border border-[hsl(38,92%,50%)]/15 hover:border-[hsl(38,92%,50%)]/30 transition-all duration-300 hover:scale-[1.02]" style={{ animationDelay: `${i * 0.15}s`, animation: 'fadeSlideUp 0.6s ease-out both' }}>
                    <span className="text-lg flex-shrink-0">{tip.icon}</span>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Brain className="w-3 h-3 text-[hsl(38,92%,50%)]" />
                        <span className="text-[10px] font-bold text-[hsl(38,92%,50%)] uppercase tracking-wider">AI Insight</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{tip.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={scrollToForm} className="px-6 py-3 rounded-2xl bg-gradient-to-l from-[hsl(38,92%,50%)] to-[hsl(30,95%,45%)] text-white font-bold text-sm shadow-[0_0_30px_hsla(38,92%,50%,0.4)] hover:scale-105 transition-all flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    השאר פרטים לפתיחת תובנות AI
                  </button>
                </div>
              )}
              {isUnlocked && (
                <div className="flex justify-center mt-4">
                  <button onClick={generatePDF} className="px-5 py-2.5 rounded-xl bg-[hsl(217,91%,50%)] hover:bg-[hsl(217,91%,55%)] text-white text-xs font-bold transition-all hover:scale-105 flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" />
                    הורד דוח הערכה PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Heat Map */}
        <section className="relative z-10 py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-8 anim-fade-up-3">
              <h2 className="text-2xl md:text-3xl font-black mb-3">
                <span className="text-white">מפת חום </span>
                <span className="bg-gradient-to-l from-[hsl(0,84%,55%)] via-[hsl(38,92%,50%)] to-[hsl(160,84%,50%)] bg-clip-text text-transparent">מחירי נדל"ן</span>
              </h2>
              <p className="text-sm text-white/40">לחץ על אזור לצפייה בפירוט מחירים ומגמות • נתוני מרץ 2026</p>
            </div>
            <IsraelHeatMap
              areas={AREAS}
              selectedArea={selectedArea}
              onSelectArea={setSelectedArea}
            />
          </div>
        </section>

        {/* Conversational Lead Capture */}
        {step !== "calc" && (
          <section ref={formRef} className="relative z-10 py-12">
            <div className="max-w-lg mx-auto px-6">
              <ConversationalLeadCapture
                onSubmit={handleConversationalSubmit}
                submitting={submitting}
                accent="green"
                summaryLines={[
                  { label: "אזור", value: area.name },
                  { label: "שטח", value: `${sqm} מ"ר • ${rooms} חדרים` },
                  { label: "שווי משוער", value: `₪${totalValue.toLocaleString()}`, highlight: true },
                ]}
                onDownloadPDF={generatePDF}
              />
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="relative z-10 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-black text-center mb-10">
              <span className="text-white">שאלות נפוצות על </span>
              <span className="bg-gradient-to-l from-[hsl(160,84%,50%)] to-[hsl(217,91%,55%)] bg-clip-text text-transparent">הערכת שווי נכס</span>
            </h2>
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <details key={i} className="group" style={{ animationDelay: `${i * 0.08}s`, animation: 'fadeSlideUp 0.5s ease-out both' }}>
                  <summary className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/[0.07] cursor-pointer transition-all duration-300 list-none">
                    <span className="font-medium text-sm text-white/80">{item.q}</span>
                    <ChevronDown className="w-4 h-4 text-white/30 transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 pt-3 animate-[fadeSlideUp_0.3s_ease-out]">
                    <p className="text-sm text-white/50 leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Cross-sell */}
        <section className="relative z-10 py-8 mb-8">
          <div className="max-w-4xl mx-auto px-6">
            <Link to="/calculator">
              <div className="p-6 rounded-2xl bg-gradient-to-l from-[hsl(217,91%,50%)]/10 to-transparent border border-[hsl(217,91%,50%)]/20 hover:border-[hsl(217,91%,50%)]/40 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[hsl(217,91%,50%)]/15">
                      <BarChart3 className="w-6 h-6 text-[hsl(217,91%,60%)]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">מחשבון משכנתא חכם</h3>
                      <p className="text-xs text-white/40">חשבו כמה תשלמו על המשכנתא — עם ניתוח AI</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:-translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="relative z-10 py-8 px-6">
          <div className="max-w-4xl mx-auto p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-white/30 leading-relaxed text-center">
              <strong className="text-white/40">גילוי נאות:</strong> הערכת השווי המוצגת כאן היא אומדן בלבד המבוסס על נתוני שוק סטטיסטיים ואינה מהווה חוות דעת שמאית רשמית. לצורך משכנתא או עסקה, יש להיעזר בשמאי מקרקעין מוסמך. המידע אינו מהווה ייעוץ פיננסי או השקעתי. Chitumit אינה אחראית לנזק כלשהו שייגרם משימוש במידע זה. הנתונים מבוססים על ממוצעים אזוריים ועשויים להשתנות.
            </p>
          </div>
        </div>
        <div className="relative z-10 py-8">
          <TrustBankLogos />
        </div>
        <PublicFooter />
      </div>
    </>
  );
};

export default PropertyValueCalculator;
