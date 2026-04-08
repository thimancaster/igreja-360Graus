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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { CalendarOff, Plus, Trash2, Loader2 } from "lucide-react";
import { useVolunteerAvailability } from "@/hooks/useVolunteerAvailability";
import { Skeleton } from "@/components/ui/skeleton";

interface VolunteerAvailabilityManagerProps {
  volunteerId?: string;
  volunteerIds?: string[];
  volunteerName?: string;
  compact?: boolean;
}

export function VolunteerAvailabilityManager({
  volunteerId,
  volunteerIds,
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
  } = useVolunteerAvailability(volunteerIds || volunteerId);

  const [showDialog, setShowDialog] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;

    await createAvailability({
      volunteer_id: volunteerId,
      volunteer_ids: volunteerIds,
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
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card border border-white/20 bg-white/10 dark:bg-black/20 shadow-lg backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarOff className="h-4 w-4" />
            Minha Indisponibilidade
            {availability.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-0">
                {availability.length}
              </Badge>
            )}
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setShowDialog(true)} 
            className="gap-1 rounded-full shadow-md shadow-primary/20 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            {!compact && "Adicionar"}
          </Button>
        </CardHeader>
        <CardContent>
          {availability.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 opacity-70">
              Nenhuma viagem ou férias agendada
            </p>
          ) : (
            <div className="space-y-2">
              {availability.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-sm shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold tracking-tight">
                      {format(new Date(item.start_date + "T12:00:00"), "dd/MM", { locale: ptBR })}
                      {" até "}
                      {format(new Date(item.end_date + "T12:00:00"), "dd/MM", { locale: ptBR })}
                    </p>
                    {item.reason && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.reason}</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                    onClick={() => deleteAvailability(item.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer open={showDialog} onOpenChange={setShowDialog}>
        <DrawerContent className="px-4 pb-8 pt-2 select-none border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] bg-background/95 backdrop-blur-3xl rounded-t-3xl">
          <DrawerHeader className="text-left px-0 pb-2">
            <DrawerTitle className="text-xl font-bold tracking-tight">Anunciar Indisponibilidade</DrawerTitle>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Vamos bloquear a sua escala nestes dias. Se já estiver escalado, o sistema alertará a sua liderança!
            </p>
          </DrawerHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="start-date" className="text-xs font-semibold px-2">Sairei dia</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-2xl border-white/10 bg-black/5 dark:bg-white/5 h-12 shadow-inner"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="end-date" className="text-xs font-semibold px-2">Volto dia</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="rounded-2xl border-white/10 bg-black/5 dark:bg-white/5 h-12 shadow-inner"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="reason" className="text-xs font-semibold px-2">Para onde vai? (Opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vou para as Maldivas 🏖️"
                rows={2}
                className="rounded-2xl border-white/10 bg-black/5 dark:bg-white/5 shadow-inner resize-none focus-visible:ring-1"
              />
            </div>
          </div>

          <DrawerFooter className="px-0 pt-2 gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!startDate || !endDate || isCreating}
              className="w-full h-12 rounded-full text-base font-bold shadow-lg shadow-primary/20"
            >
              {isCreating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Confirmar Viagem
            </Button>
            <Button variant="ghost" onClick={() => setShowDialog(false)} className="w-full rounded-full">
              Cancelar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
