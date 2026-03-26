import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportPoliciesToPdf } from "./PolicyPdfExport";
import { useInsurancePolicies, useInsuranceClients, useAddInsurancePolicy } from "@/hooks/useInsuranceData";
import { useAuth } from "@/contexts/AuthContext";

const POLICY_TYPES: Record<string, string> = {
  life: "חיים", health: "בריאות", car: "רכב", home: "דירה",
  business: "עסק", pension: "פנסיה", disability: "אובדן כושר",
};

const COMPANIES = ["הראל", "הפניקס", "מגדל", "מנורה", "כלל", "AIG", "שירביט", "ביטוח ישיר"];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "פעילה", variant: "default" },
  expired: { label: "פג תוקף", variant: "destructive" },
  claim: { label: "תביעה", variant: "secondary" },
  cancelled: { label: "בוטלה", variant: "outline" },
};

export function InsurancePolicies() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", policy_type: "", insurance_company: "", monthly_premium: "", coverage_amount: "", policy_number: "" });

  const { data: policies, isLoading } = useInsurancePolicies();
  const { data: clients } = useInsuranceClients();
  const addPolicy = useAddInsurancePolicy();

  const enriched = (policies || []).map((p) => ({
    ...p,
    client_name: p.insurance_clients?.full_name || "—",
  }));

  const filtered = enriched.filter((p) => {
    const matchSearch = (p.client_name || "").includes(search) || (p.policy_number || "").includes(search);
    const matchType = filterType === "all" || p.policy_type === filterType;
    return matchSearch && matchType;
  });

  const displayName = user?.user_metadata?.full_name || user?.email || "סוכן";

  const handleExport = () => {
    const pdfData = filtered.map((p) => ({
      policy_number: p.policy_number || "—",
      client_name: p.client_name,
      policy_type: p.policy_type,
      insurance_company: p.insurance_company || "—",
      monthly_premium: Number(p.monthly_premium || 0),
      coverage_amount: Number(p.coverage_amount || 0),
      status: p.status,
      end_date: p.end_date || "",
    }));
    exportPoliciesToPdf(pdfData, displayName);
  };

  const handleAdd = () => {
    if (!form.client_id || !form.policy_type) return;
    addPolicy.mutate(
      {
        client_id: form.client_id,
        policy_type: form.policy_type,
        insurance_company: form.insurance_company || undefined,
        monthly_premium: form.monthly_premium ? Number(form.monthly_premium) : undefined,
        coverage_amount: form.coverage_amount ? Number(form.coverage_amount) : undefined,
        policy_number: form.policy_number || undefined,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setForm({ client_id: "", policy_type: "", insurance_company: "", monthly_premium: "", coverage_amount: "", policy_number: "" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ניהול פוליסות</h2>
          <p className="text-sm text-muted-foreground">{enriched.length} פוליסות בתיק</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 ml-1" />
            ייצוא PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="w-4 h-4 ml-1" />
                פוליסה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>הוספת פוליסה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-1">
                  <Label>לקוח</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="בחר לקוח" /></SelectTrigger>
                    <SelectContent>
                      {(clients || []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>סוג פוליסה</Label>
                    <Select value={form.policy_type} onValueChange={(v) => setForm((f) => ({ ...f, policy_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="בחר סוג" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(POLICY_TYPES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>חברת ביטוח</Label>
                    <Select value={form.insurance_company} onValueChange={(v) => setForm((f) => ({ ...f, insurance_company: v }))}>
                      <SelectTrigger><SelectValue placeholder="בחר חברה" /></SelectTrigger>
                      <SelectContent>
                        {COMPANIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>פרמיה חודשית (₪)</Label>
                    <Input type="number" value={form.monthly_premium} onChange={(e) => setForm((f) => ({ ...f, monthly_premium: e.target.value }))} placeholder="0" dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <Label>סכום כיסוי (₪)</Label>
                    <Input type="number" value={form.coverage_amount} onChange={(e) => setForm((f) => ({ ...f, coverage_amount: e.target.value }))} placeholder="0" dir="ltr" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>מספר פוליסה</Label>
                  <Input value={form.policy_number} onChange={(e) => setForm((f) => ({ ...f, policy_number: e.target.value }))} placeholder="POL-2025-XXX" dir="ltr" />
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={addPolicy.isPending}>
                  {addPolicy.isPending ? "שומר..." : "שמור פוליסה"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="חפש לפי שם לקוח או מספר פוליסה..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="סוג פוליסה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {Object.entries(POLICY_TYPES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">מס׳ פוליסה</TableHead>
                  <TableHead className="text-right">לקוח</TableHead>
                  <TableHead className="text-right">סוג</TableHead>
                  <TableHead className="text-right">חברה</TableHead>
                  <TableHead className="text-right">פרמיה חודשית</TableHead>
                  <TableHead className="text-right">כיסוי</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {search ? "לא נמצאו תוצאות" : "אין פוליסות עדיין — הוסף את הפוליסה הראשונה"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-secondary/30">
                      <TableCell className="font-mono text-xs">{p.policy_number || "—"}</TableCell>
                      <TableCell className="font-medium">{p.client_name}</TableCell>
                      <TableCell>{POLICY_TYPES[p.policy_type] || p.policy_type}</TableCell>
                      <TableCell>{p.insurance_company || "—"}</TableCell>
                      <TableCell dir="ltr" className="text-right">₪{Number(p.monthly_premium || 0).toLocaleString()}</TableCell>
                      <TableCell dir="ltr" className="text-right">
                        {Number(p.coverage_amount || 0) > 0 ? `₪${Number(p.coverage_amount).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMap[p.status]?.variant || "default"}>
                          {statusMap[p.status]?.label || p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
