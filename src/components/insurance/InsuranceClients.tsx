import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

const DEMO_CLIENTS = [
  { id: "1", full_name: "יוסי כהן", phone: "050-1234567", email: "yossi@email.com", city: "תל אביב", policies_count: 2, total_premium: 780, status: "active" },
  { id: "2", full_name: "מירי לוי", phone: "052-9876543", email: "miri@email.com", city: "חיפה", policies_count: 1, total_premium: 220, status: "active" },
  { id: "3", full_name: "אבי גולן", phone: "054-5551234", email: "avi@email.com", city: "ירושלים", policies_count: 1, total_premium: 540, status: "active" },
  { id: "4", full_name: "דנה אברהם", phone: "050-7778899", email: "dana@email.com", city: "רעננה", policies_count: 1, total_premium: 450, status: "active" },
  { id: "5", full_name: "רון שמיר", phone: "053-1112233", email: "ron@email.com", city: "הרצליה", policies_count: 1, total_premium: 1200, status: "active" },
  { id: "6", full_name: "משה דוד", phone: "058-4445566", email: "moshe@email.com", city: "באר שבע", policies_count: 1, total_premium: 320, status: "active" },
  { id: "7", full_name: "שרה מזרחי", phone: "050-9990011", email: "sara@email.com", city: "נתניה", policies_count: 1, total_premium: 150, status: "inactive" },
];

export function InsuranceClients() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = DEMO_CLIENTS.filter((c) =>
    c.full_name.includes(search) || c.phone.includes(search) || c.city.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ניהול לקוחות</h2>
          <p className="text-sm text-muted-foreground">{DEMO_CLIENTS.length} לקוחות בתיק</p>
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
                <Input placeholder="ישראל ישראלי" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>טלפון</Label>
                  <Input placeholder="050-0000000" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label>אימייל</Label>
                  <Input type="email" placeholder="email@example.com" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>תעודת זהות</Label>
                  <Input placeholder="000000000" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label>עיר</Label>
                  <Input placeholder="תל אביב" />
                </div>
              </div>
              <Button className="w-full" onClick={() => { toast.success("הלקוח נוסף בהצלחה (דמו)"); setDialogOpen(false); }}>
                שמור לקוח
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חפש לפי שם, טלפון או עיר..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {/* Client Cards on mobile, Table on desktop */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
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
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-secondary/30">
                  <TableCell className="font-medium">{c.full_name}</TableCell>
                  <TableCell dir="ltr" className="text-right font-mono text-xs">{c.phone}</TableCell>
                  <TableCell>{c.city}</TableCell>
                  <TableCell>{c.policies_count}</TableCell>
                  <TableCell dir="ltr" className="text-right">₪{c.total_premium.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>
                      {c.status === "active" ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`tel:${c.phone}`)}>
                        <Phone className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`mailto:${c.email}`)}>
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
