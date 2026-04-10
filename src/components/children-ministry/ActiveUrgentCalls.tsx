import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CheckCircle2, BellRing, Clock, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ActiveUrgentCalls() {
  const { announcements, confirmCall, cancelCall, publishAnnouncement } = useAnnouncements();
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  // Track which calls were already resent in this session (to track via timestamp)
  const lastResentRef = useRef<Record<string, number>>({});

  // Filtrar chamados urgentes ativos (não confirmados pelo staff)
  const activeCalls = announcements.filter(
    (a) => a.priority === "urgent" && a.response_status !== "confirmed"
  );

  // ─── WATCHDOG INFINITO ───────────────────────────────────────────────────
  // Roda a cada 60s. Para CADA chamado ativo:
  //   • Se pai ainda NÃO respondeu → reenviar após 5 min do último envio
  //   • Se pai respondeu "on_my_way" mas staff não confirmou → reenviar após 5 min
  // O loop só para quando staff clicar em "Confirmar Chegada" ou "Cancelar Chamado"
  useEffect(() => {
    if (activeCalls.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      activeCalls.forEach((call) => {
        const lastSentAt = call.last_alert_sent_at
          ? new Date(call.last_alert_sent_at)
          : new Date(call.created_at);

        const diffMinutes = differenceInMinutes(now, lastSentAt);

        // 5 min sem resposta ou confirmação → republicar (dispara WhatsApp automaticamente via publishAnnouncement)
        if (diffMinutes >= 5) {
          const lastResentMs = lastResentRef.current[call.id];
          // Evita reenvio duplicado dentro do mesmo intervalo de 60s
          if (!lastResentMs || now.getTime() - lastResentMs > 4 * 60 * 1000) {
            lastResentRef.current[call.id] = now.getTime();
            console.log(`[Watchdog] Reenviando chamado ${call.id} — ${diffMinutes}min sem confirmação.`);
            publishAnnouncement(call.id);
            toast.warning(`🔔 Reenvio automático: "${call.title}" — responsável ainda não confirmou.`, {
              duration: 6000,
            });
          }
        }
      });
    }, 60_000); // checar a cada 1 min

    return () => clearInterval(interval);
  }, [activeCalls, publishAnnouncement]);
  // ────────────────────────────────────────────────────────────────────────

  if (activeCalls.length === 0) return null;

  return (
    <>
      <div className="mb-6 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-red-600 flex items-center gap-2 uppercase tracking-wider">
            <BellRing className="h-4 w-4 animate-bounce" />
            Chamados Urgentes Ativos
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {activeCalls.length}
            </span>
          </h2>
          <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Reenvio automático a cada 5 min
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {activeCalls.map((call) => {
              const lastSentAt = call.last_alert_sent_at
                ? new Date(call.last_alert_sent_at)
                : new Date(call.created_at);
              const minsSinceLastAlert = differenceInMinutes(new Date(), lastSentAt);
              const nextResendIn = Math.max(0, 5 - minsSinceLastAlert);

              return (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-2xl border-2 shadow-lg transition-all ${
                    call.response_status === "on_my_way"
                      ? "bg-amber-50 border-amber-300"
                      : "bg-red-50 border-red-300 animate-pulse"
                  }`}
                >
                  <div className="flex flex-col h-full gap-3">
                    {/* Top row */}
                    <div className="flex justify-between items-start">
                      <Badge variant={call.response_status === "on_my_way" ? "warning" : "destructive"}>
                        {call.response_status === "on_my_way" ? "A CAMINHO" : "AGUARDANDO"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(call.created_at), { locale: ptBR, addSuffix: true })}
                      </span>
                    </div>

                    {/* Content */}
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">{call.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{call.content}</p>
                    </div>

                    {/* Response status */}
                    {call.response_status === "on_my_way" && (
                      <div className="flex items-center gap-2 p-2 bg-amber-100 rounded-lg border border-amber-200">
                        <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                        <div className="text-[10px] font-bold text-amber-700 uppercase">
                          O responsável está a caminho!
                        </div>
                      </div>
                    )}

                    {/* Resend countdown */}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                      <RefreshCw className="h-3 w-3" />
                      {nextResendIn > 0
                        ? `Próximo reenvio em ~${nextResendIn} min`
                        : "Reenvio iminente…"}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-auto">
                      <Button
                        onClick={() => confirmCall(call.id)}
                        size="sm"
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Confirmado
                      </Button>
                      <Button
                        onClick={() => setCancelTargetId(call.id)}
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold"
                        title="Cancelar chamado (encerrar loop)"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm Cancel Dialog */}
      <AlertDialog open={!!cancelTargetId} onOpenChange={(open) => !open && setCancelTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar chamado urgente?</AlertDialogTitle>
            <AlertDialogDescription>
              O loop de reenvio automático será interrompido e o chamado será considerado encerrado. 
              Certifique-se de que a situação foi resolvida antes de confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter ativo</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (cancelTargetId) {
                  cancelCall(cancelTargetId);
                  setCancelTargetId(null);
                }
              }}
            >
              Encerrar chamado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
