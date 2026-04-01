import {
  LayoutDashboard, ArrowLeftRight, Upload, Sheet, FileText,
  Settings, Users, Heart, UserCircle, Baby, Home, Calendar,
  UserCog, CalendarDays, ChevronRight,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const baseMenuItems = [
  { title: "Meu Portal",      url: "/portal",                   icon: UserCog,         group: "Portal" },
  { title: "Dashboard",       url: "/app/dashboard",             icon: LayoutDashboard, group: "Principal" },
  { title: "Transações",      url: "/app/transacoes",            icon: ArrowLeftRight,  group: "Principal" },
  { title: "Membros",         url: "/app/membros",               icon: UserCircle,      group: "Principal" },
  { title: "Contribuições",   url: "/app/contribuicoes",         icon: Heart,           group: "Principal" },
  { title: "Min. Infantil",   url: "/app/ministerio-infantil",   icon: Baby,            group: "Ministério" },
  { title: "Eventos",         url: "/app/eventos",               icon: CalendarDays,    group: "Ministério" },
  { title: "Escalas",         url: "/app/escalas",               icon: Calendar,        group: "Ministério" },
  { title: "Importação",      url: "/app/importacao",            icon: Upload,          group: "Ferramentas" },
  { title: "Integrações",     url: "/app/integracoes",           icon: Sheet,           group: "Ferramentas" },
  { title: "Relatórios",      url: "/app/relatorios",            icon: FileText,        group: "Ferramentas" },
  { title: "Configurações",   url: "/app/configuracoes",         icon: Settings,        group: "Ferramentas" },
];

const adminMenuItem = {
  title: "Administração", url: "/app/admin", icon: Users, group: "Admin",
};

// Icon background accent per item (uses CSS classes from index.css)
const iconAccentMap: Record<string, string> = {
  "Dashboard":     "icon-primary",
  "Transações":    "icon-cyan",
  "Membros":       "icon-violet",
  "Contribuições": "icon-success",
  "Min. Infantil": "icon-secondary",
  "Eventos":       "icon-brand",
  "Escalas":       "icon-primary",
  "Importação":    "icon-violet",
  "Integrações":   "icon-cyan",
  "Relatórios":    "icon-violet",
  "Configurações": "",
  "Meu Portal":    "icon-brand",
  "Administração": "icon-danger",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isAdmin } = useRole();
  const { user, profile } = useAuth();
  const location = useLocation();

  const menuItems = isAdmin
    ? [...baseMenuItems.slice(0, baseMenuItems.length - 1), adminMenuItem, baseMenuItems[baseMenuItems.length - 1]]
    : baseMenuItems;

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border glass-sidebar"
    >
      {/* ── Aurora overlay (adapts via .light .sidebar-aurora) ── */}
      <div className="sidebar-aurora" aria-hidden="true" />

      {/* ── Header / Logo ── */}
      <SidebarHeader className="relative z-10 p-4">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
          {/* Logo badge */}
          <div className="relative h-8 w-8 min-w-[2rem] shrink-0">
            <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center shadow-lg glow-primary">
              <Home className="h-4 w-4 text-white" />
            </div>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-bold text-[15px] text-sidebar-foreground leading-tight tracking-tight">
                  Igreja <span className="gradient-text">360</span>
                </span>
                <span className="text-[11px] text-sidebar-foreground/45 tracking-wider uppercase letter-wider">
                  Gestão Completa
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="relative z-10 py-3 scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {menuItems.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  (item.url !== "/" && location.pathname.startsWith(item.url + "/"));
                const iconClass = iconAccentMap[item.title] || "";

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={isCollapsed ? item.title : undefined}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/app/dashboard" || item.url === "/portal"}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                          isCollapsed ? "justify-center" : "",
                          isActive
                            ? "nav-active"
                            : "text-sidebar-foreground font-normal hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        {/* Icon */}
                        <span className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-200",
                          isActive ? "bg-primary/10" : iconClass || "text-sidebar-foreground/50"
                        )}>
                          <item.icon className="h-4 w-4" />
                        </span>

                        {/* Label */}
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="flex-1 truncate"
                            >
                              {item.title}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Active indicator */}
                        {!isCollapsed && isActive && (
                          <ChevronRight className="h-3.5 w-3.5 opacity-70 flex-shrink-0" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── User Profile Footer ── */}
      <SidebarFooter className="relative z-10 p-3">
        <div className={cn(
          "flex items-center gap-3 rounded-lg p-2.5 transition-colors duration-200",
          "hover:bg-sidebar-accent cursor-default",
          isCollapsed ? "justify-center" : ""
        )}>
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-primary/30 ring-offset-1 ring-offset-transparent">
            <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
            <AvatarFallback className="gradient-brand text-white text-xs font-semibold">
              {getInitials(profile?.full_name, user?.email)}
            </AvatarFallback>
          </Avatar>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-semibold text-sidebar-foreground truncate">
                  {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}