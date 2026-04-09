import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar, QrCode, Search, Home as HomeIcon, BookOpen, Trophy, User, Palette, ChevronRight, Users, Check, Pencil, Star
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useParentChildren, useParentPresentChildren } from "@/hooks/useParentData";
import { useChildMutations } from "@/hooks/useChildrenMinistry";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useEvents } from "@/hooks/useEvents";
import { cn } from "@/lib/utils";
import { PortalChildDialog, PortalChildFormData } from "@/components/portal/PortalChildDialog";
import { UrgentCallAlert } from "@/components/children-ministry/UrgentCallAlert";
import { ParentEvolution } from "@/components/portal/ParentEvolution";
import { useNavigate } from "react-router-dom";
import { differenceInMinutes, differenceInYears } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const { data: children, isLoading: loadingChildren } = useParentChildren();
  const { data: presentChildren, isLoading: loadingPresent } = useParentPresentChildren();
  const { parentAnnouncements, unreadCount, markAsRead, activeUrgentCall, respondToCall } = useAnnouncements();
  const { createChild, updateChild } = useChildMutations();
  const navigate = useNavigate();

  const [childDialogOpen, setChildDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const [expandedQrId, setExpandedQrId] = useState<string | null>(null);
  const [showChildrenList, setShowChildrenList] = useState(false);
  const [viewingEvolutionChild, setViewingEvolutionChild] = useState<any>(null);

  const goToTab = (tab: string) => navigate(`/portal/filhos?tab=${tab}`);

  const firstName = profile?.full_name?.split(" ")[0] || "Família";

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
      photo_url: null,
      status: "active",
      behavior_points: 0,
    };
    if (editingChild) {
      await updateChild.mutateAsync({ id: editingChild.id, ...payload });
    } else {
      await createChild.mutateAsync(payload);
    }
  };

  if (loadingChildren || loadingPresent) {
    return (
      <div className="space-y-4 p-4 bg-kids-portal">
        <Skeleton className="h-24 w-full rounded-[2rem] bg-white/40" />
        <Skeleton className="h-64 w-full rounded-[2rem] bg-white/40" />
      </div>
    );
  }

  const unreadAnnouncements = parentAnnouncements?.filter(a => !a.is_read) || [];
  const currentAnnouncement = unreadAnnouncements[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="w-full max-w-[28rem] lg:max-w-4xl mx-auto px-4 pt-6 flex flex-col space-y-6"
    >
      
      {/* TELA DE EVOLUÇÃO (OVERLAY) */}
      <AnimatePresence>
        {viewingEvolutionChild && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-0 z-[110] bg-kids-portal overflow-y-auto px-4"
          >
            <ParentEvolution 
              child={viewingEvolutionChild} 
              onBack={() => setViewingEvolutionChild(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <UrgentCallAlert 
         announcement={activeUrgentCall} 
         onRespond={(id, status) => respondToCall({ id, status })}
      />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/kids/kids_logo.png" alt="Logo Kids" className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" />
          <h1 className="font-extrabold text-lg text-[#1a1a1a] tracking-tight">PORTAL KIDS</h1>
        </div>
        <button className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center bg-white/20 backdrop-blur-md shadow-sm">
          <Search className="h-5 w-5 text-[#1a1a1a]" />
        </button>
      </div>

      {/* GREETING */}
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold text-[#1a1a1a] tracking-tighter">
            Olá, {firstName}! <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ duration: 0.6, repeat: 2, repeatDelay: 2 }} className="inline-block">👋</motion.span>
          </h2>
          <p className="text-gray-700 font-medium">Bem-vindo ao Portal Kids!</p>
        </div>
        <div className="relative shrink-0">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#86efac] via-[#93c5fd] to-[#d8b4fe] blur-sm opacity-80" />
          <Avatar className="h-16 w-16 border-2 border-white shadow-xl relative z-10 bg-white">
            <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || "/kids/kids_avatar.png"} />
            <AvatarFallback className="bg-gradient-to-br from-magenta-400 to-indigo-500 text-white font-bold text-xl">
              {firstName[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* UPCOMING FUN CARD */}
      <div className="space-y-3 pt-4">
        <h3 className="font-extrabold text-lg text-[#1a1a1a]">Nossos Eventos</h3>
        <div 
          className="glass-card-kids p-6 group cursor-pointer transition-all duration-500 flex flex-col lg:flex-row lg:items-center gap-6 mt-20 lg:mt-24"
          onClick={() => goToTab("events")}
        >
          <div className="relative w-full lg:w-40 shrink-0 h-4 lg:h-0">
            <motion.img 
              src="/kids/kids_event_v2.png" 
              alt="Event" 
              className="absolute -top-28 lg:-top-32 -left-4 lg:-left-6 w-48 lg:w-56 max-w-none pop-out-character z-20" 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            />
          </div>

          <div className="flex-1 relative z-20 pt-6 lg:pt-0">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h4 className="font-extrabold text-[#1a1a1a] text-xl leading-tight">
                {currentAnnouncement ? currentAnnouncement.title : "Tudo limpo por aqui! 🎉"}
              </h4>
              {currentAnnouncement && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); markAsRead(currentAnnouncement.id); }}
                  className="rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 shrink-0 w-10 h-10 p-0"
                  title="Limpar aviso"
                >
                  <Check className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
               <Badge className="bg-emerald-500 text-white font-bold border-0 shadow-md px-3 py-1 rounded-full">
                {currentAnnouncement ? new Date(currentAnnouncement.created_at).toLocaleDateString("pt-BR") : "Aventuras de Domingo!"}
               </Badge>
               <Badge className="bg-sky-500 text-white font-bold border-0 shadow-md px-3 py-1 rounded-full text-xs">Sede Central</Badge>
            </div>
            <p className="text-sm text-gray-700 font-bold leading-relaxed">
              {currentAnnouncement ? currentAnnouncement.content : "Fique atento para as novas histórias e atividades especiais!"}
            </p>
          </div>
          
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (children?.[0]) setViewingEvolutionChild(children[0]); 
            }}
            className="hidden lg:flex flex-col items-center justify-center p-5 bg-white/30 rounded-3xl border border-white/40 backdrop-blur-md shadow-sm shrink-0 relative z-10 hover:bg-white/50 transition-all hover:scale-105 active:scale-95 group"
          >
             <div className="relative">
                <div className="absolute -inset-2 bg-yellow-400 blur-lg opacity-20 group-hover:opacity-40 animate-pulse" />
                <img src="/kids/icon_trophy.png" alt="Trophy" className="w-16 h-16 object-contain drop-shadow-md relative z-10" />
             </div>
             <p className="text-[10px] font-black text-amber-600 mt-2 tracking-tighter uppercase whitespace-nowrap">
               {children?.reduce((acc, c) => acc + (c.behavior_points || 0), 0) || 0} PONTOS
             </p>
             <p className="text-[8px] font-bold text-gray-500 tracking-tight uppercase">VER EVOLUÇÃO</p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <button 
          className="glass-pill pill-purple"
          onClick={() => setShowChildrenList(!showChildrenList)}
        >
          <img src="/kids/icon_meus_filhos.png" alt="Filhos" className="w-9 h-9 object-contain drop-shadow-md" />
          <span className="flex-1 text-left text-sm lg:text-base text-[#1a1a1a]">Meus Filhos</span>
        </button>
        
        <button 
          className="glass-pill pill-gold"
          onClick={() => children?.[0] && setViewingEvolutionChild(children[0])}
        >
          <img src="/kids/icon_trophy.png" alt="Trophy" className="w-8 h-8 object-contain drop-shadow-md" />
          <span className="flex-1 text-left text-sm lg:text-base text-[#1a1a1a] font-bold">Evolução</span>
        </button>
        
        <button 
          className="glass-pill pill-orange"
          onClick={() => goToTab("checkin")}
        >
          <img src="/kids/icon_ticket.png" alt="Ticket" className="w-8 h-8 object-contain drop-shadow-md" />
          <span className="flex-1 text-left text-sm lg:text-base text-[#1a1a1a]">Check-In</span>
        </button>
 
        <button 
          className="glass-pill pill-green"
          onClick={() => goToTab("rewards")}
        >
          <img src="/kids/icon_trophy.png" alt="Trophy" className="w-8 h-8 object-contain drop-shadow-md" />
          <span className="flex-1 text-left text-sm lg:text-base text-[#1a1a1a]">Recompensa</span>
        </button>
      </div>

      <AnimatePresence>
        {expandedQrId && presentChildren && presentChildren.length > 0 && (
           <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: "auto" }}
             exit={{ opacity: 0, height: 0 }}
             className="overflow-hidden"
           >
             <div className="glass-card-kids p-5 bg-white/60 backdrop-blur-xl border border-white/40 mt-2 mb-2">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="font-extrabold text-lg text-[#1a1a1a]">🎟️ Check-In VIP</h2>
                 <Button variant="ghost" size="sm" onClick={() => setExpandedQrId(null)} className="rounded-full text-gray-700">
                   Fechar
                 </Button>
               </div>
               <div className="grid gap-4">
                 {presentChildren.map((checkIn: any) => (
                   <div key={checkIn.id} className="bg-white/80 p-4 rounded-3xl shadow-sm border border-black/5">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <Avatar className="h-10 w-10 border-2 border-white">
                           <AvatarImage src={checkIn.children?.photo_url || undefined} />
                           <AvatarFallback className="bg-orange-400 text-white font-bold">{(checkIn.children?.full_name || "C")[0]}</AvatarFallback>
                         </Avatar>
                         <div>
                           <p className="font-bold text-[#1a1a1a]">{checkIn.children?.full_name}</p>
                           <p className="text-xs text-orange-500 font-bold">{checkIn.children?.classroom}</p>
                         </div>
                       </div>
                     </div>
                     <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl mx-auto shadow-md">
                       <QRCodeSVG value={checkIn.qr_code} size={150} level="H" includeMargin={false} />
                       <p className="mt-2 font-mono font-bold text-gray-600 text-sm">
                         {checkIn.label_number || checkIn.qr_code.slice(-8)}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </motion.div>
        )}

        {showChildrenList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card-kids p-5 bg-white/60 backdrop-blur-xl border border-white/40 mt-2 mb-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-lg text-[#1a1a1a]">Meus Filhos</h2>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setEditingChild(null); setChildDialogOpen(true); }} className="rounded-full bg-purple-500 hover:bg-purple-600 text-white shadow-sm border-0">
                    Adicionar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowChildrenList(false)} className="rounded-full text-gray-700">
                    Fechar
                  </Button>
                </div>
              </div>
              {children && children.length > 0 ? (
                <div className="grid gap-3">
                  {children.map((child: any) => (
                    <div key={child.id} className="bg-white/80 border border-black/5 rounded-2xl p-3 flex items-center shadow-sm gap-3">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-purple-500 text-white font-bold text-lg">
                          {child.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#1a1a1a] truncate">{child.full_name}</h3>
                        <p className="text-purple-600 font-bold text-xs">{child.classroom}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setViewingEvolutionChild(child)} 
                          className="w-10 h-10 p-0 rounded-full text-amber-600 bg-amber-50 hover:bg-amber-100"
                          title="Ver Evolução"
                        >
                          <Trophy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEditChild(child)} className="w-10 h-10 p-0 rounded-full text-gray-500 hover:bg-black/5">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-white/50 rounded-2xl text-gray-600 text-sm font-medium">
                  Você não possui filhos cadastrados ainda.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 pt-8 pb-10">
        <h3 className="font-extrabold text-lg text-[#1a1a1a]">Área dos Pais</h3>
        <div className="grid grid-cols-2 gap-3 lg:gap-8 mt-2">
          <div 
            className="glass-card-kids p-4 lg:p-8 flex flex-col justify-center items-center text-center cursor-pointer group mt-10 md:mt-8"
            onClick={() => goToTab("events")}
          >
            <div className="relative h-6 md:h-8 w-full mb-1">
              <img 
                src="/kids/icon_calendar.png" 
                alt="Calendar" 
                className="absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2 w-20 h-20 md:w-24 md:h-24 object-contain pop-out-character" 
              />
            </div>
            <h4 className="font-extrabold text-[#1a1a1a] text-base lg:text-xl leading-tight">Calendário</h4>
          </div>

           <div 
            className="glass-card-kids p-4 lg:p-8 flex flex-col justify-center items-center text-center cursor-pointer group mt-10 md:mt-8"
            onClick={() => goToTab("history")}
          >
            <div className="relative h-6 md:h-8 w-full mb-1">
              <img 
                src="/kids/icon_paintbrush.png" 
                alt="Paintbrush" 
                className="absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2 w-20 h-20 md:w-24 md:h-24 object-contain pop-out-character" 
              />
            </div>
            <h4 className="font-extrabold text-[#1a1a1a] text-base lg:text-xl leading-tight">Histórico</h4>
          </div>

          <div 
            className="glass-card-kids p-4 lg:p-8 flex flex-col justify-center items-center text-center cursor-pointer group mt-10 md:mt-8"
            onClick={() => goToTab("schedules")}
          >
            <div className="relative h-6 md:h-8 w-full mb-1">
              <img 
                src="/kids/icon_meus_filhos.png" 
                alt="Schedules" 
                className="absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2 w-20 h-20 md:w-24 md:h-24 object-contain pop-out-character" 
              />
            </div>
            <h4 className="font-extrabold text-[#1a1a1a] text-base lg:text-xl leading-tight">Escalas</h4>
          </div>
        </div>

      </div>

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
