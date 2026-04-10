import { motion } from "framer-motion";
import { useVolunteerSchedules } from "@/hooks/useVolunteerSchedules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Check, ShieldCheck, AlertCircle } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ParentSchedules() {
  const { 
    mySchedules, 
    isLoading, 
    confirmSchedule, 
    isConfirming 
  } = useVolunteerSchedules();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
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
        <div className="relative">
          <div className="absolute -inset-2 bg-orange-400/20 blur-lg rounded-full" />
          <img src="/kids/icon_calendar.png" alt="Schedules" className="w-14 h-14 object-contain relative drop-shadow-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-none bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Minhas Escalas 🎒</h1>
          <p className="text-sm font-medium text-gray-700 mt-1">
            Seus compromissos no Ministério
          </p>
        </div>
      </div>

      {mySchedules && mySchedules.length > 0 ? (
        <div className="space-y-4">
          {mySchedules.map((schedule, index) => {
            const date = parseISO(schedule.schedule_date);
            const isScheduleToday = isToday(date);

            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`glass-card-kids p-5 bg-white/80 border-2 transition-all shadow-xl relative overflow-hidden ${isScheduleToday ? 'border-orange-400 shadow-orange-200/50 scale-[1.02]' : 'border-white/50'}`}>
                  {isScheduleToday && (
                    <div className="absolute top-0 right-0 px-4 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-tighter rounded-bl-2xl shadow-md">
                      Hoje ✨
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                          {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </p>
                        <h3 className="text-2xl font-black text-[#1a1a1a] leading-tight">
                          {schedule.ministry_name}
                        </h3>
                        {schedule.classroom && (
                          <div className="flex items-center gap-1.5 mt-1 text-blue-600 font-extrabold text-sm">
                            <ShieldCheck className="w-4 h-4" />
                            Sala: {schedule.classroom}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={schedule.schedule_type === 'primary' ? 'default' : 'secondary'} className="rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
                          {schedule.schedule_type === 'primary' ? 'Titular' : 'Reserva'}
                        </Badge>
                        {schedule.is_kids_ministry && (
                          <Badge className="bg-gradient-to-r from-orange-400 to-amber-500 border-0 text-white font-black text-[10px] uppercase">
                            Kids Portal
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 py-3 border-y border-black/5">
                      <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
                        <div className="w-8 h-8 rounded-2xl bg-orange-100 flex items-center justify-center shadow-inner">
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        {schedule.shift_start.slice(0, 5)} - {schedule.shift_end.slice(0, 5)}
                      </div>
                      
                      {schedule.notes && (
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium italic italic-kids">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {schedule.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      {schedule.confirmed ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black text-sm shadow-inner">
                          <Check className="w-5 h-5" />
                          Confirmado
                        </div>
                      ) : (
                        <Button
                          className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-lg hover:shadow-blue-500/30 transition-all border-0 h-12"
                          onClick={() => confirmSchedule(schedule.id)}
                          disabled={isConfirming}
                        >
                          <Check className="w-5 h-5 mr-2" />
                          {isConfirming ? 'Confirmando...' : 'Confirmar Presença'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card-kids px-6 py-16 flex flex-col items-center justify-center text-center bg-white/60 border-white/50">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-400/10 blur-2xl rounded-full scale-150" />
            <Calendar className="h-20 w-20 text-blue-300 relative drop-shadow-sm" />
          </div>
          <h3 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Sem escalas hoje 🌤️</h3>
          <p className="text-gray-600 font-bold mt-2 max-w-xs">
            Você não possui escalas agendadas para os próximos dias no Ministério.
          </p>
        </div>
      )}
    </motion.div>
  );
}
