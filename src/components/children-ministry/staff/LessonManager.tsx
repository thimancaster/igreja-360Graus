import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, BookOpen, Clock, AlertTriangle, CheckSquare } from "lucide-react";
import { useStaffSchedules } from "@/hooks/useMinistryStaff";
import { Badge } from "@/components/ui/badge";
import { LessonPreparationModal } from "./LessonPreparationModal";

export function LessonManager() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [selectedScheduleForLesson, setSelectedScheduleForLesson] = useState<any>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

  const { data: schedules, isLoading } = useStaffSchedules(
    weekStart.toISOString(),
    weekEnd.toISOString()
  );

  const previousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  return (
    <Card className="glass-card border-white/20">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Central de Aulas
          </CardTitle>
          <CardDescription>Envie os materiais (PDFs) para sua equipe dar aula.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday} className="h-8">
            Hoje
          </Button>
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-full p-1">
            <Button variant="ghost" size="icon" onClick={previousWeek} className="h-7 w-7 rounded-full hover:bg-background">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(weekStart, "dd MMM", { locale: ptBR })} - {format(weekEnd, "dd MMM", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" onClick={nextWeek} className="h-7 w-7 rounded-full hover:bg-background">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="h-8 w-8 bg-black/10 dark:bg-white/10 rounded-full"></div>
              <div className="h-4 w-48 bg-black/10 dark:bg-white/10 rounded-full"></div>
            </div>
          </div>
        ) : schedules && schedules.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schedules.map((schedule) => (
              <div 
                key={schedule.id} 
                className="flex flex-col p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm hover:border-primary/30 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={schedule.confirmed ? "default" : "secondary"} className="text-[10px]">
                    {schedule.confirmed ? "Confirmado" : "Pendente"}
                  </Badge>
                  <span className="text-xs font-semibold opacity-70">
                    {format(new Date(schedule.shift_start), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg leading-tight mt-1">{schedule.staff?.full_name || "—"}</h3>
                
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> 
                    {format(new Date(schedule.shift_start), "HH:mm")} 
                  </div>
                  <span>•</span>
                  <span>{schedule.classroom || schedule.role}</span>
                </div>

                <Button 
                  className="mt-4 w-full rounded-xl gap-2"
                  variant="secondary"
                  onClick={() => {
                    setSelectedScheduleForLesson(schedule);
                    setLessonDialogOpen(true);
                  }}
                >
                  <BookOpen className="w-4 h-4 text-primary" />
                  Preparar / Anexar Conteúdo
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-primary/10 text-primary">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1">Nenhuma Escala na Semana</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Você precisa criar escalas primeiro para depois enviar aulas para sua equipe.
            </p>
          </div>
        )}
      </CardContent>

      <LessonPreparationModal
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        schedule={selectedScheduleForLesson}
      />
    </Card>
  );
}
