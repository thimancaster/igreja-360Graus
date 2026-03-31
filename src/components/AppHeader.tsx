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
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  "/app/dashboard":           "Dashboard",
  "/app/transacoes":          "Transações",
  "/app/membros":             "Membros",
  "/app/contribuicoes":       "Contribuições",
  "/app/ministerio-infantil": "Ministério Infantil",
  "/app/eventos":             "Eventos",
  "/app/escalas":             "Escalas",
  "/app/importacao":          "Importação",
  "/app/integracoes":         "Integrações",
  "/app/relatorios":          "Relatórios",
  "/app/configuracoes":       "Configurações",
  "/app/admin":               "Administração",
  "/app/admin/usuarios":      "Usuários",
  "/app/admin/ministerios":   "Ministérios",
  "/app/admin/igreja":        "Igreja",
  "/app/admin/categorias":    "Categorias",
  "/app/admin/dados":         "Dados",
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
    <header className="h-14 sticky top-0 z-40 overflow-visible glass-header">
      <div className="flex h-full items-center justify-between px-4 md:px-6">

        {/* Left: trigger + breadcrumb */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10 rounded-md p-1.5 transition-colors duration-150" />

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-sm">
            <span className="text-white/30 font-medium">Igreja 360</span>
            <ChevronRight className="h-3.5 w-3.5 text-white/20" />
            <span className="text-white/80 font-medium">{currentLabel}</span>
          </div>

          {/* Mobile: just page name */}
          <span className="md:hidden text-sm font-semibold text-white/90">{currentLabel}</span>
        </div>

        {/* Right: notifications + user */}
        <div className="flex items-center gap-2 overflow-visible">
          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0 hover:bg-white/10 transition-colors"
              >
                <Avatar className="h-8 w-8 ring-2 ring-white/15 ring-offset-1 ring-offset-transparent transition-all hover:ring-white/30">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="gradient-aurora text-white text-xs font-bold">
                    {getInitials(profile?.full_name, user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 glass-strong border border-white/10"
              style={{ background: "hsl(var(--surface-2))" }}
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-semibold leading-none text-white/90">
                    {profile?.full_name || user?.user_metadata?.full_name || "Usuário"}
                  </p>
                  <p className="text-xs leading-none text-white/40">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/8" />
              <DropdownMenuItem
                onClick={() => navigate("/app/configuracoes")}
                className="cursor-pointer text-white/70 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={signOut}
                className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
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