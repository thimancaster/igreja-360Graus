import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarOff, Plus, Trash2, Loader2 } from "lucide-react";
import { useVolunteerAvailability } from "@/hooks/useVolunteerAvailability";
import { Skeleton } from "@/components/ui/skeleton";

interface VolunteerAvailabilityManagerProps {
  volunteerId: string;
  volunteerName?: string;
  compact?: boolean;
}

export function VolunteerAvailabilityManager({
  volunteerId,
  volunteerName,
  compact = false,
}: VolunteerAvailabilityManagerProps) {
  const {
    availability,
    isLoading,
    createAvailability,
    isCreating,
    deleteAvailability,
    isDeleting,
  } = useVolunteerAvailability(volunteerId);

  const [showDialog, setShowDialog] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;

    await createAvailability({
      volunteer_id: volunteerId,
      start_date: startDate,
      end_date: endDate,
      reason: reason || undefined,
    });

    setShowDialog(false);
    setStartDate("");
    setEndDate("");
    setReason("");
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
            <CalendarOff className="h-4 w-4" />
            Indisponibilidades
            {availability.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {availability.length}
              </Badge>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowDialog(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            {!compact && "Adicionar"}
          </Button>
        </CardHeader>
        <CardContent>
          {availability.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma indisponibilidade registrada
            </p>
          ) : (
            <div className="space-y-2">
              {availability.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {format(new Date(item.start_date + "T12:00:00"), "dd/MM", { locale: ptBR })}
                      {" — "}
                      {format(new Date(item.end_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    {item.reason && (
                      <p className="text-xs text-muted-foreground truncate">{item.reason}</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteAvailability(item.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar Indisponibilidade</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="start-date">Data Início</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="end-date">Data Fim</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Viagem, compromisso pessoal..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!startDate || !endDate || isCreating}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
