import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Check, Clock, BellRing, ClipboardList, AlertTriangle, MessageCircle, Loader2, Baby, Users } from "lucide-react";
import { useMyUnifiedSchedules, UnifiedSchedule } from "@/hooks/useMyUnifiedSchedules";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PortalSchedules() {
  const [currentMonth] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<UnifiedSchedule | null>(null);
  const [activeTab, setActiveTab] = useState("minhas");

  const {
    schedules,
    schedulesByDate,
    stats,
    isLoading,
    confirmSchedule,
    cancelConfirmation,
    isConfirming,
  } = useMyUnifiedSchedules(currentMonth);

  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmedSchedule, setConfirmedSchedule] = useState<UnifiedSchedule | null>(null);

  const isTodayOrFuture = (dateStr: string) => {
    const d = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() >= today.getTime();
  };

  const upcoming = schedules.filter(s => isTodayOrFuture(s.date));
  const past = schedules.filter(s => !isTodayOrFuture(s.date)).slice(0, 5);

  const handleConfirm = async (schedule: UnifiedSchedule) => {
    await confirmSchedule(schedule);
    setConfirmedSchedule(schedule);
    setShowSuccess(true);
  };

  const handleCancelConfirm = async (schedule: UnifiedSchedule) => {
    await cancelConfirmation(schedule);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48 rounded-full" />
        <Tabs defaultValue="minhas">
          <TabsList className="mb-4 rounded-full h-12 p-1">
            <TabsTrigger value="minhas" className="rounded-full">Minhas</TabsTrigger>
            <TabsTrigger value="abertas" className="rounded-full">Vagas</TabsTrigger>
          </TabsList>
        </Tabs>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 space-y-6 p-4 max-w-2xl mx-auto w-full"
    >
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Escalas</h1>
        <p className="text-sm text-muted-foreground">Suas convocações e vagas abertas</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="rounded-full bg-primary/5">
          <Users className="w-3 h-3 mr-1" />
          {stats.total} escalas
        </Badge>
        <Badge variant="outline" className="rounded-full bg-green-500/5">
          <Check className="w-3 h-3 mr-1" />
          {stats.confirmed} confirmadas
        </Badge>
        {stats.infantil > 0 && (
          <Badge variant="outline" className="rounded-full bg-purple-500/5">
            <Baby className="w-3 h-3 mr-1" />
            {stats.infantil} Kids
          </Badge>
        )}
      </div>

      <Tabs defaultValue="minhas" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 rounded-full h-12 p-1 bg-white/5 backdrop-blur-md border border-white/10 shadow-inner px-1">
          <TabsTrigger value="minhas" className="rounded-full data-[state=active]:shadow-md text-sm">
            Minhas Escalas ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-full data-[state=active]:shadow-md text-sm">
            Histórico ({past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="minhas" className="space-y-6 mt-6 focus-visible:outline-none focus-visible:ring-0">
          {upcoming.length === 0 ? (
            <Card className="glass-card rounded-3xl border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="font-bold tracking-tight text-lg">Nenhuma escala programada</p>
                <p className="text-sm text-muted-foreground text-center mt-1 max-w-xs leading-relaxed">
                  Suas convocações aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {Object.entries(schedulesByDate).map(([date, daySchedules]) => {
                if (!isTodayOrFuture(date)) return null;
                
                const daySchedulesSorted = daySchedules.sort((a, b) => a.start.localeCompare(b.start));
                
                return (
                  <div key={date} className="space-y-3">
                    <h3 className="font-extrabold text-sm flex items-center gap-2 px-1 sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10">
                      <span className="text-primary">
                        {format(parseISO(date), "EEEE", { locale: ptBR })}
                      </span>
                      <span className="text-muted-foreground font-normal">
                        {format(parseISO(date), "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                    </h3>
                    
                    <AnimatePresence mode="popLayout">
                      {daySchedulesSorted.map((schedule, index) => (
                        <ScheduleCard
                          key={schedule.id}
                          schedule={schedule}
                          index={index}
                          isSelected={selectedSchedule?.id === schedule.id}
                          onSelect={() => setSelectedSchedule(selectedSchedule?.id === schedule.id ? null : schedule)}
                          onConfirm={() => handleConfirm(schedule)}
                          onCancelConfirm={() => handleCancelConfirm(schedule)}
                          isConfirming={isConfirming}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                );
              })}
            </>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4 mt-6 focus-visible:outline-none">
          {past.length === 0 ? (
            <Card className="glass-card rounded-3xl border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="font-bold tracking-tight text-lg">Sem escalas anteriores</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(
              past.reduce((acc, schedule) => {
                if (!acc[schedule.date]) acc[schedule.date] = [];
                acc[schedule.date].push(schedule);
                return acc;
              }, {} as Record<string, UnifiedSchedule[]>)
            ).map(([date, daySchedules]) => (
              <div key={date} className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium px-1">
                  {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                {daySchedules.map((schedule) => (
                  <Card key={schedule.id} className="opacity-70 bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/5 rounded-2xl">
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${schedule.origin === 'infantil' ? 'bg-purple-100' : 'bg-primary/10'}`}>
                          {schedule.origin === 'infantil' ? (
                            <Baby className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Users className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {schedule.start} - {schedule.end}
                          </p>
                          <p className="text-xs text-muted-foreground">{schedule.ministry}</p>
                        </div>
                      </div>
                      {schedule.confirmed && (
                        <Badge variant="outline" className="text-[10px] gap-1 rounded-full border-green-500/30 text-green-600">
                          <Check className="h-3 w-3" /> Presente
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {selectedSchedule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 right-4 max-w-2xl mx-auto z-50"
          >
            <Card className="rounded-3xl border-white/20 bg-background/95 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{selectedSchedule.ministry}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedSchedule.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant={selectedSchedule.origin === 'infantil' ? 'secondary' : 'outline'} className="rounded-full">
                    {selectedSchedule.origin === 'infantil' ? (
                      <><Baby className="w-3 h-3 mr-1" /> Kids</>
                    ) : (
                      <><Users className="w-3 h-3 mr-1" /> Geral</>
                    )}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 text-center p-3 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="font-bold text-lg">{selectedSchedule.start}</p>
                  </div>
                  <div className="flex-1 text-center p-3 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">Fim</p>
                    <p className="font-bold text-lg">{selectedSchedule.end}</p>
                  </div>
                </div>

                {selectedSchedule.classroom && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900">
                    <Baby className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Sala: {selectedSchedule.classroom}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => setSelectedSchedule(null)}
                  >
                    Fechar
                  </Button>
                  {selectedSchedule.confirmed ? (
                    <Button
                      variant="destructive"
                      className="flex-1 rounded-full"
                      onClick={() => {
                        handleCancelConfirm(selectedSchedule);
                        setSelectedSchedule(null);
                      }}
                      disabled={isConfirming}
                    >
                      {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancelar Confirmação"}
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 rounded-full shadow-lg shadow-primary/25"
                      onClick={() => {
                        handleConfirm(selectedSchedule);
                        setSelectedSchedule(null);
                      }}
                      disabled={isConfirming}
                    >
                      {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <><Check className="w-4 h-4 mr-2" /> Confirmar</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      <AnimatePresence>
        {showSuccess && confirmedSchedule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-2xl border border-white/20 w-full max-w-sm flex flex-col items-center text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30"
              >
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </motion.div>

              <h2 className="text-2xl font-black tracking-tight mb-2">Presença Confirmada!</h2>
              <p className="text-muted-foreground font-medium mb-6">
                Obrigado por servir! Sua escala para <span className="text-foreground font-bold">{confirmedSchedule.ministry}</span> foi confirmada.
              </p>

              <div className="bg-muted/50 p-4 rounded-3xl w-full border border-black/5 space-y-1 mb-6">
                <p className="font-extrabold text-sm">{format(parseISO(confirmedSchedule.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  {confirmedSchedule.start} às {confirmedSchedule.end}
                </p>
              </div>

              <Button 
                className="w-full h-12 rounded-2xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                onClick={() => setShowSuccess(false)}
              >
                Excelente!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScheduleCard({
  schedule,
  index,
  isSelected,
  onSelect,
  onConfirm,
  onCancelConfirm,
  isConfirming,
}: {
  schedule: UnifiedSchedule;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  isConfirming: boolean;
}) {
  const isInfantil = schedule.origin === 'infantil';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card
        className={`relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer backdrop-blur-xl shadow-sm hover:shadow-lg
          ${isSelected ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20" : "bg-white/40 dark:bg-black/40 border-white/20 dark:border-white/10 hover:-translate-y-0.5" }
          ${isInfantil ? "border-l-4 border-l-purple-400" : ""}
        `}
        onClick={onSelect}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isInfantil ? "bg-purple-100" : "bg-primary/10"}`}>
                  {isInfantil ? (
                    <Baby className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Users className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="font-extrabold tracking-tight text-lg">
                  {schedule.start} às {schedule.end}
                </p>
                <Badge 
                  variant={schedule.type === "backup" ? "secondary" : "outline"} 
                  className="text-[10px] uppercase font-bold tracking-wider rounded-full border-white/20 bg-background/50 backdrop-blur-md px-2 py-0 h-5"
                >
                  {schedule.type === "backup" ? "Reserva" : schedule.type === "staff" ? "Staff" : "Titular"}
                </Badge>
              </div>
              
              <Badge variant="secondary" className="text-xs font-bold bg-gradient-to-r from-primary/10 to-transparent border-0">
                {schedule.ministry}
              </Badge>

              {schedule.classroom && (
                <p className="text-xs text-purple-600 font-medium">
                  <Baby className="w-3 h-3 inline mr-1" />
                  {schedule.classroom}
                </p>
              )}

              {schedule.notes && (
                <p className="text-xs text-muted-foreground italic">Info: {schedule.notes}</p>
              )}
            </div>
            
            <div className="flex flex-col items-end justify-center shrink-0 min-h-[80px]">
              <AnimatePresence mode="wait">
                {schedule.confirmed ? (
                  <motion.div
                    key="confirmed"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Badge variant="secondary" className="gap-1.5 bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 rounded-full px-3 py-1 shadow-sm backdrop-blur-md">
                      <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="font-bold tracking-tight">OK</span>
                    </Badge>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unconfirmed"
                    initial={{ opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <Button
                      size="sm"
                      className="rounded-full shadow-lg shadow-primary/25 font-bold px-5 h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirm();
                      }}
                      disabled={isConfirming}
                    >
                      {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
