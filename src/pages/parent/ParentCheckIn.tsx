import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ticket, QrCode, ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { useParentChildren, useParentPresentChildren } from "@/hooks/useParentData";
import { useChildMutations } from "@/hooks/useChildrenMinistry";
import { useEvents } from "@/hooks/useEvents";
import { cn } from "@/lib/utils";

export default function ParentCheckIn() {
  const { data: children, isLoading: loadingChildren } = useParentChildren();
  const { data: presentChildren, isLoading: loadingPresent, refetch: refetchPresent } = useParentPresentChildren();
  const { todayEvents, isLoading: loadingEvents } = useEvents();
  const { checkIn } = useChildMutations();
  
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "generating" | "ticket">("select");
  const [generatedCheckIn, setGeneratedCheckIn] = useState<any>(null);

  // If a child is already checked in, and we just landed here, we might want to show their ticket if there's only one.
  // But usually, we want to allow selecting a new one.

  const activeEvent = todayEvents?.[0] || { title: "Culto de Domingo", id: "default-event" };

  const handleCheckIn = (child: any) => {
    setSelectedChildId(child.id);
    // Mimic a quick "preparing" state for better UX
    setStep("generating");
    setTimeout(() => {
      setGeneratedCheckIn({
        children: child,
        event_name: activeEvent.title,
        classroom: child.classroom || "Infantil",
        qr_code: `CHILD_ID:${child.id}`, // Standard format for scanner
        is_pre_checkin: true
      });
      setStep("ticket");
    }, 800);
  };

  const reset = () => {
    setStep("select");
    setSelectedChildId(null);
    setGeneratedCheckIn(null);
  };

  if (loadingChildren || loadingPresent || loadingEvents) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-48 rounded-2xl bg-white/40" />
        <Skeleton className="h-40 w-full rounded-2xl bg-white/40" />
      </div>
    );
  }

  // Filter children who are NOT checked in today yet
  const checkedInIds = new Set(presentChildren?.map((c: any) => c.child_id) || []);
  const availableChildren = children?.filter((c: any) => !checkedInIds.has(c.id)) || [];

  return (
    <div className="w-full max-w-lg mx-auto pt-4 flex flex-col space-y-6 pb-20">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: SELECT CHILD */}
        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6 px-4"
          >
            <div className="flex items-center gap-3">
              <img src="/kids/icon_ticket.png" alt="Ticket" className="w-14 h-14 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.1)]" />
              <div>
                <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-none bg-gradient-to-r from-orange-500 to-rose-600 bg-clip-text text-transparent">Meu ID Digital 🎟️</h1>
                <p className="text-sm font-medium text-gray-700 mt-1">Apresente este código para entrar na aventura!</p>
              </div>
            </div>

            <div className="glass-card-kids p-4 bg-white/40 border border-white/60 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">EVENTO DE HOJE</span>
              </div>
              <h2 className="text-xl font-black text-[#1a1a1a]">{activeEvent.title}</h2>
            </div>

            <div className="space-y-3">
              {availableChildren.length > 0 ? (
                availableChildren.map((child: any) => (
                  <button
                    key={child.id}
                    onClick={() => handleCheckIn(child)}
                    className="w-full glass-card-kids p-4 flex items-center gap-4 bg-white/60 hover:bg-white/80 hover:scale-[1.02] active:scale-[0.98] transition-all group border border-white/40 shadow-lg"
                  >
                    <Avatar className="h-16 w-16 border-4 border-white shadow-xl">
                      <AvatarImage src={child.photo_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-rose-400 text-white font-bold text-xl uppercase">
                        {(child.full_name || "C")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <h3 className="font-extrabold text-[#1a1a1a] text-lg">{child.full_name}</h3>
                      <p className="text-sm font-bold text-orange-500 flex items-center gap-1">
                        <img src="/kids/kids_avatar.png" className="w-4 h-4" alt="Icon" /> {child.classroom || "Sala Kids"}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center group-hover:bg-orange-100 transition-colors shadow-inner">
                      <ArrowLeft className="h-5 w-5 text-orange-500 rotate-180" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="glass-card-kids p-10 flex flex-col items-center justify-center text-center bg-white/50 border border-dashed border-white/60">
                   <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                   </div>
                   <p className="font-extrabold text-[#1a1a1a] text-lg">Pronto para a Aventura!</p>
                   <p className="text-sm font-medium text-gray-600 mt-1">Apresente os IDs digitais abaixo no totem da igreja.</p>
                </div>
              )}

              {presentChildren && presentChildren.length > 0 && (
                <div className="pt-6 space-y-4">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">JÁ NA FESTA 🎉</h4>
                  {presentChildren.map((checkIn: any) => (
                    <div
                      key={checkIn.id}
                      onClick={() => { setGeneratedCheckIn(checkIn); setStep("ticket"); }}
                      className="w-full glass-card-kids p-3 flex items-center gap-3 bg-white/30 border border-white/20 opacity-80 cursor-pointer"
                    >
                      <Avatar className="h-10 w-10 border border-white">
                        <AvatarFallback className="bg-gray-400 text-white text-xs">{(checkIn.children?.full_name || "C")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-[#1a1a1a] text-sm">{checkIn.children?.full_name}</p>
                        <p className="text-[10px] font-black text-green-600 uppercase">PRESENTE</p>
                      </div>
                      <QrCode className="h-5 w-5 text-gray-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2: GENERATING */}
        {step === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px] text-center"
          >
            <div className="relative mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 bg-gradient-to-tr from-orange-400 via-rose-400 to-purple-400 rounded-full blur-xl opacity-30"
              />
              <img src="/kids/icon_ticket.png" alt="Ticket" className="w-24 h-24 relative animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-[#1a1a1a]">Gerando seu Ticket...</h2>
            <p className="text-gray-600 font-bold mt-2">Estamos preparando as aventuras!</p>
            <Loader2 className="h-6 w-6 animate-spin text-orange-500 mt-6" />
          </motion.div>
        )}

        {/* STEP 3: THE TICKET */}
        {step === "ticket" && generatedCheckIn && (
          <motion.div
            key="ticket"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="px-4"
          >
            <button 
              onClick={reset}
              className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#1a1a1a] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="relative">
               {/* Ticket Top */}
               <div className="bg-white/90 rounded-t-[2.5rem] p-8 border-x border-t border-white/60 shadow-xl flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-orange-400 shadow-lg border-2 border-white flex items-center justify-center mb-4">
                     <Ticket className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-[#1a1a1a] tracking-tight">TICKET VIP KIDS</h2>
                  <p className="text-sm font-black text-orange-500 uppercase tracking-[0.2em]">{generatedCheckIn.event_name}</p>
                  
                  <div className="mt-6 flex flex-col items-center gap-2">
                     <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                        <AvatarImage src={generatedCheckIn.children?.photo_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-rose-400 text-white font-bold text-3xl">{(generatedCheckIn.children?.full_name || "C")[0]}</AvatarFallback>
                     </Avatar>
                     <h3 className="font-extrabold text-xl text-[#1a1a1a] mt-2">{generatedCheckIn.children?.full_name}</h3>
                     <Badge className="bg-sky-100 text-sky-600 font-black border-sky-200 px-4 py-1">SALA: {generatedCheckIn.classroom}</Badge>
                  </div>
               </div>

               {/* DASHED LINE */}
               <div className="relative h-6 bg-white/90 border-x border-white/60 flex items-center justify-between">
                  <div className="absolute left-[-15px] w-8 h-8 rounded-full bg-kids-portal border border-white/40 shadow-inner" />
                  <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-6" />
                  <div className="absolute right-[-15px] w-8 h-8 rounded-full bg-kids-portal border border-white/40 shadow-inner" />
               </div>

               {/* Ticket Bottom (QR Code) */}
               <div className="bg-white/90 rounded-b-[2.5rem] p-8 border-x border-b border-white/60 shadow-xl flex flex-col items-center text-center">
                  <div className="bg-white p-4 rounded-3xl shadow-inner border border-black/5 mb-4 relative">
                    <QRCodeSVG value={generatedCheckIn.qr_code} size={180} level="H" includeMargin={false} />
                    <div className="absolute inset-0 border-2 border-dashed border-orange-400/20 pointer-events-none rounded-3xl m-2" />
                  </div>
                  <div className="font-black text-orange-600 uppercase tracking-widest text-lg flex items-center gap-2">
                    <img src="/kids/icon_ticket.png" className="w-6 h-6" alt="Icon" /> ID DIGITAL 🎟️
                  </div>
                  <p className="text-[10px] font-black text-gray-400 mt-4 max-w-[200px] uppercase tracking-tighter">
                    Apresente este código no Totem da Secretaria para confirmar a entrada.
                  </p>
                  
                  <Button 
                    onClick={reset}
                    className="mt-8 w-full rounded-2xl h-14 bg-gradient-to-r from-orange-400 to-rose-500 font-extrabold text-white shadow-lg border-0 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-orange-500/30"
                  >
                    FECHAR TICKET ✅
                  </Button>
               </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
