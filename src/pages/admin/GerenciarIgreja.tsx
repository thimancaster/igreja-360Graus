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
import { AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { formatCNPJ, validateCNPJ } from '@/lib/cnpjUtils';
import { pageVariants, pageTransition } from '@/lib/pageAnimations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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

  // Church state
  const [churchData, setChurchData] = useState<Church | null>(null);
  const [cnpjError, setCnpjError] = useState<string | null>(null);

  // Ministry state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ministryToDelete, setMinistryToDelete] = useState<string | null>(null);

  const canManageMinistries = isAdmin || isTesoureiro;

  const ministryForm = useForm<MinistryFormValues>({
    resolver: zodResolver(ministrySchema),
    defaultValues: { name: "", description: "" },
  });

  // ---- Church queries ----
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

  // ---- Handlers ----
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
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="dados">Dados da Igreja</TabsTrigger>
            <TabsTrigger value="ministerios">Ministérios</TabsTrigger>
          </TabsList>

          {/* Aba Dados da Igreja */}
          <TabsContent value="dados" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Igreja: {churchData.name}</CardTitle>
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
                      <p className="text-xs text-muted-foreground mt-1">Deixe em branco se não possuir CNPJ</p>
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
