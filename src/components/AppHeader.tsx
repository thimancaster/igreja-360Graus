import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";

const routeLabels: Record<string, string> = {
  "/app/dashboard":                    "Dashboard",
  "/app/transacoes":                   "Transações",
  "/app/membros":                      "Membros",
  "/app/contribuicoes":                "Contribuições",
  "/app/ministerio-infantil":          "Ministério Infantil",
  "/app/eventos":                      "Eventos",
  "/app/escalas":                      "Escalas",
  "/app/importacao":                   "Importação",
  "/app/integracoes":                  "Integrações",
  "/app/relatorios":                   "Relatórios",
  "/app/configuracoes":                "Configurações",
  "/app/admin":                        "Administração",
  "/app/admin/usuarios":               "Usuários",
  "/app/admin/ministerios":            "Ministérios",
  "/app/admin/igreja":                 "Igreja",
  "/app/admin/categorias":             "Categorias",
  "/app/admin/dados":                  "Dados",
  "/app/admin/configuracoes-sistema":  "Config. Sistema",
};

export function AppHeader() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentLabel = routeLabels[location.pathname] || "Igreja 360";

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  return (
    <header className="min-h-[3.5rem] md:h-14 sticky top-0 z-40 overflow-visible glass-header pt-[env(safe-area-inset-top)] safe-area-pt">
      <div className="flex h-14 md:h-full items-center justify-between px-4 md:px-6">

        {/* ── Left: sidebar trigger + breadcrumb ── */}
        <div className="flex items-center gap-2 md:gap-3">
          <SidebarTrigger className="h-11 w-11 md:h-7 md:w-7 text-foreground/60 hover:text-foreground hover:bg-accent/10 rounded-xl md:rounded-md p-1.5 transition-colors duration-150" />

          {/* Breadcrumb — desktop */}
          <div className="hidden md:flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground font-medium">Igreja 360</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-foreground font-semibold">{currentLabel}</span>
          </div>

          {/* Mobile: only page name */}
          <span className="md:hidden text-base font-bold text-foreground truncate max-w-[150px]">
            {currentLabel}
          </span>
        </div>


        {/* ── Right: notifications + theme toggle + user ── */}
        <div className="flex items-center gap-1.5 overflow-visible">
          {/* Notifications */}
          <NotificationCenter />

          {/* Theme toggle — between notifications and avatar */}
          <ThemeToggle />

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0 hover:bg-accent/10 transition-colors ml-0.5"
                animate={false}
                ripple={false}
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/25 ring-offset-1 ring-offset-transparent transition-all hover:ring-primary/40">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="gradient-brand text-white text-xs font-bold">
                    {getInitials(profile?.full_name, user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 glass-ultra border border-border"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-semibold leading-none text-foreground">
                    {profile?.full_name || user?.user_metadata?.full_name || "Usuário"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                onClick={() => navigate("/app/configuracoes")}
                className="cursor-pointer text-foreground/80 hover:text-foreground hover:bg-accent/10 focus:bg-accent/10 focus:text-foreground"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={signOut}
                className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}