import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useInsuranceClients, useInsurancePolicies, useAddInsuranceClient } from "@/hooks/useInsuranceData";

export function InsuranceClients() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", id_number: "", city: "" });

  const { data: clients, isLoading } = useInsuranceClients();
  const { data: policies } = useInsurancePolicies();
  const addClient = useAddInsuranceClient();

  // Enrich clients with policy counts
  const enriched = (clients || []).map((c) => {
    const clientPolicies = (policies || []).filter((p) => p.client_id === c.id);
    return {
      ...c,
      policies_count: clientPolicies.length,
      total_premium: clientPolicies.reduce((s, p) => s + Number(p.monthly_premium || 0), 0),
    };
  });

  const filtered = enriched.filter((c) =>
    (c.full_name || "").includes(search) || (c.phone || "").includes(search) || (c.city || "").includes(search)
  );

  const handleAdd = () => {
    if (!form.full_name.trim()) return;
    addClient.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ full_name: "", phone: "", email: "", id_number: "", city: "" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ניהול לקוחות</h2>
          <p className="text-sm text-muted-foreground">{enriched.length} לקוחות בתיק</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="w-4 h-4 ml-1" />
              לקוח חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>הוספת לקוח חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label>שם מלא</Label>
                <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="ישראל ישראלי" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>טלפון</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="050-0000000" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label>אימייל</Label>
                  <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" placeholder="email@example.com" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>תעודת זהות</Label>
                  <Input value={form.id_number} onChange={(e) => setForm((f) => ({ ...f, id_number: e.target.value }))} placeholder="000000000" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label>עיר</Label>
                  <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="תל אביב" />
                </div>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={addClient.isPending}>
                {addClient.isPending ? "שומר..." : "שמור לקוח"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="חפש לפי שם, טלפון או עיר..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
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
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">טלפון</TableHead>
                  <TableHead className="text-right">עיר</TableHead>
                  <TableHead className="text-right">פוליסות</TableHead>
                  <TableHead className="text-right">פרמיה כוללת</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {search ? "לא נמצאו תוצאות" : "אין לקוחות עדיין — הוסף את הלקוח הראשון שלך"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-secondary/30">
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell dir="ltr" className="text-right font-mono text-xs">{c.phone || "—"}</TableCell>
                      <TableCell>{c.city || "—"}</TableCell>
                      <TableCell>{c.policies_count}</TableCell>
                      <TableCell dir="ltr" className="text-right">₪{c.total_premium.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "active" ? "default" : "secondary"}>
                          {c.status === "active" ? "פעיל" : "לא פעיל"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {c.phone && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`tel:${c.phone}`)}>
                              <Phone className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {c.email && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`mailto:${c.email}`)}>
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
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
