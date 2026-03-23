import {
  LayoutDashboard,
  Upload,
  Calculator,
  FileBarChart,
  Users,
  Brain,
  UsersRound,
  BarChart3,
  Pen,
  Phone,
  Trophy,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const baseNavItems = [
  { title: "דשבורד", url: "/dashboard", icon: LayoutDashboard },
  { title: "העלאת מסמכים", url: "/dashboard/upload", icon: Upload },
  { title: "ניתוח היתכנות", url: "/dashboard/scenarios", icon: Calculator },
  { title: "דוחות סיכונים", url: "/dashboard/reports", icon: FileBarChart },
  { title: "ניהול לידים", url: "/dashboard/clients", icon: Users },
  { title: "חתימות מרחוק", url: "/dashboard/signatures", icon: Pen },
  { title: "חייגן", url: "/dashboard/dialer", icon: Phone },
  { title: "תוצאות מכירות", url: "/dashboard/sales-results", icon: Trophy },
];

const agencyNavItems = [
  { title: "ניהול צוות", url: "/dashboard/team", icon: UsersRound },
  { title: "דוחות סוכנות", url: "/dashboard/agency-reports", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAgency } = useWorkspace();
  const navItems = isAgency ? [...baseNavItems, ...agencyNavItems] : baseNavItems;

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-sm font-bold text-foreground">SmartMortgage AI</h1>
                <p className="text-[10px] text-muted-foreground">מנוע חיתום חכם</p>
              </div>
              <div className="mr-auto">
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ניווט ראשי</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="ml-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
