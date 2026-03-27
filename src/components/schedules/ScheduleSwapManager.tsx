import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeftRight,
  Check,
  X,
  Loader2,
  Clock,
  Send,
} from "lucide-react";
import { useVolunteerScheduleSwaps, ScheduleSwap } from "@/hooks/useVolunteerScheduleSwaps";
import { VolunteerSchedule } from "@/hooks/useVolunteerSchedules";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleSwapManagerProps {
  volunteerId?: string;
  schedule?: VolunteerSchedule | null;
  onRequestSwap?: (scheduleId: string) => void;
}

export function ScheduleSwapManager({
  volunteerId,
  schedule,
}: ScheduleSwapManagerProps) {
  const {
    pendingSwaps,
    myRequests,
    incomingRequests,
    isLoading,
    createSwap,
    isCreatingSwap,
    respondSwap,
    isResponding,
    cancelSwap,
    isCancelling,
  } = useVolunteerScheduleSwaps(volunteerId);

  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [swapReason, setSwapReason] = useState("");

  const handleRequestSwap = async () => {
    if (!schedule || !volunteerId) return;

    await createSwap({
      original_schedule_id: schedule.id,
      requester_id: volunteerId,
      reason: swapReason || undefined,
    });

    setShowRequestDialog(false);
    setSwapReason("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case "accepted":
        return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> Aceita</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Rejeitada</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Trocas de Escala
            {pendingSwaps.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {pendingSwaps.length}
              </Badge>
            )}
          </CardTitle>
          {schedule && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRequestDialog(true)}
              className="gap-1"
            >
              <Send className="h-3.5 w-3.5" />
              Solicitar Troca
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Incoming requests (I need to respond) */}
          {incomingRequests.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Solicitações recebidas
              </p>
              {incomingRequests.map((swap) => (
                <div
                  key={swap.id}
                  className="p-3 rounded-lg border border-primary/20 bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{swap.requester_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {swap.schedule_date &&
                          format(new Date(swap.schedule_date + "T12:00:00"), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        {swap.shift_start && ` • ${swap.shift_start.slice(0, 5)} - ${swap.shift_end?.slice(0, 5)}`}
                      </p>
                      {swap.reason && (
                        <p className="text-xs text-muted-foreground mt-1">"{swap.reason}"</p>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => respondSwap({ swapId: swap.id, status: "accepted" })}
                        disabled={isResponding}
                        className="h-7 px-2 gap-1"
                      >
                        <Check className="h-3 w-3" /> Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondSwap({ swapId: swap.id, status: "rejected" })}
                        disabled={isResponding}
                        className="h-7 px-2 gap-1"
                      >
                        <X className="h-3 w-3" /> Recusar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* My requests */}
          {myRequests.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Minhas solicitações
              </p>
              {myRequests.slice(0, 5).map((swap) => (
                <div key={swap.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {swap.schedule_date &&
                        format(new Date(swap.schedule_date + "T12:00:00"), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      {swap.shift_start && ` • ${swap.shift_start.slice(0, 5)}`}
                    </p>
                    {swap.target_name && (
                      <p className="text-xs text-muted-foreground">Para: {swap.target_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(swap.status)}
                    {swap.status === "pending" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => cancelSwap(swap.id)}
                        disabled={isCancelling}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            incomingRequests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma solicitação de troca
              </p>
            )
          )}
        </CardContent>
      </Card>

      {/* Request swap dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Solicitar Troca de Escala</DialogTitle>
          </DialogHeader>

          {schedule && (
            <div className="py-2 space-y-3">
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-sm font-medium">
                  {format(new Date(schedule.schedule_date + "T12:00:00"), "EEEE, dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {schedule.shift_start.slice(0, 5)} - {schedule.shift_end.slice(0, 5)}
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Motivo (opcional)</label>
                <Textarea
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Informe o motivo da troca..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRequestSwap} disabled={isCreatingSwap}>
              {isCreatingSwap && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
