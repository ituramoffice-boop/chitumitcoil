import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText } from "lucide-react";
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

const COMPANIES = ["הראל", "הפניקס", "מגדל", "מנורה", "כלל", "AIG", "שירביט", "ביטוח ישיר"];

const DEMO_POLICIES = [
  { id: "1", policy_number: "POL-2025-001", client_name: "יוסי כהן", policy_type: "life", insurance_company: "הראל", monthly_premium: 380, coverage_amount: 1500000, status: "active", end_date: "2025-06-30" },
  { id: "2", policy_number: "POL-2025-002", client_name: "מירי לוי", policy_type: "health", insurance_company: "כלל", monthly_premium: 220, coverage_amount: 500000, status: "active", end_date: "2025-07-15" },
  { id: "3", policy_number: "POL-2025-003", client_name: "אבי גולן", policy_type: "car", insurance_company: "הפניקס", monthly_premium: 540, coverage_amount: 250000, status: "active", end_date: "2025-04-12" },
  { id: "4", policy_number: "POL-2025-004", client_name: "דנה אברהם", policy_type: "life", insurance_company: "מגדל", monthly_premium: 450, coverage_amount: 2000000, status: "active", end_date: "2026-01-01" },
  { id: "5", policy_number: "POL-2025-005", client_name: "רון שמיר", policy_type: "pension", insurance_company: "מנורה", monthly_premium: 1200, coverage_amount: 0, status: "active", end_date: "2055-01-01" },
  { id: "6", policy_number: "POL-2024-089", client_name: "משה דוד", policy_type: "car", insurance_company: "שירביט", monthly_premium: 320, coverage_amount: 180000, status: "claim", end_date: "2025-09-20" },
  { id: "7", policy_number: "POL-2024-045", client_name: "שרה מזרחי", policy_type: "home", insurance_company: "AIG", monthly_premium: 150, coverage_amount: 800000, status: "expired", end_date: "2025-01-01" },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "פעילה", variant: "default" },
  expired: { label: "פג תוקף", variant: "destructive" },
  claim: { label: "תביעה", variant: "secondary" },
  cancelled: { label: "בוטלה", variant: "outline" },
};

export function InsurancePolicies() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = DEMO_POLICIES.filter((p) => {
    const matchSearch = p.client_name.includes(search) || p.policy_number.includes(search);
    const matchType = filterType === "all" || p.policy_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ניהול פוליסות</h2>
          <p className="text-sm text-muted-foreground">{DEMO_POLICIES.length} פוליסות בתיק</p>
        </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>סוג פוליסה</Label>
                  <Select>
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
                  <Select>
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
                  <Input type="number" placeholder="0" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label>סכום כיסוי (₪)</Label>
                  <Input type="number" placeholder="0" dir="ltr" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>מספר פוליסה</Label>
                <Input placeholder="POL-2025-XXX" dir="ltr" />
              </div>
              <Button className="w-full" onClick={() => { toast.success("הפוליסה נוספה בהצלחה (דמו)"); setDialogOpen(false); }}>
                שמור פוליסה
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חפש לפי שם לקוח או מספר פוליסה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
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

      {/* Table */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
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
              {filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-secondary/30">
                  <TableCell className="font-mono text-xs">{p.policy_number}</TableCell>
                  <TableCell className="font-medium">{p.client_name}</TableCell>
                  <TableCell>{POLICY_TYPES[p.policy_type]}</TableCell>
                  <TableCell>{p.insurance_company}</TableCell>
                  <TableCell dir="ltr" className="text-right">₪{p.monthly_premium.toLocaleString()}</TableCell>
                  <TableCell dir="ltr" className="text-right">
                    {p.coverage_amount > 0 ? `₪${p.coverage_amount.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[p.status]?.variant || "default"}>
                      {statusMap[p.status]?.label || p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
