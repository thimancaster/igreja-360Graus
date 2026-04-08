import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useVolunteerStatus } from "@/hooks/useVolunteerStatus";
import { useVolunteerAnnouncements } from "@/hooks/useVolunteerAnnouncements";
import {
  Home,
  Calendar,
  Bell,
  User,
  Baby,
  LogOut,
  Menu,
  ChevronLeft,
  Megaphone,
  CalendarDays,
  Heart,
  Radio,
  CalendarClock,
  Ticket,
} from "lucide-react";

interface PortalLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/portal", label: "Início", icon: Home },
  { href: "/portal/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/portal/meus-ingressos", label: "Meus Ingressos", icon: Ticket },
  { href: "/portal/escalas", label: "Escalas", icon: Calendar },
  { href: "/portal/comunicados", label: "Comunicados", icon: Megaphone },
  { href: "/portal/contribuicoes", label: "Contribuições", icon: Heart },
  { href: "/portal/culto-ao-vivo", label: "Culto ao Vivo", icon: Radio },
  { href: "/portal/agendar", label: "Agendar", icon: CalendarClock },
  { href: "/portal/filhos", label: "Meus Filhos", icon: Baby },
  { href: "/portal/perfil", label: "Meu Perfil", icon: User },
];

const bottomNavItems = [
  { href: "/portal", label: "Início", icon: Home },
  { href: "/portal/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/portal/comunicados", label: "Avisos", icon: Megaphone, hasBadge: true },
  { href: "/portal/filhos", label: "Filhos", icon: Baby },
  { href: "/portal/perfil", label: "Perfil", icon: User },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { isAdmin, isTesoureiro, isPastor, isLider } = useRole();
  const { isVolunteer } = useVolunteerStatus();
  const showAppLink = isAdmin || isTesoureiro || isPastor || isLider;

  const filteredNavItems = navItems.filter(item => {
    if (item.href === "/portal/escalas" && !isVolunteer) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Sidebar header with gradient */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border-b p-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-glow">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="gradient-brand text-white font-bold text-lg">
              {profile?.full_name?.[0] || "M"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-foreground truncate">{profile?.full_name || "Membro"}</h2>
            <p className="text-sm text-muted-foreground">Portal do Membro</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <nav className="flex flex-col gap-1">
          {filteredNavItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/portal" && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all group",
                  isActive
                    ? "gradient-brand text-white shadow-lg shadow-primary/20"
                    : "text-foreground/80 hover:bg-primary/5 hover:text-primary"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-primary/70 group-hover:text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-4 space-y-2">
        {showAppLink && (
          <Link to="/app/dashboard" onClick={onNavigate}>
            <Button variant="outline" className="w-full justify-start gap-3 rounded-xl">
              <ChevronLeft className="h-4 w-4" />
              Ir para App Principal
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}

function BottomNavigation() {
  const location = useLocation();
  const { unreadCount: parentUnread } = useAnnouncements();
  const { unreadCount: volunteerUnread } = useVolunteerAnnouncements();
  const totalUnread = (parentUnread || 0) + (volunteerUnread || 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/portal" && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1 transition-all relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "relative p-2 rounded-xl transition-all",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn("h-6 w-6 transition-transform", isActive && "scale-110")} />
                {item.hasBadge && totalUnread > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </Badge>
                )}
              </div>
              <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 border-r bg-card lg:block">
        <NavContent />
      </aside>

      {/* Mobile */}
      <div className="flex flex-1 flex-col min-w-0 overflow-visible">
        {/* Mobile header - extra vertical space for safe areas and bigger hit targets */}
        <header className="sticky top-0 z-40 flex min-h-[4.5rem] flex-col justify-center bg-background/60 backdrop-blur-xl px-4 pt-[env(safe-area-inset-top)] safe-area-pt lg:hidden border-b">
          <div className="flex items-center gap-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 min-h-[48px] min-w-[48px] rounded-xl hover:bg-primary/10"
                >
                  <Menu className="h-7 w-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <NavContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-bold text-foreground">Portal do Membro</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-24 lg:pb-0">{children}</main>


        <BottomNavigation />
      </div>
    </div>
  );
}
