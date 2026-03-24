import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Settings, Link2, Upload, Phone, Crown } from "lucide-react";
import { PLAN_LIMITS } from "@/hooks/useConsultantBranding";

const ConsultantSettings = () => {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [plan, setPlan] = useState("free");
  const [leadCount, setLeadCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  const referralLink = `${window.location.origin}/calculator?ref=${user?.id}`;
  const propertyLink = `${window.location.origin}/property-value?ref=${user?.id}`;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("logo_url, whatsapp_phone, plan, lead_count")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setLogoUrl((data as any).logo_url || "");
        setWhatsappPhone((data as any).whatsapp_phone || "");
        setPlan((data as any).plan || "free");
        setLeadCount((data as any).lead_count || 0);
      }
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        logo_url: logoUrl || null,
        whatsapp_phone: whatsappPhone || null,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "שגיאה בשמירה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "הגדרות נשמרו בהצלחה ✅" });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logos/${user.id}.${ext}`;
    const { error } = await supabase.storage.from("mortgage-documents").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "שגיאה בהעלאה", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("mortgage-documents").getPublicUrl(path);
    setLogoUrl(urlData.publicUrl);
    setUploading(false);
    toast({ title: "לוגו הועלה בהצלחה ✅" });
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "הקישור הועתק! 📋" });
  };

  const limit = PLAN_LIMITS[plan] || 10;
  const usagePercent = limit === Infinity ? 0 : Math.round((leadCount / limit) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">הגדרות יועץ</h1>
      </div>

      {/* Plan & Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            תוכנית נוכחית
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={plan === "enterprise" ? "default" : plan === "pro" ? "secondary" : "outline"} className="text-sm px-3 py-1">
              {plan === "enterprise" ? "Enterprise" : plan === "pro" ? "Pro" : "Free"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {limit === Infinity ? "לידים ללא הגבלה" : `${leadCount} / ${limit} לידים`}
            </span>
          </div>
          {limit !== Infinity && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          )}
          {usagePercent >= 80 && limit !== Infinity && (
            <p className="text-sm text-destructive">⚠️ אתה מתקרב למגבלת הלידים. שדרג לתוכנית Pro.</p>
          )}
        </CardContent>
      </Card>

      {/* Referral Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            קישורי הפניה אישיים
          </CardTitle>
          <CardDescription>שתף את הקישורים עם לקוחות פוטנציאליים. כל ליד שייכנס ייוחס אליך.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">מחשבון משכנתא</Label>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="text-xs" dir="ltr" />
              <Button size="sm" variant="outline" onClick={() => copyLink(referralLink)}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">מחשבון שווי נכס</Label>
            <div className="flex gap-2">
              <Input value={propertyLink} readOnly className="text-xs" dir="ltr" />
              <Button size="sm" variant="outline" onClick={() => copyLink(propertyLink)}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            מיתוג אישי
          </CardTitle>
          <CardDescription>הלוגו שלך יוצג בדף המחשבון ובדוח ה-PDF ללקוחות שהגיעו מהקישור שלך.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>לוגו</Label>
            <div className="flex items-center gap-4">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-lg object-contain border border-border" />
              )}
              <div>
                <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    {uploading ? "מעלה..." : "העלה לוגו"}
                  </label>
                </Button>
              </div>
            </div>
            <Input
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              placeholder="או הדבק URL של לוגו"
              dir="ltr"
              className="text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              טלפון WhatsApp
            </Label>
            <Input
              value={whatsappPhone}
              onChange={e => setWhatsappPhone(e.target.value)}
              placeholder="972501234567"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">מספר בפורמט בינלאומי (ללא +). ישמש בכפתור WhatsApp ב-PDF.</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "שומר..." : "שמור הגדרות"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultantSettings;
