import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Clock, Shield, AlertTriangle, User, Phone, FileText } from "lucide-react";
import { useParentChildren, usePickupAuthorizations, usePickupAuthorizationMutations } from "@/hooks/useParentData";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const authorizationSchema = z.object({
  authorized_person_name: z.string().min(3, "Nome é obrigatório"),
  authorized_person_phone: z.string().optional(),
  authorized_person_document: z.string().optional(),
  authorization_type: z.enum(["one_time", "date_range", "permanent"]),
  valid_until: z.string().optional(),
  security_pin: z.string().min(4, "PIN deve ter no mínimo 4 dígitos").max(6, "PIN deve ter no máximo 6 dígitos"),
  reason: z.string().optional(),
  leader_approval_required: z.boolean().default(false),
});

type AuthorizationFormData = z.infer<typeof authorizationSchema>;

export default function ParentAuthorizations() {
  const [searchParams] = useSearchParams();
  const preselectedChildId = searchParams.get("childId");
  
  const [selectedChildId, setSelectedChildId] = useState<string>(preselectedChildId || "");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: children, isLoading: loadingChildren } = useParentChildren();
  const { data: authorizations, isLoading: loadingAuth } = usePickupAuthorizations(selectedChildId || undefined);
  const { createAuthorization, cancelAuthorization } = usePickupAuthorizationMutations();

  const form = useForm<AuthorizationFormData>({
    resolver: zodResolver(authorizationSchema),
    defaultValues: {
      authorization_type: "one_time",
      leader_approval_required: false,
    },
  });

  const onSubmit = async (data: AuthorizationFormData) => {
    if (!selectedChildId) return;

    await createAuthorization.mutateAsync({
      child_id: selectedChildId,
      authorized_person_name: data.authorized_person_name,
      authorized_person_phone: data.authorized_person_phone,
      authorized_person_document: data.authorized_person_document,
      authorization_type: data.authorization_type,
      valid_until: data.valid_until,
      security_pin: data.security_pin,
      reason: data.reason,
      leader_approval_required: data.leader_approval_required,
    });
    setDialogOpen(false);
    form.reset();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Aguardando", variant: "secondary" },
      approved: { label: "Aprovada", variant: "default" },
      active: { label: "Ativa", variant: "default" },
      used: { label: "Utilizada", variant: "outline" },
      expired: { label: "Expirada", variant: "destructive" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };
    const { label, variant } = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      one_time: "Uso Único",
      date_range: "Período",
      permanent: "Permanente",
    };
    return <Badge variant="outline" className="text-xs">{typeMap[type] || type}</Badge>;
  };

  if (loadingChildren) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 space-y-6 pt-4 px-4 pb-28 min-h-screen"
    >
      <div className="flex items-center gap-3">
        <img src="/kids/icon_ticket.png" alt="Autorizações" className="w-14 h-14 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.1)]" />
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-none bg-gradient-to-r from-orange-500 to-rose-600 bg-clip-text text-transparent">Autorizações 🛡️</h1>
          <p className="text-sm font-medium text-gray-700 mt-1">
            Escolha quem pode buscar seus filhos
          </p>
        </div>
      </div>

      {/* Child selector */}
      <div className="glass-card-kids p-4 pt-6 bg-white/60">
          <Label className="text-sm font-medium mb-2 block">Selecionar Filho</Label>
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Escolha uma criança" />
            </SelectTrigger>
            <SelectContent>
              {children?.map((child: any) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.full_name} - {child.classroom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>

      {selectedChildId && (
        <>
          {/* Add authorization button */}
          <Button onClick={() => setDialogOpen(true)} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Nova Autorização
          </Button>

          {/* Authorizations list */}
          {loadingAuth ? (
            <div className="flex h-32 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : authorizations && authorizations.length > 0 ? (
            <div className="space-y-3">
              {authorizations.map((auth, index) => (
                <motion.div
                  key={auth.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="glass-card-kids border border-white/50 overflow-hidden bg-white/75 hover:scale-[1.01] transition-all flex flex-col p-5 gap-3 shadow-xl">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-[#1a1a1a] text-lg flex items-center gap-2 truncate">
                            <User className="h-5 w-5 shrink-0 text-orange-500" />
                            {auth.authorized_person_name}
                          </h3>
                          {auth.authorized_person_phone && (
                            <p className="flex items-center gap-1 mt-1 text-sm text-gray-600 font-medium">
                              <Phone className="h-4 w-4" />
                              {auth.authorized_person_phone}
                            </p>
                          )}
                        </div>
                        {auth.is_used ? getStatusBadge("used") : getStatusBadge("active")}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {auth.is_one_time ? (
                          <Badge variant="outline" className="text-xs bg-white text-[#1a1a1a]">Uso Único</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-white text-[#1a1a1a]">Permanente</Badge>
                        )}
                      </div>

                      {auth.valid_until && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                          <Clock className="h-4 w-4" />
                          Até: {format(new Date(auth.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      )}

                      {auth.notes && (
                        <p className="text-sm text-gray-600 font-medium flex items-start gap-2 bg-black/5 p-2 rounded-xl">
                          <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                          {auth.notes}
                        </p>
                      )}

                      {!auth.is_used && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full gap-2 rounded-xl mt-2 font-bold shadow-sm"
                          onClick={() => cancelAuthorization.mutate(auth.id)}
                          disabled={cancelAuthorization.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Cancelar
                        </Button>
                      )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card-kids px-6 py-12 flex flex-col items-center justify-center text-center bg-white/60">
                <div className="w-16 h-16 rounded-full bg-slate-100 shadow-inner flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-extrabold text-[#1a1a1a] text-lg">Nenhuma autorização ativa</p>
                <p className="text-sm text-gray-600 font-medium mt-1">Crie autorizações para terceiros buscarem seu filho</p>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 p-0 border-0 glass-card-kids shadow-2xl overflow-hidden bg-white/90">
          <div className="h-2 bg-gradient-to-r from-orange-400 to-rose-400" />
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 flex items-center justify-center shadow-inner shrink-0">
                  <img src="/kids/icon_ticket.png" alt="Ticket" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight">Nova Autorização</DialogTitle>
                  <DialogDescription className="text-sm font-medium text-gray-600">
                    Preencha os dados da pessoa autorizada
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authorized_person_name">Nome Completo *</Label>
              <Input
                id="authorized_person_name"
                {...form.register("authorized_person_name")}
                placeholder="Nome da pessoa autorizada"
              />
              {form.formState.errors.authorized_person_name && (
                <p className="text-sm text-destructive">{form.formState.errors.authorized_person_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="authorized_person_phone">Telefone</Label>
                <Input
                  id="authorized_person_phone"
                  {...form.register("authorized_person_phone")}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorized_person_document">Documento</Label>
                <Input
                  id="authorized_person_document"
                  {...form.register("authorized_person_document")}
                  placeholder="RG ou CPF"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorization_type">Tipo</Label>
              <Select
                value={form.watch("authorization_type")}
                onValueChange={(value) => form.setValue("authorization_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">Uso Único</SelectItem>
                  <SelectItem value="date_range">Período Específico</SelectItem>
                  <SelectItem value="permanent">Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valid_until" className="font-bold text-[#1a1a1a]">Válida Até</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  {...form.register("valid_until")}
                  className="bg-white/50 border-black/10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="security_pin">PIN de Segurança *</Label>
              <Input
                id="security_pin"
                type="password"
                maxLength={6}
                {...form.register("security_pin")}
                placeholder="4-6 dígitos"
                className="text-center text-lg tracking-widest"
              />
              {form.formState.errors.security_pin && (
                <p className="text-sm text-destructive">{form.formState.errors.security_pin.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Este PIN será solicitado na retirada
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                {...form.register("reason")}
                placeholder="Ex: Buscar no culto de domingo"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Requer aprovação</Label>
                <p className="text-xs text-muted-foreground">
                  Líder deve aprovar
                </p>
              </div>
              <Switch
                checked={form.watch("leader_approval_required")}
                onCheckedChange={(checked) => form.setValue("leader_approval_required", checked)}
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Compartilhe o PIN apenas com a pessoa autorizada
              </p>
            </div>

            <DialogFooter className="flex gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="flex-1 rounded-xl font-bold text-gray-500">
                Cancelar
              </Button>
              <Button type="submit" disabled={createAuthorization.isPending} className="flex-1 rounded-xl font-bold bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 border-0 shadow-lg shadow-orange-500/25">
                {createAuthorization.isPending ? "Criando..." : "Criar Autorização ✅"}
              </Button>
            </DialogFooter>
          </form>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
