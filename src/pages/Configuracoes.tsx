import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Building2, Bell } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatCNPJ, validateCNPJ } from "@/lib/cnpjUtils";
import { pageVariants, pageTransition } from "@/lib/pageAnimations";
import { NotificationSettings } from "@/components/pwa/NotificationSettings";

type ProfileRow = Tables<'profiles'>;
type ChurchRow = Tables<'churches'>;

type ProfileUpdateData = Pick<ProfileRow, 'full_name' | 'avatar_url'>;
type ChurchUpdateData = {
  name: string;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  youtube_live_url: string | null;
};

export default function Configuracoes() {
  const { user, profile } = useAuth();
  const { isAdmin, isTesoureiro, isLoading: roleLoading } = useRole();
  const queryClient = useQueryClient();

  const { data: church, isLoading: churchLoading } = useQuery({
    queryKey: ["church", profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return null;
      const { data, error } = await supabase
        .from("churches")
        .select("*")
        .eq("id", profile.church_id)
        .maybeSingle();
      if (error) { console.error("Error fetching church:", error); return null; }
      return data as ChurchRow;
    },
    enabled: !!profile?.church_id,
  });

  const [profileData, setProfileData] = useState<ProfileUpdateData>({
    full_name: "",
    avatar_url: "",
  });

  const [churchData, setChurchData] = useState<ChurchUpdateData>({
    name: "", cnpj: "", address: "", city: "", state: "",
    pix_key: "", pix_key_type: "", bank_name: "", bank_agency: "", bank_account: "", youtube_live_url: "",
  });

  const [cnpjError, setCnpjError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setProfileData({ full_name: profile.full_name || "", avatar_url: profile.avatar_url || "" });
    }
  }, [profile]);

  useEffect(() => {
    if (church) {
      setChurchData({
        name: church.name || "", cnpj: church.cnpj || "", address: church.address || "",
        city: church.city || "", state: church.state || "",
        pix_key: church.pix_key || "", pix_key_type: church.pix_key_type || "",
        bank_name: church.bank_name || "", bank_agency: church.bank_agency || "",
        bank_account: church.bank_account || "", youtube_live_url: church.youtube_live_url || "",
      });
    }
  }, [church]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("profiles").update(data).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error) => { toast.error("Erro ao atualizar perfil: " + error.message); },
  });

  const updateChurchMutation = useMutation({
    mutationFn: async (data: ChurchUpdateData) => {
      const churchId = church?.id || profile?.church_id;
      if (!churchId) throw new Error("Igreja não encontrada");
      const { error } = await supabase.from("churches").update(data).eq("id", churchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["church"] });
      toast.success("Dados da igreja atualizados com sucesso!");
    },
    onError: (error) => { toast.error("Erro ao atualizar igreja: " + error.message); },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    setChurchData({ ...churchData, cnpj: formatted });
    setCnpjError(formatted && !validateCNPJ(formatted) ? "CNPJ inválido. Verifique os dígitos." : null);
  };

  const handleChurchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (churchData.cnpj && !validateCNPJ(churchData.cnpj)) {
      toast.error("CNPJ inválido. Corrija antes de salvar.");
      return;
    }
    const clean = (v: string | null | undefined) => v?.trim() === "" ? null : (v ?? null);
    const cleanedData: ChurchUpdateData = {
      name: churchData.name,
      cnpj: clean(churchData.cnpj), address: clean(churchData.address),
      city: clean(churchData.city), state: clean(churchData.state),
      pix_key: clean(churchData.pix_key), pix_key_type: clean(churchData.pix_key_type),
      bank_name: clean(churchData.bank_name), bank_agency: clean(churchData.bank_agency),
      bank_account: clean(churchData.bank_account), youtube_live_url: clean(churchData.youtube_live_url),
    };
    updateChurchMutation.mutate(cleanedData);
  };

  const canEditChurch = isAdmin || isTesoureiro;

  if (roleLoading) {
    return <div className="flex-1 flex items-center justify-center p-6"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Configurações</h1>
        <p className="text-muted-foreground mt-1">Configure suas preferências e dados do sistema</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList>
          <TabsTrigger value="perfil" className="gap-2"><User className="h-4 w-4" />Perfil</TabsTrigger>
          <TabsTrigger value="igreja" className="gap-2"><Building2 className="h-4 w-4" />Igreja</TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2"><Bell className="h-4 w-4" />Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input id="full_name" value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })} placeholder="Seu nome completo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar_url">URL do Avatar</Label>
                  <Input id="avatar_url" value={profileData.avatar_url} onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })} placeholder="https://exemplo.com/avatar.jpg" />
                </div>
                <Separator />
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                  Salvar Alterações
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="igreja">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Igreja</CardTitle>
              <CardDescription>Gerencie as informações da sua igreja</CardDescription>
            </CardHeader>
            <CardContent>
              {churchLoading ? (
                <div className="flex items-center justify-center py-8"><LoadingSpinner size="md" /></div>
              ) : (
                <form onSubmit={handleChurchSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="church_name">Nome da Igreja</Label>
                      <Input id="church_name" value={churchData.name} onChange={(e) => setChurchData({ ...churchData, name: e.target.value })} placeholder="Nome da igreja" disabled={!canEditChurch} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                      <Input id="cnpj" value={churchData.cnpj || ""} onChange={(e) => handleCNPJChange(e.target.value)} placeholder="00.000.000/0000-00" disabled={!canEditChurch} className={cnpjError ? "border-destructive" : ""} />
                      {cnpjError && <p className="text-xs text-destructive">{cnpjError}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" value={churchData.address || ""} onChange={(e) => setChurchData({ ...churchData, address: e.target.value })} placeholder="Rua, número, complemento" disabled={!canEditChurch} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input id="city" value={churchData.city || ""} onChange={(e) => setChurchData({ ...churchData, city: e.target.value })} placeholder="Cidade" disabled={!canEditChurch} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input id="state" value={churchData.state || ""} onChange={(e) => setChurchData({ ...churchData, state: e.target.value })} placeholder="UF" maxLength={2} disabled={!canEditChurch} />
                    </div>
                  </div>

                  <Separator />
                  <h3 className="text-sm font-medium text-muted-foreground">Dados Financeiros (PIX e Banco)</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pix_key_type">Tipo da Chave PIX</Label>
                      <Select value={churchData.pix_key_type || ''} onValueChange={(v) => setChurchData({ ...churchData, pix_key_type: v })} disabled={!canEditChurch}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="random">Chave Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pix_key">Chave PIX</Label>
                      <Input id="pix_key" value={churchData.pix_key || ''} onChange={(e) => setChurchData({ ...churchData, pix_key: e.target.value })} placeholder="Chave PIX" disabled={!canEditChurch} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Banco</Label>
                      <Input id="bank_name" value={churchData.bank_name || ''} onChange={(e) => setChurchData({ ...churchData, bank_name: e.target.value })} placeholder="Ex: Banco do Brasil" disabled={!canEditChurch} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank_agency">Agência</Label>
                        <Input id="bank_agency" value={churchData.bank_agency || ''} onChange={(e) => setChurchData({ ...churchData, bank_agency: e.target.value })} placeholder="0000" disabled={!canEditChurch} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_account">Conta</Label>
                        <Input id="bank_account" value={churchData.bank_account || ''} onChange={(e) => setChurchData({ ...churchData, bank_account: e.target.value })} placeholder="00000-0" disabled={!canEditChurch} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube_live_url">URL YouTube ao Vivo</Label>
                    <Input id="youtube_live_url" value={churchData.youtube_live_url || ''} onChange={(e) => setChurchData({ ...churchData, youtube_live_url: e.target.value })} placeholder="https://youtube.com/c/suaigreja/live" disabled={!canEditChurch} />
                  </div>

                  <Separator />

                  <Button type="submit" disabled={updateChurchMutation.isPending || !canEditChurch}>
                    {updateChurchMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                    Salvar Alterações
                  </Button>
                  {!canEditChurch && (
                    <p className="text-sm text-muted-foreground mt-2">Você não tem permissão para editar os dados da igreja.</p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
