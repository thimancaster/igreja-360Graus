import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Pencil, Trash2, Building2, CreditCard, Users, Palette, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { formatCNPJ, validateCNPJ } from '@/lib/cnpjUtils';
import { pageVariants, pageTransition } from '@/lib/pageAnimations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

type Church = Tables<'churches'>;
type ChurchUpdateData = TablesUpdate<'churches'>;
type Ministry = Tables<'ministries'>;

const ministrySchema = z.object({
  name: z.string().min(1, "Nome do ministério é obrigatório").max(100, "Nome muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional().or(z.literal("")),
});

type MinistryFormValues = z.infer<typeof ministrySchema>;

const GerenciarIgreja = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { isAdmin, isTesoureiro, isLoading: isRoleLoading } = useRole();
  const { toast: uiToast } = useToast();
  const queryClient = useQueryClient();

  const [churchData, setChurchData] = useState<Church | null>(null);
  const [cnpjError, setCnpjError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ministryToDelete, setMinistryToDelete] = useState<string | null>(null);

  const canManageMinistries = isAdmin || isTesoureiro;

  const ministryForm = useForm<MinistryFormValues>({
    resolver: zodResolver(ministrySchema),
    defaultValues: { name: "", description: "" },
  });

  const { data: church, isLoading: isLoadingChurch } = useQuery({
    queryKey: ['church-details', profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return null;
      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .eq('id', profile.church_id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!profile?.church_id,
  });

  useEffect(() => {
    if (church) setChurchData(church);
  }, [church]);

  const updateChurchMutation = useMutation({
    mutationFn: async (updatedData: ChurchUpdateData) => {
      if (!churchData?.id) throw new Error('ID da Igreja não encontrado');
      const { error } = await supabase.from('churches').update(updatedData).eq('id', churchData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      uiToast({ title: 'Sucesso', description: 'Informações da igreja atualizadas.' });
      queryClient.invalidateQueries({ queryKey: ['church-details', profile?.church_id] });
      queryClient.invalidateQueries({ queryKey: ['church'] });
    },
    onError: (error: any) => {
      uiToast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  // ---- Ministry queries ----
  const { data: ministries, isLoading: ministriesLoading } = useQuery({
    queryKey: ["ministries", profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return [];
      const { data, error } = await supabase
        .from("ministries")
        .select("*")
        .eq("church_id", profile.church_id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Ministry[];
    },
    enabled: !!profile?.church_id && !!user?.id,
  });

  const saveMinistryMutation = useMutation({
    mutationFn: async (data: MinistryFormValues) => {
      if (!user?.id || !profile?.church_id) throw new Error("Usuário ou igreja não encontrados.");
      const ministryData = { name: data.name, description: data.description || null, church_id: profile.church_id };
      if (selectedMinistry) {
        const { error } = await supabase.from("ministries").update(ministryData).eq("id", selectedMinistry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ministries").insert(ministryData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ministries", profile?.church_id] });
      queryClient.invalidateQueries({ queryKey: ["report-filters-data"] });
      toast.success(`Ministério ${selectedMinistry ? "atualizado" : "criado"} com sucesso!`);
      setDialogOpen(false);
      setSelectedMinistry(null);
      ministryForm.reset();
    },
    onError: (error: any) => {
      toast.error(`Erro ao ${selectedMinistry ? "atualizar" : "criar"} ministério: ${error.message}`);
    },
  });

  const deleteMinistryMutation = useMutation({
    mutationFn: async (ministryId: string) => {
      const { error } = await supabase.from("ministries").delete().eq("id", ministryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ministries", profile?.church_id] });
      queryClient.invalidateQueries({ queryKey: ["report-filters-data"] });
      toast.success("Ministério excluído com sucesso!");
      setDeleteDialogOpen(false);
      setMinistryToDelete(null);
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir ministério: ${error.message}`);
    },
  });

  useEffect(() => {
    if (selectedMinistry) {
      ministryForm.reset({ name: selectedMinistry.name, description: selectedMinistry.description || "" });
    } else {
      ministryForm.reset({ name: "", description: "" });
    }
  }, [selectedMinistry, ministryForm, dialogOpen]);

  const handleCNPJChange = (value: string) => {
    if (!churchData) return;
    const formatted = formatCNPJ(value);
    setChurchData({ ...churchData, cnpj: formatted });
    setCnpjError(formatted && !validateCNPJ(formatted) ? "CNPJ inválido. Verifique os dígitos." : null);
  };

  const handleChurchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchData) return;
    if (churchData.cnpj && !validateCNPJ(churchData.cnpj)) {
      uiToast({ title: 'Erro', description: 'CNPJ inválido. Corrija antes de salvar.', variant: 'destructive' });
      return;
    }
    const cleanedData: ChurchUpdateData = {
      name: churchData.name,
      cnpj: churchData.cnpj?.trim() === "" ? null : churchData.cnpj,
      address: churchData.address?.trim() === "" ? null : churchData.address,
      city: churchData.city?.trim() === "" ? null : churchData.city,
      state: churchData.state?.trim() === "" ? null : churchData.state,
      zip_code: churchData.zip_code?.trim() === "" ? null : churchData.zip_code,
      phone: churchData.phone?.trim() === "" ? null : churchData.phone,
      email: churchData.email?.trim() === "" ? null : churchData.email,
      website: churchData.website?.trim() === "" ? null : churchData.website,
      pix_key: churchData.pix_key?.trim() === "" ? null : churchData.pix_key,
      pix_key_type: churchData.pix_key_type?.trim() === "" ? null : churchData.pix_key_type,
      bank_name: churchData.bank_name?.trim() === "" ? null : churchData.bank_name,
      bank_agency: churchData.bank_agency?.trim() === "" ? null : churchData.bank_agency,
      bank_account: churchData.bank_account?.trim() === "" ? null : churchData.bank_account,
      youtube_live_url: churchData.youtube_live_url?.trim() === "" ? null : churchData.youtube_live_url,
      pix_qr_image_url: (churchData as any).pix_qr_image_url?.trim() === "" ? null : (churchData as any).pix_qr_image_url,
      primary_color: (churchData as any).primary_color?.trim() === "" ? null : (churchData as any).primary_color,
      secondary_color: (churchData as any).secondary_color?.trim() === "" ? null : (churchData as any).secondary_color,
      accent_color: (churchData as any).accent_color?.trim() === "" ? null : (churchData as any).accent_color,
      logo_url: churchData.logo_url?.trim() === "" ? null : churchData.logo_url,
    };
    updateChurchMutation.mutate(cleanedData);
  };

  if (isLoadingChurch || isRoleLoading || authLoading || ministriesLoading) {
    return <div className="flex h-full items-center justify-center p-6"><LoadingSpinner size="lg" /></div>;
  }

  if (!isAdmin && !profile?.church_id) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Nenhuma Igreja Associada</h2>
        <p className="text-muted-foreground text-center">Seu perfil não está associado a nenhuma igreja.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="container mx-auto p-6 space-y-6"
    >
      <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Gerenciar Igreja</h1>

      {isAdmin && !churchData && (
        <Alert variant="default" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Modo Administrador: Para criar uma nova igreja, use a página <a href="/create-church" className="underline">Criar Igreja</a>.
          </AlertDescription>
        </Alert>
      )}

      {churchData && (
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="dados" className="gap-2"><Building2 className="h-4 w-4" />Dados</TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-2"><CreditCard className="h-4 w-4" />Financeiro</TabsTrigger>
            <TabsTrigger value="ministerios" className="gap-2"><Users className="h-4 w-4" />Ministérios</TabsTrigger>
            <TabsTrigger value="personalizar" className="gap-2"><Palette className="h-4 w-4" />Personalizar</TabsTrigger>
          </TabsList>

          {/* Aba Dados da Igreja */}
          <TabsContent value="dados" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Igreja</CardTitle>
                <CardDescription>Dados gerais, endereço e contato</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChurchSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome da Igreja</Label>
                      <Input id="name" value={churchData.name || ''} onChange={(e) => setChurchData({ ...churchData, name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                      <Input id="cnpj" value={churchData.cnpj || ''} onChange={(e) => handleCNPJChange(e.target.value)} placeholder="00.000.000/0000-00" className={cnpjError ? "border-destructive" : ""} />
                      {cnpjError && <p className="text-xs text-destructive mt-1">{cnpjError}</p>}
                    </div>
                  </div>

                  <Separator />
                  <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input id="address" value={churchData.address || ''} onChange={(e) => setChurchData({ ...churchData, address: e.target.value })} placeholder="Rua, número, complemento" />
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input id="city" value={churchData.city || ''} onChange={(e) => setChurchData({ ...churchData, city: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="state">Estado</Label>
                        <Input id="state" value={churchData.state || ''} onChange={(e) => setChurchData({ ...churchData, state: e.target.value })} maxLength={2} placeholder="UF" />
                      </div>
                      <div>
                        <Label htmlFor="zip_code">CEP</Label>
                        <Input id="zip_code" value={churchData.zip_code || ''} onChange={(e) => setChurchData({ ...churchData, zip_code: e.target.value })} placeholder="00000-000" />
                      </div>
                    </div>
                  </div>

                  <Separator />
                  <h3 className="text-sm font-medium text-muted-foreground">Contato e Mídia</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" value={churchData.phone || ''} onChange={(e) => setChurchData({ ...churchData, phone: e.target.value })} placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={churchData.email || ''} onChange={(e) => setChurchData({ ...churchData, email: e.target.value })} placeholder="contato@igreja.com" />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" value={churchData.website || ''} onChange={(e) => setChurchData({ ...churchData, website: e.target.value })} placeholder="https://www.igreja.com" />
                    </div>
                    <div>
                      <Label htmlFor="youtube_live_url">URL YouTube ao Vivo</Label>
                      <Input id="youtube_live_url" value={churchData.youtube_live_url || ''} onChange={(e) => setChurchData({ ...churchData, youtube_live_url: e.target.value })} placeholder="https://youtube.com/c/suaigreja/live" />
                    </div>
                  </div>

                  <Button type="submit" disabled={updateChurchMutation.isPending}>
                    {updateChurchMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                    Salvar Alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Financeiro */}
          <TabsContent value="financeiro" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Financeiros</CardTitle>
                <CardDescription>Configurações de PIX e dados bancários exibidos no Portal do Membro</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChurchSubmit} className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Chave PIX</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pix_key_type">Tipo da Chave</Label>
                      <Select value={churchData.pix_key_type || ''} onValueChange={(v) => setChurchData({ ...churchData, pix_key_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="random">Chave Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="pix_key">Chave PIX</Label>
                      <Input id="pix_key" value={churchData.pix_key || ''} onChange={(e) => setChurchData({ ...churchData, pix_key: e.target.value })} placeholder="Digite a chave PIX" />
                    </div>
                  </div>

                  <Separator />
                  <h3 className="text-sm font-medium text-muted-foreground">Dados Bancários</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bank_name">Banco</Label>
                      <Input id="bank_name" value={churchData.bank_name || ''} onChange={(e) => setChurchData({ ...churchData, bank_name: e.target.value })} placeholder="Ex: Banco do Brasil" />
                    </div>
                    <div>
                      <Label htmlFor="bank_agency">Agência</Label>
                      <Input id="bank_agency" value={churchData.bank_agency || ''} onChange={(e) => setChurchData({ ...churchData, bank_agency: e.target.value })} placeholder="0000" />
                    </div>
                    <div>
                      <Label htmlFor="bank_account">Conta</Label>
                      <Input id="bank_account" value={churchData.bank_account || ''} onChange={(e) => setChurchData({ ...churchData, bank_account: e.target.value })} placeholder="00000-0" />
                    </div>
                  </div>

                  <Separator />
                  <h3 className="text-sm font-medium text-muted-foreground">Arte QR Code PIX</h3>
                  <p className="text-xs text-muted-foreground">Suba a arte com o QR Code válido do seu PIX. Esta imagem será exibida no Portal do Membro em vez de um QR Code gerado automaticamente.</p>

                  {(churchData as any).pix_qr_image_url ? (
                    <div className="space-y-3">
                      <div className="relative w-fit">
                        <img src={(churchData as any).pix_qr_image_url} alt="QR Code PIX" className="max-w-[200px] rounded-xl border shadow-sm" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                          onClick={() => setChurchData({ ...churchData, pix_qr_image_url: null } as any)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const ext = file.name.split('.').pop();
                            const path = `pix-qr/${churchData.id}.${ext}`;
                            const { error: uploadError } = await supabase.storage.from('photos').upload(path, file, { upsert: true });
                            if (uploadError) { toast.error('Erro ao fazer upload: ' + uploadError.message); return; }
                            const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
                            setChurchData({ ...churchData, pix_qr_image_url: urlData.publicUrl } as any);
                            toast.success('Imagem carregada! Clique em Salvar para confirmar.');
                          }}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-xl hover:bg-muted/50 transition-colors">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Enviar arte do QR Code</span>
                        </div>
                      </label>
                    </div>
                  )}

                  <Button type="submit" disabled={updateChurchMutation.isPending}>
                    {updateChurchMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                    Salvar Alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Ministérios */}
          <TabsContent value="ministerios" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Ministérios Cadastrados</h2>
                <p className="text-sm text-muted-foreground">Gerencie os ministérios da sua igreja.</p>
              </div>
              <Button onClick={() => { setSelectedMinistry(null); setDialogOpen(true); }} className="gap-2" disabled={!canManageMinistries}>
                <Plus className="h-4 w-4" />
                Novo Ministério
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                {ministries && ministries.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ministries.map((ministry) => (
                          <TableRow key={ministry.id}>
                            <TableCell className="font-medium">{ministry.name}</TableCell>
                            <TableCell className="text-muted-foreground">{ministry.description || "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="icon" onClick={() => { setSelectedMinistry(ministry); setDialogOpen(true); }} disabled={saveMinistryMutation.isPending || !canManageMinistries}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => { setMinistryToDelete(ministry.id); setDeleteDialogOpen(true); }} disabled={deleteMinistryMutation.isPending || !canManageMinistries}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhum ministério cadastrado. Clique em "Novo Ministério" para começar.</p>
                  </div>
                )}
                {!canManageMinistries && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">Você não tem permissão para gerenciar ministérios.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Personalizar */}
          <TabsContent value="personalizar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalização Visual</CardTitle>
                <CardDescription>Configure logo e cores da igreja. Essas cores serão aplicadas em todo o app automaticamente.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChurchSubmit} className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Logo da Igreja</h3>
                    {churchData.logo_url ? (
                      <div className="relative w-fit">
                        <img src={churchData.logo_url} alt="Logo" className="h-24 w-24 rounded-2xl border shadow-sm object-cover" />
                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                          onClick={() => setChurchData({ ...churchData, logo_url: null })}
                        ><X className="h-3 w-3" /></Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const ext = file.name.split('.').pop();
                          const path = `logos/${churchData.id}.${ext}`;
                          const { error: uploadError } = await supabase.storage.from('photos').upload(path, file, { upsert: true });
                          if (uploadError) { toast.error('Erro ao enviar logo: ' + uploadError.message); return; }
                          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
                          setChurchData({ ...churchData, logo_url: urlData.publicUrl });
                          toast.success('Logo carregada! Clique em Salvar.');
                        }} />
                        <div className="flex items-center gap-2 px-4 py-3 border border-dashed rounded-xl hover:bg-muted/50 transition-colors w-fit">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Enviar logo da igreja</span>
                        </div>
                      </label>
                    )}
                  </div>

                  <Separator />

                  {/* Colors */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Cores do App</h3>
                    <p className="text-xs text-muted-foreground">Defina as cores personalizadas da sua igreja. Deixe em branco para usar o tema padrão.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary_color">Cor Primária</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" id="primary_color_picker" value={(churchData as any).primary_color || '#6366f1'}
                            onChange={(e) => setChurchData({ ...churchData, primary_color: e.target.value } as any)}
                            className="h-10 w-10 rounded-lg border cursor-pointer" />
                          <Input value={(churchData as any).primary_color || ''} onChange={(e) => setChurchData({ ...churchData, primary_color: e.target.value } as any)}
                            placeholder="#6366f1" className="font-mono text-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondary_color">Cor Secundária</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" id="secondary_color_picker" value={(churchData as any).secondary_color || '#8b5cf6'}
                            onChange={(e) => setChurchData({ ...churchData, secondary_color: e.target.value } as any)}
                            className="h-10 w-10 rounded-lg border cursor-pointer" />
                          <Input value={(churchData as any).secondary_color || ''} onChange={(e) => setChurchData({ ...churchData, secondary_color: e.target.value } as any)}
                            placeholder="#8b5cf6" className="font-mono text-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accent_color">Cor de Destaque</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" id="accent_color_picker" value={(churchData as any).accent_color || '#f59e0b'}
                            onChange={(e) => setChurchData({ ...churchData, accent_color: e.target.value } as any)}
                            className="h-10 w-10 rounded-lg border cursor-pointer" />
                          <Input value={(churchData as any).accent_color || ''} onChange={(e) => setChurchData({ ...churchData, accent_color: e.target.value } as any)}
                            placeholder="#f59e0b" className="font-mono text-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    {((churchData as any).primary_color || (churchData as any).secondary_color || (churchData as any).accent_color) && (
                      <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Preview</p>
                        <div className="flex gap-3">
                          {(churchData as any).primary_color && (
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-12 w-12 rounded-xl shadow-sm" style={{ backgroundColor: (churchData as any).primary_color }} />
                              <span className="text-[10px] text-muted-foreground">Primária</span>
                            </div>
                          )}
                          {(churchData as any).secondary_color && (
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-12 w-12 rounded-xl shadow-sm" style={{ backgroundColor: (churchData as any).secondary_color }} />
                              <span className="text-[10px] text-muted-foreground">Secundária</span>
                            </div>
                          )}
                          {(churchData as any).accent_color && (
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-12 w-12 rounded-xl shadow-sm" style={{ backgroundColor: (churchData as any).accent_color }} />
                              <span className="text-[10px] text-muted-foreground">Destaque</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={updateChurchMutation.isPending}>
                    {updateChurchMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                    Salvar Personalização
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Ministry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedMinistry ? "Editar Ministério" : "Novo Ministério"}</DialogTitle>
            <DialogDescription>{selectedMinistry ? "Faça alterações no ministério." : "Adicione um novo ministério."}</DialogDescription>
          </DialogHeader>
          <Form {...ministryForm}>
            <form onSubmit={ministryForm.handleSubmit((values) => saveMinistryMutation.mutate(values))} className="space-y-4 py-4">
              <FormField control={ministryForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Ministério</FormLabel>
                  <FormControl><Input placeholder="Ex: Louvor, Missões, Jovens" {...field} disabled={!canManageMinistries} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={ministryForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl><Input placeholder="Breve descrição do ministério" {...field} disabled={!canManageMinistries} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saveMinistryMutation.isPending || !canManageMinistries}>
                  {saveMinistryMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                  {selectedMinistry ? "Salvar Alterações" : "Criar Ministério"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Ministry Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. O ministério será permanentemente excluído.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => ministryToDelete && deleteMinistryMutation.mutate(ministryToDelete)} disabled={!canManageMinistries}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default GerenciarIgreja;
