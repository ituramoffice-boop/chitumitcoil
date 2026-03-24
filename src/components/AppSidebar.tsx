import {
  LayoutDashboard,
  Upload,
  Calculator,
  FileBarChart,
  Users,
  UsersRound,
  BarChart3,
  Pen,
  Phone,
  Trophy,
  Briefcase,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ChitumitLogo } from "@/components/ChitumitLogo";
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
  { title: "ניהול לקוחות", url: "/dashboard/client-management", icon: Briefcase },
  { title: "חתימות מרחוק", url: "/dashboard/signatures", icon: Pen },
  { title: "חייגן", url: "/dashboard/dialer", icon: Phone },
  { title: "שוק לידים", url: "/dashboard/marketplace", icon: ShoppingCart },
  { title: "תוצאות מכירות", url: "/dashboard/sales-results", icon: Trophy },
  { title: "הגדרות יועץ", url: "/dashboard/consultant-settings", icon: Settings },
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
      <SidebarHeader className="p-4 bg-[hsl(var(--navy))]">
        <div className="flex items-center gap-3">
          <ChitumitLogo size={36} />
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1">
              <div>
                <h1 className="text-sm font-bold text-gold">חיתומית</h1>
                <p className="text-[10px] text-sidebar-foreground/60 font-assistant">הבינה שמאחורי האישור</p>
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
                      activeClassName="bg-gold/10 text-gold font-medium"
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

        {/* App Store Badges in sidebar */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-sidebar-border">
            <AppStoreBadges compact />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
