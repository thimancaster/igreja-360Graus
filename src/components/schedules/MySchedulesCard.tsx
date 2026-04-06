import { useState } from "react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Check, MapPin, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
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

interface Schedule {
  id: string;
  schedule_date: string;
  shift_start: string;
  shift_end: string;
  schedule_type: 'primary' | 'backup';
  confirmed: boolean;
  ministry_name?: string;
  notes?: string | null;
  classroom?: string | null;
  is_kids_ministry?: boolean;
}

interface MySchedulesCardProps {
  schedules: Schedule[];
  isLoading: boolean;
  onConfirm: (scheduleId: string) => Promise<void>;
  isConfirming: boolean;
  onRequestSwap?: (schedule: Schedule) => void;
}

export function MySchedulesCard({
  schedules,
  isLoading,
  onConfirm,
  isConfirming,
  onRequestSwap,
}: MySchedulesCardProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [scheduleToConfirm, setScheduleToConfirm] = useState<Schedule | null>(null);

  // Sort schedules by date
  const sortedSchedules = [...schedules].sort((a, b) =>
    new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime()
  );

  // Filter upcoming schedules (today and future)
  const upcomingSchedules = sortedSchedules.filter(s =>
    !isPast(parseISO(s.schedule_date)) || isToday(parseISO(s.schedule_date))
  );

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "EEEE, d 'de' MMM", { locale: ptBR });
  };

  const handleConfirmClick = (schedule: Schedule) => {
    setScheduleToConfirm(schedule);
    setConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!scheduleToConfirm) return;
    await onConfirm(scheduleToConfirm.id);
    setConfirmDialogOpen(false);
    setScheduleToConfirm(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Minhas Escalas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (upcomingSchedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Minhas Escalas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Nenhuma escala programada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Minhas Escalas
            <Badge variant="secondary">{upcomingSchedules.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingSchedules.slice(0, 5).map((schedule) => {
              const date = parseISO(schedule.schedule_date);
              const isScheduleToday = isToday(date);

              return (
                <div
                  key={schedule.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    isScheduleToday && "border-primary bg-primary/5",
                    schedule.is_kids_ministry && !isScheduleToday && "border-orange-200 bg-orange-50/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "font-medium text-sm capitalize",
                          isScheduleToday && "text-primary"
                        )}>
                          {getDateLabel(schedule.schedule_date)}
                        </span>
                        <Badge variant={schedule.schedule_type === 'primary' ? 'default' : 'secondary'} className="text-xs">
                          {schedule.schedule_type === 'primary' ? 'Titular' : 'Reserva'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {schedule.shift_start.slice(0, 5)} - {schedule.shift_end.slice(0, 5)}
                        </span>
                        {schedule.ministry_name && (
                          <span className={cn(
                            "flex items-center gap-1 font-medium",
                            schedule.is_kids_ministry && "text-orange-600"
                          )}>
                            {schedule.is_kids_ministry ? "🎒 " : <MapPin className="h-3.5 w-3.5" />}
                            {schedule.ministry_name}
                            {schedule.classroom && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full ml-1">
                                Sala: {schedule.classroom}
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {schedule.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {schedule.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {schedule.confirmed ? (
                        <Badge variant="outline" className="gap-1 text-primary border-primary">
                          <Check className="h-3 w-3" />
                          Confirmado
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfirmClick(schedule)}
                          disabled={isConfirming}
                          className="gap-1 h-7"
                        >
                          <Check className="h-3 w-3" />
                          Confirmar
                        </Button>
                      )}
                      {onRequestSwap && !schedule.confirmed && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRequestSwap(schedule)}
                          className="gap-1 h-7 text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                          Trocar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {upcomingSchedules.length > 5 && (
              <div className="text-center text-sm text-muted-foreground">
                +{upcomingSchedules.length - 5} mais escalas
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm presence dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar presença</AlertDialogTitle>
            <AlertDialogDescription>
              {scheduleToConfirm && (
                <>
                  Confirmar sua presença na escala de{" "}
                  <strong>
                    {format(parseISO(scheduleToConfirm.schedule_date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </strong>{" "}
                  das {scheduleToConfirm.shift_start.slice(0, 5)} às{" "}
                  {scheduleToConfirm.shift_end.slice(0, 5)}?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={isConfirming}>
              <Check className="h-4 w-4 mr-2" />
              Confirmar presença
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
