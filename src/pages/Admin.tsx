import { motion } from "framer-motion";
import { Users, ChevronRight, Home, Tag, Database, Settings, Globe, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pageVariants, pageTransition } from "@/lib/pageAnimations";
import { toast } from "sonner";

export default function Admin() {
  const handleCopyPortalLink = () => {
    const portalUrl = `${window.location.origin}/portal/auth`;
    navigator.clipboard.writeText(portalUrl).then(() => {
      toast.success("Link do portal copiado!");
    }).catch(() => {
      toast.error("Erro ao copiar link.");
    });
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="flex-1 space-y-8 p-6"
    >
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Administração</h1>
        <p className="text-muted-foreground mt-1">Gerencie a estrutura, finanças e configurações da sua igreja</p>
      </div>

      {/* Gestão Institucional */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Igreja e Estrutura</h2>
          <p className="text-sm text-muted-foreground">Dados da igreja, ministérios, usuários e portal</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/app/admin/igreja" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Home className="h-6 w-6 text-primary" />
                    <CardTitle>Gerenciar Igreja</CardTitle>
                  </div>
                  <CardDescription className="mt-2">Dados cadastrais, endereço e ministérios da igreja.</CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/admin/usuarios" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    <CardTitle>Gerenciar Usuários</CardTitle>
                  </div>
                  <CardDescription className="mt-2">Cargos e permissões dos usuários do sistema.</CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-primary" />
                  <CardTitle>Portal do Membro</CardTitle>
                </div>
                <CardDescription className="mt-2">Compartilhe o link para membros acessarem o portal.</CardDescription>
                <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={handleCopyPortalLink}>
                  <Copy className="h-4 w-4" />
                  Copiar Link do Portal
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Gestão Financeira e Operacional */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Financeiro e Sistema</h2>
          <p className="text-sm text-muted-foreground">Categorias financeiras, configurações e manutenção de dados</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/app/admin/categorias" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Tag className="h-6 w-6 text-primary" />
                    <CardTitle>Gerenciar Categorias</CardTitle>
                  </div>
                  <CardDescription className="mt-2">Organize as categorias de receitas e despesas.</CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/admin/configuracoes-sistema" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Settings className="h-6 w-6 text-primary" />
                    <CardTitle>Configurações do Sistema</CardTitle>
                  </div>
                  <CardDescription className="mt-2">Sincronização automática, automações e histórico.</CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>

          <Link to="/app/admin/dados" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full border-destructive/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-destructive" />
                    <CardTitle>Gerenciar Dados</CardTitle>
                  </div>
                  <CardDescription className="mt-2">Exclua ou limpe dados do banco de dados.</CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>
    </motion.div>
  );
}
