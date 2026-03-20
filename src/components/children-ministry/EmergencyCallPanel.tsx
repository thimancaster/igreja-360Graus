import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmergencyCallPanelProps {
  childId: string;
  childName: string;
  classroom: string;
}

export function EmergencyCallButton({ childId, childName, classroom }: EmergencyCallPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleEmergencyCall = async () => {
    setSending(true);
    try {
      // Get guardians linked to this child
      const { data: links } = await supabase
        .from("child_guardians")
        .select("guardian_id, guardians!child_guardians_guardian_id_fkey(profile_id, full_name)")
        .eq("child_id", childId);

      if (!links || links.length === 0) {
        toast.error("Nenhum responsável vinculado a esta criança");
        setSending(false);
        return;
      }

      const notifications = links
        .filter((l: any) => l.guardians?.profile_id)
        .map((l: any) => ({
          user_id: l.guardians.profile_id,
          title: "🚨 CHAMADA URGENTE - Ministério Infantil",
          message: `Compareça IMEDIATAMENTE! Seu filho(a) ${childName} (${classroom}) precisa de você.`,
          type: "urgent",
          link: "/portal/filhos",
        }));

      if (notifications.length === 0) {
        toast.error("Nenhum responsável com conta no portal");
        setSending(false);
        return;
      }

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      // Trigger push notification edge function for each guardian
      for (const notif of notifications) {
        supabase.functions.invoke("send-push-notification", {
          body: {
            user_id: notif.user_id,
            title: notif.title,
            message: notif.message,
            type: "urgent",
            url: "/portal/filhos",
          },
        }).catch(console.error);
      }

      toast.success(`Chamada de emergência enviada para ${notifications.length} responsável(eis)`);
      setDialogOpen(false);
    } catch (err) {
      toast.error("Erro ao enviar chamada de emergência");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        className="gap-1.5"
        onClick={() => setDialogOpen(true)}
      >
        <PhoneCall className="h-3.5 w-3.5" />
        Chamar
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Chamada de Emergência
            </DialogTitle>
            <DialogDescription>
              Isso enviará uma notificação URGENTE para todos os responsáveis de <strong>{childName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm font-medium">{childName}</p>
            <p className="text-xs text-muted-foreground">{classroom}</p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleEmergencyCall}
              disabled={sending}
              className="w-full sm:w-auto gap-2"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
              Confirmar Chamada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
