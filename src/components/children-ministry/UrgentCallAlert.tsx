import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bell, MessageSquare, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Announcement } from "@/hooks/useAnnouncements";

interface UrgentCallAlertProps {
  announcement: Announcement | null;
  onRespond: (id: string, status: "on_my_way" | "confirmed") => void;
}

export function UrgentCallAlert({ announcement, onRespond }: UrgentCallAlertProps) {
  if (!announcement) return null;

  const isSent = announcement.response_status === "on_my_way";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-x-4 top-20 z-[100] md:inset-x-auto md:right-8 md:top-8 md:w-[400px]"
      >
        <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-red-500/50 bg-white shadow-2xl shadow-red-500/20 backdrop-blur-xl">
          {/* Alerta Pulsante */}
          <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
          
          <div className="relative p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-red-500 text-white shadow-lg shadow-red-500/40">
                <Bell className="h-7 w-7 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-red-600 tracking-tight leading-tight uppercase">
                  CHAMADO URGENTE!
                </h3>
                <p className="text-sm font-bold text-gray-700 leading-tight">
                  {announcement.content}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                   <div className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                   <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Atenção Necessária</span>
                </div>
              </div>
            </div>

            {!isSent ? (
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => onRespond(announcement.id, "on_my_way")}
                  className="h-14 w-full rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-lg shadow-xl shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <MapPin className="h-6 w-6" />
                  ESTOU A CAMINHO!
                </Button>
                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-tight">
                  O departamento infantil será notificado agora.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 rounded-2xl bg-green-50 border border-green-200">
                <div className="text-center">
                  <p className="text-sm font-black text-green-600 uppercase tracking-tight">RESPOSTA ENVIADA!</p>
                  <p className="text-xs font-bold text-green-700">A equipe kids está te aguardando.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
