import { LayoutDashboard, ArrowLeftRight, Upload, Sheet, FileText, Settings, Users, Heart, UserCircle, Baby, Home, Calendar, UserCog, CalendarDays } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

const baseMenuItems = [{
  title: "Dashboard",
  url: "/app/dashboard",
  icon: LayoutDashboard
}, {
  title: "Transações",
  url: "/app/transacoes",
  icon: ArrowLeftRight
}, {
  title: "Membros",
  url: "/app/membros",
  icon: UserCircle
}, {
  title: "Contribuições",
  url: "/app/contribuicoes",
  icon: Heart
}, {
  title: "Min. Infantil",
  url: "/app/ministerio-infantil",
  icon: Baby
}, {
  title: "Eventos",
  url: "/app/eventos",
  icon: CalendarDays
}, {
  title: "Escalas",
  url: "/app/escalas",
  icon: Calendar
}, {
  title: "Importação",
  url: "/app/importacao",
  icon: Upload
}, {
  title: "Integrações",
  url: "/app/integracoes",
  icon: Sheet
}, {
  title: "Relatórios",
  url: "/app/relatorios",
  icon: FileText
}, {
  title: "Configurações",
  url: "/app/configuracoes",
  icon: Settings
}];

const adminMenuItem = {
  title: "Administração",
  url: "/app/admin",
  icon: Users
};

const portalMenuItem = {
  title: "Meu Portal",
  url: "/portal",
  icon: UserCog
};
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const isCollapsed = state === "collapsed";
  const {
    isAdmin,
    isLoading
  } = useRole();

  // Mostrar menu admin apenas para admin
  const canAccessAdmin = isAdmin;

  // Build menu items - always add portal at the top
  let menuItems = [portalMenuItem, ...baseMenuItems];

  // Add admin menu for admins
  if (canAccessAdmin) {
    menuItems = [...menuItems.slice(0, menuItems.length - 1), adminMenuItem, menuItems[menuItems.length - 1]];
  }
  return <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar lg:glass-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
          <div className="h-8 w-8 min-w-[2rem] rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-[10px] leading-none">I360</span>
          </div>
          {!isCollapsed && <div className="flex flex-col min-w-0">
              <span className="font-semibold text-lg text-sidebar-foreground leading-tight">Igreja 360</span>
              <span className="text-xs text-sidebar-foreground/60">Gestão Completa</span>
            </div>}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={({
                  isActive
                }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}