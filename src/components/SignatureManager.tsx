import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Search, FileText, CheckCircle2, Clock, Send, Copy, Download,
  Loader2, MessageCircle, ExternalLink, Pen, RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  mortgage_amount: number | null;
  status: string;
  signed_at: string | null;
  signature_url: string | null;
  sign_token: string | null;
  created_at: string;
}

export function SignatureManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["signature-management"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Lead[];
    },
  });

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel("sig-mgmt-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        queryClient.invalidateQueries({ queryKey: ["signature-management"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filtered = useMemo(() => {
    if (!search) return leads;
    const s = search.toLowerCase();
    return leads.filter(l =>
      l.full_name.toLowerCase().includes(s) ||
      l.phone?.includes(s) ||
      l.email?.toLowerCase().includes(s)
    );
  }, [leads, search]);

  const stats = useMemo(() => ({
    total: leads.length,
    signed: leads.filter(l => l.signed_at).length,
    pending: leads.filter(l => !l.signed_at).length,
  }), [leads]);

  const getSignUrl = (lead: Lead) => {
    const base = window.location.origin;
    return `${base}/sign/${lead.sign_token}`;
  };

  const copyLink = (lead: Lead) => {
    navigator.clipboard.writeText(getSignUrl(lead));
    toast({ title: "קישור הועתק! 📋" });
  };

  const sendWhatsApp = (lead: Lead) => {
    if (!lead.phone) return;
    const cleanPhone = lead.phone.replace(/\D/g, "");
    const intlPhone = cleanPhone.startsWith("0") ? `972${cleanPhone.slice(1)}` : cleanPhone;
    const url = getSignUrl(lead);
    const message = encodeURIComponent(
      `שלום ${lead.full_name} 👋\n\nמצורף קישור לחתימה דיגיטלית על הסכם ייעוץ משכנתא:\n${url}\n\nניתן לחתום ישירות מהטלפון 📱\n\nתודה, SmartMortgage`
    );
    window.open(`https://wa.me/${intlPhone}?text=${message}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">סה"כ הסכמים</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.signed}</p>
              <p className="text-xs text-muted-foreground">חתומים</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">ממתינים לחתימה</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Pen className="h-4 w-4 text-primary" />
              ניהול חתימות מרחוק
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="חיפוש לקוח..."
                className="pr-9 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">טלפון</TableHead>
                  <TableHead className="text-right">סכום משכנתא</TableHead>
                  <TableHead className="text-right">סטטוס חתימה</TableHead>
                  <TableHead className="text-right">תאריך חתימה</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(lead => (
                  <TableRow key={lead.id} className="group">
                    <TableCell className="font-medium text-sm">{lead.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.phone || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {lead.mortgage_amount ? `₪${lead.mortgage_amount.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>
                      {lead.signed_at ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          חתום
                        </Badge>
                      ) : (
                        <Badge className="bg-warning/10 text-warning border-warning/20" variant="outline">
                          <Clock className="h-3 w-3 ml-1" />
                          ממתין
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.signed_at
                        ? formatDistanceToNow(new Date(lead.signed_at), { locale: he, addSuffix: true })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!lead.signed_at && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => copyLink(lead)}
                              title="העתק קישור חתימה"
                            >
                              <Copy className="h-3 w-3" />
                              העתק קישור
                            </Button>
                            {lead.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1 text-green-600 hover:text-green-700"
                                onClick={() => sendWhatsApp(lead)}
                                title="שלח בוואטסאפ"
                              >
                                <MessageCircle className="h-3 w-3" />
                                שלח בוואטסאפ
                              </Button>
                            )}
                          </>
                        )}
                        {lead.signed_at && lead.signature_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => window.open(lead.signature_url!, "_blank")}
                          >
                            <Download className="h-3 w-3" />
                            הורד PDF
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => window.open(getSignUrl(lead), "_blank")}
                          title="פתח דף חתימה"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">אין הסכמים להצגה</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
