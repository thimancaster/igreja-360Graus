import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Bell, Baby, ChevronRight, Clock, MapPin, CalendarDays, User, Sparkles, Heart, Radio, CalendarClock, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { UrgentNotificationBanner } from "@/components/portal/UrgentNotificationBanner";
import { useVolunteerStatus } from "@/hooks/useVolunteerStatus";
import { useMyUnifiedSchedules } from "@/hooks/useMyUnifiedSchedules";
import { useVolunteerAnnouncements } from "@/hooks/useVolunteerAnnouncements";
import { useParentChildren, useParentPresentChildren } from "@/hooks/useParentData";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

import heroImg from "@/assets/portal/welcome-hero.jpg";
import escalasImg from "@/assets/portal/card-escalas.jpg";
import comunicadosImg from "@/assets/portal/card-comunicados.jpg";
import filhosImg from "@/assets/portal/card-filhos.jpg";
import eventosImg from "@/assets/portal/card-eventos.jpg";

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

function ImageCard({
  to,
  image,
  label,
  badge,
  badgeVariant = "secondary",
  overlay = "from-black/90 via-black/50 to-black/10",
  className = "",
}: {
  to: string;
  image: string;
  label: string;
  badge?: string | number;
  badgeVariant?: "secondary" | "destructive";
  overlay?: string;
  className?: string;
}) {
  return (
    <motion.div variants={stagger.item}>
      <Link to={to} className="block">
        <div
          className={`relative overflow-hidden rounded-[24px] aspect-[4/3] group cursor-pointer shadow-lg border border-white/10 hover:shadow-xl hover:border-white/20 transition-all duration-300 active:scale-[0.97] ${className}`}
        >
          <img
            src={image}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${overlay} backdrop-blur-[2px]`} />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-extrabold tracking-tight text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] uppercase">
              {label}
            </h3>
          </div>
          {badge !== undefined && (
            <Badge
              variant={badgeVariant}
              className="absolute top-3 right-3 shadow-xl backdrop-blur-md text-xs font-bold px-2 py-0.5 rounded-full"
            >
              {badge}
            </Badge>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function PortalDashboard() {
  const { profile } = useAuth();
  const { isParent } = useRole();
  const { isVolunteer, activeMinistries, isLoading: statusLoading } = useVolunteerStatus();
  const { upcomingSchedules, stats: scheduleStats, isLoading: schedulesLoading } = useMyUnifiedSchedules(new Date());
  const { unreadCount: volunteerUnread } = useVolunteerAnnouncements();
  const { data: children, isLoading: childrenLoading } = useParentChildren();
  const { data: presentChildren } = useParentPresentChildren();

  const getTimePresent = (checkedInAt: string) => {
    const minutes = differenceInMinutes(new Date(), new Date(checkedInAt));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const displaySchedules = upcomingSchedules.slice(0, 3);

  if (statusLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "Membro";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 space-y-6 p-4 max-w-2xl mx-auto w-full pb-24"
    >
      <UrgentNotificationBanner />

      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
      >
        <div className="relative overflow-hidden rounded-[32px] shadow-2xl border border-white/10">
          <img
            src={heroImg}
            alt="Welcome"
            className="w-full h-44 sm:h-52 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent backdrop-blur-[2px]" />
          <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300 text-[10px] font-bold uppercase tracking-widest">
                Bem-vindo
              </span>
            </div>
            <h1 className="text-white text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
              Olá, {firstName}!
            </h1>
            <p className="text-white/80 text-sm mt-1.5 font-medium">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="absolute top-5 right-5">
            <Link to="/portal/perfil">
              <Avatar className="h-14 w-14 border-[3px] border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-transform hover:scale-105 active:scale-95">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-white/20 text-white font-extrabold backdrop-blur-md">
                  {firstName[0]}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Present Children Alert */}
      {presentChildren && presentChildren.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border border-primary/20 bg-primary/5 rounded-[28px] overflow-hidden backdrop-blur-xl shadow-lg">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shadow-inner">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <span className="font-extrabold tracking-tight text-sm">Filhos Presentes Agora</span>
              </div>
              {presentChildren.map((checkIn: any) => (
                <div key={checkIn.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md p-3.5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3.5">
                    <Avatar className="h-11 w-11 border-2 border-primary/20 shadow-sm">
                      <AvatarImage src={checkIn.children?.photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {checkIn.children?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold tracking-tight text-sm">{checkIn.children?.full_name}</p>
                      <p className="text-[11px] text-muted-foreground font-medium">{checkIn.children?.classroom}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary text-xs rounded-full font-bold shadow-sm">
                    <Clock className="h-3 w-3" />
                    {getTimePresent(checkIn.checked_in_at)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Image Cards Grid */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3.5 sm:gap-4"
      >
        <ImageCard
          to="/portal/escalas"
          image={escalasImg}
          label="Escalas"
          badge={scheduleStats.upcoming > 0 ? `${scheduleStats.upcoming} próx.` : undefined}
        />
        <ImageCard
          to="/portal/comunicados"
          image={comunicadosImg}
          label="Comunicados"
          badge={volunteerUnread > 0 ? volunteerUnread : undefined}
          badgeVariant="destructive"
        />
        <ImageCard
          to="/portal/eventos"
          image={eventosImg}
          label="Eventos"
        />
        <ImageCard
          to="/portal/filhos"
          image={filhosImg}
          label="Meus Filhos"
          badge={children && children.length > 0 ? `${children.length}` : undefined}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-3 gap-3"
      >
        <Link to="/portal/contribuicoes" className="block">
          <Card className="rounded-[24px] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(var(--primary),0.1)] transition-all active:scale-[0.97] bg-white/40 dark:bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col items-center gap-2.5 text-center">
              <div className="h-10 w-10 rounded-2xl bg-primary/15 flex items-center justify-center shadow-inner">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-bold tracking-tight">Contribuir</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/portal/culto-ao-vivo" className="block">
          <Card className="rounded-[24px] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(var(--destructive),0.1)] transition-all active:scale-[0.97] bg-white/40 dark:bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col items-center gap-2.5 text-center">
              <div className="h-10 w-10 rounded-2xl bg-destructive/15 flex items-center justify-center shadow-inner">
                <Radio className="h-5 w-5 text-destructive animate-pulse" />
              </div>
              <span className="text-[11px] font-bold tracking-tight">Ao Vivo</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/portal/agendar" className="block">
          <Card className="rounded-[24px] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(var(--accent),0.1)] transition-all active:scale-[0.97] bg-white/40 dark:bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col items-center gap-2.5 text-center">
              <div className="h-10 w-10 rounded-2xl bg-accent/15 flex items-center justify-center shadow-inner">
                <CalendarClock className="h-5 w-5 text-accent" />
              </div>
              <span className="text-[11px] font-bold tracking-tight">Agendar</span>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Upcoming Schedules */}
      {displaySchedules.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-extrabold text-lg tracking-tight">Próximas Escalas</h2>
              <Link to="/portal/escalas">
                <span className="text-xs text-primary flex items-center gap-0.5 font-bold hover:underline">
                  Ver todas <ChevronRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
            <div className="space-y-3">
              {displaySchedules.map((schedule) => (
                <Card key={schedule.id} className="rounded-3xl overflow-hidden shadow-sm border border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-xl hover:-translate-y-0.5 transition-transform duration-300">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-[20px] flex flex-col items-center justify-center shrink-0 border shadow-inner
                        ${schedule.origin === 'infantil' ? 'bg-purple-100 border-purple-200' : 'bg-primary/10 border-primary/10'}
                      `}>
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest
                          ${schedule.origin === 'infantil' ? 'text-purple-600' : 'text-primary'}
                        `}>
                          {format(new Date(schedule.date), "MMM", { locale: ptBR })}
                        </span>
                        <span className={`text-xl font-black leading-none -mt-0.5
                          ${schedule.origin === 'infantil' ? 'text-purple-600' : 'text-primary'}
                        `}>
                          {format(new Date(schedule.date), "dd")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-extrabold text-[15px] tracking-tight truncate capitalize-first">
                          {format(new Date(schedule.date), "EEEE", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-black/5 dark:bg-white/5 w-fit px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-primary/70" />
                          {schedule.start} - {schedule.end}
                        </div>
                        <Badge variant="secondary" className="text-[10px] bg-gradient-to-r from-primary/5 to-transparent">
                          {schedule.ministry}
                        </Badge>
                      </div>
                      {schedule.confirmed ? (
                        <Badge className="text-xs shrink-0 bg-green-500/20 text-green-700 dark:text-green-400 border-0 rounded-full h-8 px-3 font-bold shadow-sm">
                          <Check className="h-3 w-3 mr-1" strokeWidth={3} />
                          OK
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] shrink-0 rounded-full h-6 px-2 font-bold opacity-70">
                          Pendente
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Ministries */}
      {activeMinistries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="space-y-4">
            <h2 className="font-extrabold text-lg tracking-tight px-1">Meus Ministérios</h2>
            <div className="flex flex-wrap gap-2.5">
              {activeMinistries.map((m) => (
                <Badge
                  key={m.id}
                  className="text-sm py-2 px-4 rounded-full bg-gradient-to-tr from-primary/15 to-primary/5 text-foreground border border-primary/20 font-bold shadow-sm backdrop-blur-md"
                >
                  {m.ministry_name}
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
