import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Check, Clock, BellRing, ClipboardList } from "lucide-react";
import { useVolunteerSchedules, VolunteerSchedule } from "@/hooks/useVolunteerSchedules";
import { VolunteerAvailabilityManager } from "@/components/schedules/VolunteerAvailabilityManager";
import { ScheduleSwapManager } from "@/components/schedules/ScheduleSwapManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PortalSchedules() {
  const [currentMonth] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<VolunteerSchedule | null>(null);
  const [activeTab, setActiveTab] = useState("minhas");

  const { 
    mySchedules, 
    openSchedules, 
    volunteerData, 
    mySchedulesLoading, 
    confirmSchedule, 
    isConfirming, 
    claimSchedule, 
    isClaiming 
  } = useVolunteerSchedules(undefined, currentMonth);

  // Verifica se não há registros de voluntário e os dados carregaram
  if (!mySchedulesLoading && (!volunteerData || volunteerData.length === 0)) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-destructive mb-4" />
            <h2 className="font-bold text-lg">Acesso Restrito</h2>
            <p className="text-sm text-center text-muted-foreground mt-2 max-w-sm">
              Esta página é exclusiva para voluntários ativos de algum ministério.
              Converse com a liderança para registrar você em um departamento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mySchedulesLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Tabs defaultValue="minhas">
          <TabsList className="mb-4">
            <TabsTrigger value="minhas">Minhas</TabsTrigger>
            <TabsTrigger value="abertas">Vagas</TabsTrigger>
          </TabsList>
        </Tabs>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  // Arrays de manipulação para a aba 'Minhas Escalas'
  const upcoming = (mySchedules || []).filter(
    (s) => new Date(s.schedule_date) >= new Date(new Date().toDateString())
  ).sort((a, b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime());
  
  const past = (mySchedules || []).filter(
    (s) => new Date(s.schedule_date) < new Date(new Date().toDateString())
  ).sort((a, b) => new Date(b.schedule_date).getTime() - new Date(a.schedule_date).getTime());

  // Agrupando "Vagas Abertas" por data futura apenas
  const futureOpenSchedules = (openSchedules || []).filter(
    (s) => new Date(s.schedule_date) >= new Date(new Date().toDateString())
  ).sort((a, b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Gerenciador de Escalas</h1>
        <p className="text-sm text-muted-foreground">Administre suas convocações e candidaturas</p>
      </div>

      <Tabs defaultValue="minhas" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-96">
          <TabsTrigger value="minhas">Minhas Escalas</TabsTrigger>
          <TabsTrigger value="abertas" className="relative">
            Vagas Abertas
            {futureOpenSchedules.length > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center font-bold text-[10px] animate-pulse">
                {futureOpenSchedules.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── ABA 1: MINHAS ESCALAS ─── */}
        <TabsContent value="minhas" className="space-y-4 mt-6">
          {upcoming.length === 0 && past.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="font-medium">Nenhuma escala programada</p>
                <p className="text-sm text-muted-foreground text-center mt-1 max-w-sm">
                  Suas convocações aparecerão aqui. Fique de olho na aba de Vagas Abertas se quiser se voluntariar!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Próximas ({upcoming.length})
                  </h2>
                  {upcoming.map((schedule: any, index: number) => (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={selectedSchedule?.id === schedule.id ? "ring-2 ring-primary bg-primary/5" : "hover-lift"}
                        onClick={() => setSelectedSchedule(schedule)}
                      >
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">
                                {format(new Date(schedule.schedule_date), "EEEE, dd 'de' MMMM", {
                                  locale: ptBR,
                                })}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-foreground/70">
                                <Clock className="h-4 w-4 text-primary" />
                                {schedule.shift_start} às {schedule.shift_end}
                              </div>
                              {schedule.ministry_name && (
                                <Badge variant="outline" className="text-xs mt-1 bg-surface font-semibold">
                                  {schedule.ministry_name}
                                </Badge>
                              )}
                              {schedule.notes && (
                                <p className="text-xs text-muted-foreground/80 mt-1 italic">"{schedule.notes}"</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {schedule.confirmed ? (
                                <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                                  <Check className="h-3 w-3" />
                                  Confirmado
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  className="shadow-md shadow-primary/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmSchedule(schedule.id);
                                  }}
                                  disabled={isConfirming}
                                >
                                  {isConfirming ? "..." : "Confirmar"}
                                </Button>
                              )}
                              <Badge variant={schedule.schedule_type === "backup" ? "secondary" : "outline"} className="text-[10px] uppercase font-bold tracking-wider">
                                {schedule.schedule_type === "backup" ? "Reserva" : "Titular"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {past.length > 0 && (
                <div className="space-y-3 mt-8">
                  <h2 className="font-semibold text-muted-foreground">Histórico</h2>
                  {past.slice(0, 5).map((schedule: any) => (
                    <Card key={schedule.id} className="opacity-60 bg-surface/50 border-none">
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {format(new Date(schedule.schedule_date), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {schedule.shift_start} - {schedule.shift_end}
                              {schedule.ministry_name && ` • ${schedule.ministry_name}`}
                            </p>
                          </div>
                          {schedule.confirmed && (
                            <Badge variant="outline" className="text-xs gap-1 opacity-70">
                              <Check className="h-3 w-3" /> Presente
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Trocas & Gerenciamento (Aparece ao selecionar escala fututura confirmada) */}
          {selectedSchedule && new Date(selectedSchedule.schedule_date) >= new Date() && volunteerData?.[0] && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <ScheduleSwapManager
                volunteerId={
                  volunteerData.find((v) => v.ministry_id === selectedSchedule.ministry_id)?.id || volunteerData[0].id
                }
                schedule={selectedSchedule}
              />
            </motion.div>
          )}

          {/* Gestão de Indisponibilidades */}
          {volunteerData && volunteerData.length > 0 && (
            <div className="mt-8">
               <VolunteerAvailabilityManager
                volunteerId={volunteerData[0].id}
                volunteerName="Minha Disponibilidade"
                compact
              />
            </div>
          )}
        </TabsContent>

        {/* ─── ABA 2: VAGAS ABERTAS (MURAL) ─── */}
        <TabsContent value="abertas" className="space-y-4 mt-6">
           <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-4 mb-4">
             <BellRing className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
             <div>
               <h3 className="text-sm font-semibold text-primary">Mural do Voluntário</h3>
               <p className="text-xs text-foreground/70 mt-1">
                 O líder do seu ministério liberou as vagas abaixo para escala. Seja voluntário assumindo um turno antes que o tempo expire!
               </p>
             </div>
           </div>

           {futureOpenSchedules.length === 0 ? (
             <Card>
               <CardContent className="flex flex-col items-center justify-center py-12">
                 <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
                 <p className="font-medium text-foreground/80">Sem vagas abertas</p>
                 <p className="text-sm text-center text-muted-foreground mt-1">
                   Mande mensagem para a sua liderança caso deseje ser escalado.
                 </p>
               </CardContent>
             </Card>
           ) : (
              <div className="space-y-3">
                {futureOpenSchedules.map((schedule: any, index: number) => {
                  
                  // Calcula vencimento
                  let isEndingSoon = false;
                  if (schedule.accept_until) {
                    const hoursLeft = (new Date(schedule.accept_until).getTime() - new Date().getTime()) / 36e5;
                    isEndingSoon = hoursLeft > 0 && hoursLeft < 24; 
                  }

                  return (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="aurora-card">
                        <CardContent className="py-4">
                          <div className="flex flex-col lg:flex-row justify-between gap-4">
                            <div className="space-y-2">
                              {schedule.accept_until && (
                                <Badge variant={isEndingSoon ? "destructive" : "secondary"} className="text-[10px] mb-1">
                                  {isEndingSoon ? "Expira Hoje!" : `Até ${format(new Date(schedule.accept_until), "dd/MM HH:mm")}`}
                                </Badge>
                              )}
                              <p className="font-bold text-lg text-foreground">
                                {format(new Date(schedule.schedule_date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                              </p>
                              <div className="flex gap-4 items-center">
                                <div className="flex items-center gap-1.5 text-sm text-foreground/80 font-medium">
                                  <Clock className="w-4 h-4 text-primary" />
                                  {schedule.shift_start} - {schedule.shift_end}
                                </div>
                                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">{schedule.ministry_name}</Badge>
                              </div>
                              {schedule.notes && (
                                <p className="text-xs text-muted-foreground pt-1">Info: {schedule.notes}</p>
                              )}
                            </div>
                            
                            <div className="flex flex-col justify-end lg:justify-center w-full lg:w-auto mt-2 lg:mt-0">
                               <Button 
                                className="w-full lg:w-auto font-bold shadow-lg shadow-primary/20"
                                onClick={() => claimSchedule(schedule.id)}
                                disabled={isClaiming}
                               >
                                 {isClaiming ? "..." : "Me Voluntariar!"}
                               </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
           )}
        </TabsContent>
      </Tabs>
      
    </motion.div>
  );
}
