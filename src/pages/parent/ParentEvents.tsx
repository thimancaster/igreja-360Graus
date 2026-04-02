import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CalendarCheck,
  CalendarX,
  Loader2,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useMinistryEvents, MinistryEvent } from "@/hooks/useMinistryEvents";
import { useParentChildren } from "@/hooks/useParentData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const EVENT_TYPE_CONFIG: Record<string, { gradient: string; icon: string; label: string }> = {
  service:  { gradient: "from-blue-400 to-indigo-500",    icon: "⛪", label: "Culto" },
  special:  { gradient: "from-purple-400 to-violet-500",  icon: "✨", label: "Especial" },
  activity: { gradient: "from-emerald-400 to-green-500",  icon: "🎮", label: "Atividade" },
  meeting:  { gradient: "from-amber-400 to-orange-500",   icon: "📋", label: "Reunião" },
};

export default function ParentEvents() {
  const { events, isLoading, registerChild, isRegistering } = useMinistryEvents();
  const { data: children = [] } = useParentChildren();
  const { user } = useAuth();

  const { data: guardianData } = useQuery({
    queryKey: ["parent-guardian", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("guardians")
        .select("id")
        .eq("profile_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const guardianId = guardianData?.id;
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [dismissedEvents, setDismissedEvents] = useState<string[]>(() => {
    const saved = localStorage.getItem("kids_dismissed_events");
    return saved ? JSON.parse(saved) : [];
  });
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MinistryEvent | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  const handleDismissEvent = (id: string) => {
    const newDismissed = [...dismissedEvents, id];
    setDismissedEvents(newDismissed);
    localStorage.setItem("kids_dismissed_events", JSON.stringify(newDismissed));
  };

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming: MinistryEvent[] = [];
    const past: MinistryEvent[] = [];
    
    // Filter out dismissed events
    const visibleEvents = events.filter(e => !dismissedEvents.includes(e.id));
    
    visibleEvents.forEach((event) => {
      const eventDate = startOfDay(parseISO(event.start_datetime));
      isBefore(eventDate, today) ? past.push(event) : upcoming.push(event);
    });
    return {
      upcomingEvents: upcoming.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()),
      pastEvents:     past.sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime()),
    };
  }, [events]);

  const handleRegister = (event: MinistryEvent) => {
    setSelectedEvent(event);
    setSelectedChildId("");
    setRegistrationDialogOpen(true);
  };

  const confirmRegistration = () => {
    if (!selectedEvent || !selectedChildId || !guardianId) return;
    registerChild({ eventId: selectedEvent.id, childId: selectedChildId, guardianId });
    setRegistrationDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-52 rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-2xl" />
          <Skeleton className="h-10 flex-1 rounded-2xl" />
        </div>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)}
      </div>
    );
  }

  const EventCard = ({ event, showRegister = false, index = 0 }: { event: MinistryEvent; showRegister?: boolean; index?: number }) => {
    const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.activity;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, type: "spring", stiffness: 300, damping: 25 }}
        whileHover={{ y: -3, scale: 1.01 }}
      >
        <Card className="glass-card-kids border-0 overflow-hidden bg-white/70 hover:scale-[1.02] transition-transform group">
          {/* Gradient top stripe */}
          <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              {/* Event type icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-md shrink-0 group-hover:scale-110 transition-transform`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-[#1a1a1a] text-lg leading-tight truncate">{event.title}</h3>
                    <Badge className={`mt-1 shrink-0 text-[10px] rounded-full bg-gradient-to-r ${config.gradient} text-white border-0 shadow-sm uppercase`}>
                      {config.label}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleDismissEvent(event.id); }}
                    className="rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0 h-8 w-8 p-0"
                    title="Ocultar evento"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(parseISO(event.start_datetime), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  {!event.all_day && (
                    <span className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(parseISO(event.start_datetime), "HH:mm")}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[100px]">{event.location}</span>
                    </span>
                  )}
                  {event.max_capacity && (
                    <span className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                      <Users className="h-3.5 w-3.5" />
                      {event.max_capacity} vagas
                    </span>
                  )}
                </div>
                {showRegister && event.registration_required && (
                  <Button
                    onClick={() => handleRegister(event)}
                    className={cn("mt-4 w-full rounded-2xl text-white font-bold shadow-md bg-gradient-to-r", config.gradient)}
                    variant="default"
                  >
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Inscrever Criança
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const tabs: { value: "upcoming" | "past"; label: string; count: number; icon: typeof Calendar }[] = [
    { value: "upcoming", label: "Próximos", count: upcomingEvents.length, icon: Calendar },
    { value: "past",     label: "Anteriores", count: pastEvents.length,    icon: CalendarX },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-4 px-4 pb-28 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-2">
        <img src="/kids/kids_event.png" alt="Event" className="w-12 h-12 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] rounded-xl" />
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-none bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">Eventos 🎉</h1>
          <p className="text-sm font-medium text-gray-700 mt-0.5">Atividades do ministério</p>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm">
        {tabs.map(({ value, label, count, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300",
              activeTab === value
                ? "bg-white text-[#1a1a1a] shadow-md border-b-2 border-emerald-400"
                : "text-gray-600 hover:bg-white/60"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-black drop-shadow-sm",
              activeTab === value ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "upcoming" && (
          <motion.div
            key="upcoming"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {upcomingEvents.length === 0 ? (
              <div className="glass-card-kids px-6 py-12 flex flex-col items-center justify-center text-center bg-white/60">
                <div className="w-16 h-16 rounded-full bg-emerald-100 shadow-inner flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="font-extrabold text-[#1a1a1a] text-lg">Nenhum evento programado</p>
                <p className="text-sm text-gray-600 font-medium mt-1">Fique atento — novos eventos aparecerão aqui!</p>
              </div>
            ) : (
              upcomingEvents.map((event, index) => <EventCard key={event.id} event={event} showRegister index={index} />)
            )}
          </motion.div>
        )}
        {activeTab === "past" && (
          <motion.div
            key="past"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {pastEvents.length === 0 ? (
              <div className="glass-card-kids px-6 py-12 flex flex-col items-center justify-center text-center bg-white/60">
                <div className="w-16 h-16 rounded-full bg-slate-100 shadow-inner flex items-center justify-center mb-4">
                  <CalendarX className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-extrabold text-[#1a1a1a] text-lg">Nenhum evento anterior</p>
              </div>
            ) : (
              pastEvents.slice(0, 10).map((event, index) => (
                <div key={event.id} className="opacity-60">
                  <EventCard event={event} index={index} />
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration Dialog */}
      <Dialog open={registrationDialogOpen} onOpenChange={setRegistrationDialogOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-3xl border-0 glass-ultra">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">🎟️ Inscrever Criança</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Selecione a criança para participar de <strong>"{selectedEvent?.title}"</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="rounded-2xl h-12 border-border/50">
                <SelectValue placeholder="Escolha uma criança 👧👦" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id} className="rounded-xl">
                    {child.full_name} — {child.classroom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setRegistrationDialogOpen(false)} className="w-full sm:w-auto rounded-2xl">
              Cancelar
            </Button>
            <Button
              onClick={confirmRegistration}
              disabled={!selectedChildId || isRegistering}
              className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-bold"
            >
              {isRegistering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
              Confirmar Inscrição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
