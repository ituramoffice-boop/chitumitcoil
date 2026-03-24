import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        setStatus(data.valid ? "valid" : "already");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setStatus(data?.success ? "success" : "already");
    } catch { setStatus("error"); }
    finally { setProcessing(false); }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-border bg-card">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">מאמת בקשה...</p>
          </>
        )}

        {status === "valid" && (
          <>
            <MailX className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-xl font-bold text-foreground">ביטול הרשמה לדיוור</h1>
            <p className="text-muted-foreground text-sm">
              לחץ על הכפתור כדי להסיר את כתובת המייל שלך מרשימת הדיוור.
            </p>
            <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
              {processing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              {processing ? "מעבד..." : "אשר ביטול הרשמה"}
            </Button>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold text-foreground">בוטל בהצלחה</h1>
            <p className="text-muted-foreground text-sm">הוסרת מרשימת הדיוור בהצלחה.</p>
          </>
        )}

        {status === "already" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-bold text-foreground">כבר בוטל</h1>
            <p className="text-muted-foreground text-sm">כתובת המייל שלך כבר הוסרה מרשימת הדיוור.</p>
          </>
        )}

        {status === "invalid" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">קישור לא תקין</h1>
            <p className="text-muted-foreground text-sm">הקישור אינו תקין או שפג תוקפו.</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">שגיאה</h1>
            <p className="text-muted-foreground text-sm">אירעה שגיאה. נסה שוב מאוחר יותר.</p>
          </>
        )}
      </div>
    </div>
  );
}
