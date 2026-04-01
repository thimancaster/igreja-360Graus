import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Baby, Clock, MapPin, Plus, History, Calendar, Megaphone,
  ChevronRight, AlertCircle, Pencil, Heart, AlertTriangle, QrCode, FileText,
  Users, Activity, Ticket, Award
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useParentChildren, useParentPresentChildren } from "@/hooks/useParentData";
import { useParentChildMutations } from "@/hooks/useParentChildMutations";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { PortalChildDialog, PortalChildFormData } from "@/components/portal/PortalChildDialog";
import { useNavigate } from "react-router-dom";
import { format, differenceInMinutes, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Kids color palette
const CLASSROOM_COLORS: Record<string, string> = {
  "Berçário": "from-pink-400 to-rose-400",
  "Maternal": "from-purple-400 to-violet-400",
  "Jardim": "from-sky-400 to-blue-400",
  "Pré-Escolar": "from-amber-400 to-orange-400",
  "Primário": "from-emerald-400 to-green-400",
  "Juniores": "from-teal-400 to-cyan-400",
  "Pré-Adolescentes": "from-indigo-400 to-blue-500",
};

const getClassroomColor = (classroom: string) =>
  CLASSROOM_COLORS[classroom] || "from-pink-400 to-purple-400";

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const { data: children, isLoading: loadingChildren } = useParentChildren();
  const { data: presentChildren, isLoading: loadingPresent } = useParentPresentChildren();
  const { parentAnnouncements, unreadCount } = useAnnouncements();
  const { createChild, updateChild } = useParentChildMutations();
  const navigate = useNavigate();

  const [childDialogOpen, setChildDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const [expandedQrId, setExpandedQrId] = useState<string | null>(null);
  const [showChildrenList, setShowChildrenList] = useState(false); // Controls expanding "Minhas Turmas"

  // Fetch latest classroom report for children
  const { data: latestReport } = useQuery({
    queryKey: ["latest-classroom-report", children?.map(c => c.classroom)],
    queryFn: async () => {
      if (!children || children.length === 0) return null;
      const classrooms = [...new Set(children.map((c: any) => c.classroom))];
      const { data } = await supabase
        .from("classroom_reports")
        .select("*")
        .in("classroom", classrooms)
        .order("event_date", { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
    enabled: !!children && children.length > 0,
  });

  const goToTab = (tab: string) => navigate(`/portal/filhos?tab=${tab}`);

  const getTimePresent = (checkedInAt: string) => {
    const minutes = differenceInMinutes(new Date(), new Date(checkedInAt));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getAge = (birthDate: string) => {
    const years = differenceInYears(new Date(), new Date(birthDate));
    return years === 1 ? "1 ano" : `${years} anos`;
  };

  const handleAddChild = () => { setEditingChild(null); setChildDialogOpen(true); };
  const handleEditChild = (child: any) => { setEditingChild(child); setChildDialogOpen(true); };

  const handleChildSubmit = async (data: PortalChildFormData) => {
    const payload = {
      full_name: data.full_name,
      birth_date: data.birth_date.toISOString().split("T")[0],
      classroom: data.classroom,
      allergies: data.allergies || null,
      medications: data.medications || null,
      special_needs: data.special_needs || null,
      emergency_contact: data.emergency_contact || null,
      emergency_phone: data.emergency_phone || null,
      image_consent: data.image_consent,
      notes: data.notes || null,
    };
    if (editingChild) {
      await updateChild.mutateAsync({ id: editingChild.id, ...payload });
    } else {
      await createChild.mutateAsync(payload);
    }
  };

  if (loadingChildren || loadingPresent) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const recentAnnouncements = parentAnnouncements?.slice(0, 2) || [];
  const firstName = profile?.full_name?.split(" ")[0] || "Papai/Mamãe";
  
  // Decide what to show on "Upcoming Fun" (Próximas Aventuras)
  const upcomingEvent = recentAnnouncements[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-6 sm:space-y-8 p-1 pb-24 sm:pb-4">
      
      {/* 1. HEADER (Mundo Kids & Avatar) */}
      <div className="flex items-center justify-between mt-2">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500 bg-clip-text text-transparent tracking-tight">
            Mundo Kids
          </h1>
          <p className="font-bold text-lg sm:text-2xl text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            Olá, {firstName}! <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ duration: 0.6, repeat: 2, repeatDelay: 2 }} className="inline-block text-2xl">👋</motion.span>
          </p>
          <p className="text-sm font-medium text-muted-foreground/80">Bem-vindo(a) à central da família.</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-400 to-sky-400 rounded-full blur-md opacity-30" />
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-white dark:border-zinc-800 shadow-xl shadow-pink-500/20 relative z-10 bg-white">
            <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold text-xl sm:text-3xl">
              {firstName[0]}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      </div>

      {/* 2. UPCOMING FUN (Próximas Aventuras) */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        <Card className="relative overflow-hidden border-0 rounded-[2.5rem] bg-gradient-to-br from-white/80 to-white/40 dark:from-zinc-900/80 dark:to-zinc-900/40 backdrop-blur-2xl shadow-xl shadow-sky-500/5 hover:shadow-2xl transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-300 via-orange-300 to-transparent rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-sky-300 via-indigo-300 to-transparent rounded-full blur-2xl opacity-30" />
          
          <CardContent className="p-6 sm:p-8 relative z-10 flex items-center gap-6">
            <div className="rounded-3xl bg-amber-100 dark:bg-amber-900/30 p-4 h-24 w-24 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-5xl drop-shadow-sm">🎢</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2 uppercase tracking-wide">
                <Calendar className="h-3 w-3" /> Próximas Aventuras
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold truncate text-zinc-800 dark:text-zinc-100">
                {upcomingEvent ? upcomingEvent.title : "Dia das Crianças Especial"}
              </h2>
              <p className="text-sm font-medium text-muted-foreground line-clamp-2 mt-1">
                {upcomingEvent ? upcomingEvent.content : "No próximo domingo, venha celebrar no Culto da Família com a gente! Traga seus filhos para um dia inesquecível."}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. QUATRO BOTÕES PÍLULA (Mockup: Register, Classes, Check-In, Activities) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: "register", label: "Cadastrar", icon: <Plus className="h-7 w-7" />, color: "from-pink-400 to-rose-500 text-white", action: handleAddChild },
          { id: "classes", label: "Minhas Turmas", icon: <Users className="h-7 w-7" />, color: "from-sky-400 to-blue-500 text-white", action: () => setShowChildrenList(!showChildrenList), badge: children?.length },
          { id: "checkin", label: "Check-in VIP", icon: <QrCode className="h-7 w-7" />, color: "from-amber-400 to-orange-500 text-white", action: () => {
              if (presentChildren && presentChildren.length > 0) {
                setExpandedQrId(presentChildren[0].id);
              } else {
                 goToTab("overview");
              }
          }, badge: presentChildren?.length },
          { id: "activities", label: "Histórico", icon: <Activity className="h-7 w-7" />, color: "from-violet-400 to-purple-500 text-white", action: () => goToTab("history") },
        ].map((btn, i) => (
          <motion.div
            key={btn.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1), type: "spring", stiffness: 300, damping: 20 }}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={btn.action}
            className="cursor-pointer"
          >
            <div className={`h-full rounded-[2rem] bg-gradient-to-br ${btn.color} p-5 shadow-lg shadow-${btn.color.split("-")[1].split(" ")[0]}/30 relative overflow-hidden group`}>
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 blur-xl rounded-full group-hover:scale-150 transition-transform duration-500" />
              <div className="flex flex-col items-center justify-center text-center gap-3 relative z-10 h-[100px]">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner shadow-white/10">
                  {btn.icon}
                </div>
                <span className="font-extrabold text-sm sm:text-base tracking-wide drop-shadow-sm">{btn.label}</span>
                {btn.badge !== undefined && btn.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-white text-zinc-800 hover:bg-white border-none font-black text-xs h-6 w-6 flex items-center justify-center p-0 rounded-full shadow-lg">
                    {btn.badge}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 4. CENTRAL DOS PAIS (Parent Hub: Event Calendar & Leader Board) */}
      <div className="space-y-4 pt-4">
        <h2 className="font-extrabold text-xl ml-2 flex items-center gap-2">
          Central dos Pais <span className="text-2xl">🏡</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card onClick={() => goToTab("events")} className="cursor-pointer border-0 rounded-[2.5rem] bg-white/60 dark:bg-black/20 backdrop-blur-xl shadow-lg hover:shadow-xl hover:bg-white/80 dark:hover:bg-white/5 transition-all group overflow-hidden relative">
            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-emerald-400/10 to-transparent pointer-events-none" />
            <CardContent className="p-6 flex items-center gap-5 relative z-10">
              <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-inner flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <Calendar className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">Calendário de Eventos</h3>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">Programação completa de aulas e recados</p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            </CardContent>
          </Card>

          <Card onClick={() => goToTab("announcements")} className="cursor-pointer border-0 rounded-[2.5rem] bg-white/60 dark:bg-black/20 backdrop-blur-xl shadow-lg hover:shadow-xl hover:bg-white/80 dark:hover:bg-white/5 transition-all group overflow-hidden relative">
            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-amber-400/10 to-transparent pointer-events-none" />
            <CardContent className="p-6 flex items-center gap-5 relative z-10">
              <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-amber-400 to-orange-500 shadow-inner flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <Award className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">Quadro de Heróis</h3>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">Avisos urgentes e conquistas da turma</p>
              </div>
              <Badge variant="destructive" className="ml-1 h-6 w-6 p-0 flex items-center justify-center rounded-full text-xs font-bold shadow-md opacity-90">
                {unreadCount > 0 ? unreadCount : "!"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ==== HIDDEN PANELS REVEALED BY BUTTONS ==== */}
      
      {/* VIP PASS PANEL (Revealed when Check-In VIP button is clicked, or always if we want, but following mockup it's hidden) */}
      <AnimatePresence>
        {expandedQrId && presentChildren && presentChildren.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <h2 className="flex items-center gap-2 font-extrabold text-xl text-foreground">
                  🎟️ VIP Heroes Aguardando
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setExpandedQrId(null)} className="rounded-full text-muted-foreground">
                  Fechar
                </Button>
              </div>
              {presentChildren.map((checkIn: any, i: number) => {
                const gradient = getClassroomColor(checkIn.children?.classroom);
                const isExpanded = expandedQrId === checkIn.id;
                if (!isExpanded) return null; // Show only the selected one, or all? Let's show all that are expanded.
                
                return (
                  <motion.div
                    key={checkIn.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-[2.5rem] border border-amber-400 dark:border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.3)] bg-gradient-to-br from-white/90 to-white/70 dark:from-black/80 dark:to-black/60 backdrop-blur-2xl"
                  >
                    <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-30`} />
                    <div className={`absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr ${gradient} rounded-full blur-3xl opacity-30`} />

                    <div className="p-6 relative z-10 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-6">
                         <div className="flex items-center gap-3">
                           <Avatar className="h-10 w-10 border-2 border-white dark:border-zinc-800">
                             <AvatarImage src={checkIn.children?.photo_url || undefined} />
                             <AvatarFallback className="font-bold text-xs">{(checkIn.children?.full_name || "U")[0]}</AvatarFallback>
                           </Avatar>
                           <div>
                             <p className="font-bold">{checkIn.children?.full_name}</p>
                             <Badge variant="outline" className="text-[10px] h-4 mt-0.5">{checkIn.children?.classroom}</Badge>
                           </div>
                         </div>
                         <div className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 gap-1 text-[10px] font-bold">
                           <Clock className="h-3 w-3" /> {getTimePresent(checkIn.checked_in_at)}
                         </div>
                      </div>

                      {/* Confetti relative container */}
                      <div className="relative w-full flex flex-col items-center justify-center py-4">
                        {['left-[10%]', 'right-[15%]', 'left-[80%]', 'right-[80%]'].map((pos, i) => (
                          <motion.div 
                            key={`confetti-${i}`}
                            className={`absolute top-0 w-2.5 h-2.5 rounded-sm ${i % 2 === 0 ? 'bg-amber-400' : 'bg-sky-400'} ${pos}`}
                            animate={{ y: [0, 150], opacity: [1, 0], rotate: [0, 360] }}
                            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                          />
                        ))}
                        <div className="rounded-[2rem] p-4 bg-white shadow-2xl shadow-indigo-500/10 border-4 border-amber-400/30 relative z-10">
                          <QRCodeSVG value={checkIn.qr_code} size={220} level="H" includeMargin={false} />
                        </div>
                        <Badge className="font-mono font-bold mt-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 border-0 tracking-widest px-4 py-1.5 rounded-xl">
                          CODE: {checkIn.label_number || checkIn.qr_code.slice(-8)}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHILDREN LIST PANEL (Revealed when "Minhas Turmas" button is clicked) */}
      <AnimatePresence>
        {showChildrenList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-6"
          >
            <div className="space-y-4 pt-4 border-t border-white/40 dark:border-white/10">
              <div className="flex items-center justify-between ml-1">
                <h2 className="font-extrabold text-xl">Meus Alunos / Filhos 👧👦</h2>
                <Button size="sm" variant="ghost" onClick={() => setShowChildrenList(false)} className="rounded-full text-muted-foreground">
                  Ocultar
                </Button>
              </div>

              {children && children.length > 0 ? (
                <div className="grid gap-3">
                  {children.map((child: any, index: number) => (
                    <motion.div
                      key={child.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08, type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <Card className="overflow-hidden border border-white/40 dark:border-white/5 rounded-[2rem] shadow-lg shadow-[rgba(0,0,0,0.03)] bg-white/60 dark:bg-black/20 backdrop-blur hover:shadow-xl transition-all">
                        <div className={`h-2 bg-gradient-to-r ${getClassroomColor(child.classroom)}`} />
                        <CardContent className="p-5">
                          <div className="flex items-start sm:items-center gap-4">
                            <div className={`rounded-full p-1 bg-gradient-to-br ${getClassroomColor(child.classroom)} shadow-md shrink-0`}>
                              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-[3px] border-white dark:border-zinc-800">
                                <AvatarImage src={child.photo_url || undefined} />
                                <AvatarFallback className="text-xl font-extrabold bg-white dark:bg-zinc-800 dark:text-white">
                                  {child.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                              <h3 className="font-extrabold text-lg sm:text-xl truncate bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                                {child.full_name}
                              </h3>
                              <p className="text-sm font-medium text-muted-foreground">{child.classroom}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {child.birth_date && (
                                  <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-white dark:bg-card border-sky-200 text-sky-600 dark:border-sky-800 dark:text-sky-400 shadow-sm">
                                    🎂 {getAge(child.birth_date)}
                                  </Badge>
                                )}
                                {child.allergies && (
                                  <Badge className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 border-0">
                                    <AlertTriangle className="h-3 w-3 mr-1" /> Alergia
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="shrink-0 rounded-full h-10 w-10 bg-black/5 dark:bg-white/10 hover:bg-black/10 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditChild(child)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="border-0 rounded-3xl bg-white/40 dark:bg-black/20 backdrop-blur pb-4">
                  <CardContent className="flex flex-col items-center justify-center pt-8 text-center text-muted-foreground">
                    <p>Você não cadastrou nenuma criança ainda!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PortalChildDialog
        open={childDialogOpen}
        onOpenChange={setChildDialogOpen}
        onSubmit={handleChildSubmit}
        child={editingChild}
        isPending={createChild.isPending || updateChild.isPending}
      />
    </motion.div>
  );
}
