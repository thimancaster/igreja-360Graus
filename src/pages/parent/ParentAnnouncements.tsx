import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Megaphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Inbox,
  CheckCheck,
} from "lucide-react";
import { useAnnouncements } from "@/hooks/useAnnouncements";

export default function ParentAnnouncements() {
  const { parentAnnouncements, isLoadingParent, markAsRead, unreadCount } =
    useAnnouncements();
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread");

  if (isLoadingParent) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const unreadAnnouncements = parentAnnouncements?.filter((a) => !a.is_read) || [];
  const readAnnouncements = parentAnnouncements?.filter((a) => a.is_read) || [];

  const AnnouncementCard = ({ announcement, index }: { announcement: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        className={cn(
          "glass-card-kids px-5 py-6 bg-white/70 hover:scale-[1.02] transition-transform flex flex-col gap-3",
          !announcement.is_read ? "border-2 border-blue-400 bg-white/80" : "opacity-80"
        )}
        onClick={() => {
          if (!announcement.is_read) {
            markAsRead(announcement.id);
          }
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {announcement.priority === "urgent" && (
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
            )}
            <h3 className="text-xl font-extrabold text-[#1a1a1a] leading-tight truncate">
              {announcement.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!announcement.is_read && (
              <Badge className="bg-blue-500 text-white font-black border-0 shadow-sm text-[10px]">NOVO</Badge>
            )}
            {announcement.priority === "urgent" && (
              <Badge className="bg-rose-500 text-white font-black border-0 shadow-sm text-[10px]">URGENTE</Badge>
            )}
          </div>
        </div>
        
        <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed bg-black/5 p-4 rounded-2xl">
          {announcement.content}
        </p>

        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
          <Clock className="h-3.5 w-3.5" />
          {format(
            new Date(announcement.published_at!),
            "dd 'de' MMMM 'às' HH:mm",
            { locale: ptBR }
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pt-4 px-4 pb-28 min-h-screen"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/kids/kids_logo.png" alt="Comunicados" className="w-12 h-12 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] rounded-xl" />
          <div>
            <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-none bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Comunicados 📢</h1>
            <p className="text-sm font-medium text-gray-700 mt-0.5">
              Avisos do ministério infantil
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black border-0 shadow-sm px-3 py-1 text-xs">
            {unreadCount} NÃO LIDO{unreadCount > 1 ? "S" : ""}
          </Badge>
        )}
      </div>

        {parentAnnouncements && parentAnnouncements.length === 0 ? (
          <div className="glass-card-kids px-6 py-12 flex flex-col items-center justify-center text-center bg-white/60">
            <Megaphone className="h-12 w-12 text-gray-400 mb-4" />
            <p className="font-extrabold text-[#1a1a1a] text-lg">Nenhum comunicado</p>
            <p className="text-gray-600 font-medium text-sm mt-1">
              Você receberá notificações quando houver novos avisos.
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 p-1.5 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm mb-6">
              <button
                onClick={() => setActiveTab("unread")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300",
                  activeTab === "unread"
                    ? "bg-white text-[#1a1a1a] shadow-md border-b-2 border-blue-400"
                    : "text-gray-600 hover:bg-white/60"
                )}
              >
                <Inbox className="h-4 w-4" />
                Não Lidos ({unreadCount})
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300",
                  activeTab === "all"
                    ? "bg-white text-[#1a1a1a] shadow-md border-b-2 border-blue-400"
                    : "text-gray-600 hover:bg-white/60"
                )}
              >
                <CheckCheck className="h-4 w-4" />
                Todos ({parentAnnouncements?.length || 0})
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === "unread" ? (
                unreadAnnouncements.length === 0 ? (
                  <div className="glass-card-kids px-6 py-12 flex flex-col items-center justify-center text-center bg-white/60">
                    <div className="w-16 h-16 rounded-full bg-green-100 shadow-inner flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="font-extrabold text-[#1a1a1a] text-lg">Tudo lido!</p>
                    <p className="text-sm text-gray-600 font-medium mt-1">Você não tem comunicados pendentes</p>
                  </div>
                ) : (
                  unreadAnnouncements.map((announcement, index) => (
                    <AnnouncementCard 
                      key={announcement.id} 
                      announcement={announcement} 
                      index={index} 
                    />
                  ))
                )
              ) : (
                parentAnnouncements?.map((announcement, index) => (
                  <AnnouncementCard 
                    key={announcement.id} 
                    announcement={announcement} 
                    index={index} 
                  />
                ))
              )}
            </div>
          </>
        )}
    </motion.div>
  );
}
