import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Heart } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { logger } from "@/lib/logger";

export default function PortalAuth() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const churchId = searchParams.get("church");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    setTimeout(() => navigate("/portal", { replace: true }), 0);
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const schema = z.object({
        email: z.string().trim().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      });
      const validated = schema.parse({ email: loginEmail, password: loginPassword });
      await signIn(validated.email, validated.password);
      logger.log("PortalAuth: Login successful");
      navigate("/portal", { replace: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Verifique suas credenciais");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) {
      toast.error("Link de convite inválido. Peça um novo link ao administrador da sua igreja.");
      return;
    }
    setLoading(true);
    try {
      const schema = z.object({
        name: z.string().trim().min(1, "Nome é obrigatório"),
        email: z.string().trim().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
        phone: z.string().optional(),
      });
      const validated = schema.parse({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        phone: signupPhone,
      });

      // Call portal-signup edge function
      const { data, error } = await supabase.functions.invoke("portal-signup", {
        body: {
          email: validated.email,
          password: validated.password,
          full_name: validated.name,
          phone: validated.phone || null,
          church_id: churchId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Conta criada com sucesso! Faça login para continuar.");
      // Auto-login
      await signIn(validated.email, validated.password);
      navigate("/portal", { replace: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
              <Heart className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Portal do Membro</CardTitle>
          <CardDescription className="text-base flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            Acesse escalas, comunicados e mais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar-se</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portal-login-email">E-mail</Label>
                  <Input
                    id="portal-login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-login-password">Senha</Label>
                  <Input
                    id="portal-login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {!churchId && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-4 text-sm text-amber-700 dark:text-amber-400">
                  Para se cadastrar, utilize o link de convite fornecido pela sua igreja.
                </div>
              )}
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portal-signup-name">Nome Completo</Label>
                  <Input
                    id="portal-signup-name"
                    type="text"
                    placeholder="Seu nome"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-signup-email">E-mail</Label>
                  <Input
                    id="portal-signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-signup-phone">Telefone</Label>
                  <Input
                    id="portal-signup-phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-signup-password">Senha</Label>
                  <Input
                    id="portal-signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !churchId}>
                  {loading ? "Cadastrando..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
