import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useSearchParams, useNavigate } from "react-router-dom";

import ParentDashboardContent from "@/pages/parent/ParentDashboard";
import ParentAuthorizationsContent from "@/pages/parent/ParentAuthorizations";
import ParentHistoryContent from "@/pages/parent/ParentHistory";
import ParentEventsContent from "@/pages/parent/ParentEvents";
import ParentAnnouncementsContent from "@/pages/parent/ParentAnnouncements";
import ParentClassesContent from "@/pages/parent/ParentClasses";
import ParentCheckInContent from "@/pages/parent/ParentCheckIn";
import ParentRewardsContent from "@/pages/parent/ParentRewards";
import ParentSchedulesContent from "@/pages/parent/ParentSchedules";
import ParentJourneyContent from "@/pages/parent/ParentJourney";

export default function PortalChildren() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "overview");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cx = (e.clientX / window.innerWidth) - 0.5;
      const cy = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x: cx, y: cy });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const goToTab = (tab: string) => navigate(`/portal/filhos?tab=${tab}`);

  return (
    <div className="flex-1 bg-kids-portal relative min-h-[calc(100vh-4rem)] w-full overflow-hidden font-geist pb-28">
      {/* BACKGROUND FLOATING VOLUMETRIC BUBBLES — com efeito Parallax */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Bolhas grandes: movem pouco (parecem distantes) */}
        <div className="glass-bubble bubble-magenta top-[-5%] left-[-10%] w-[300px] h-[300px]"
          style={{ transform: `translate(${-mousePos.x * 18}px, ${-mousePos.y * 18}px)` }} />
        <div className="glass-bubble bubble-cyan top-[20%] right-[-15%] w-[350px] h-[350px]"
          style={{ transform: `translate(${-mousePos.x * 15}px, ${-mousePos.y * 15}px)` }} />
        {/* Bolhas médias: velocidade intermediária */}
        <div className="glass-bubble bubble-yellow bottom-[30%] left-[-5%] w-[200px] h-[200px]"
          style={{ transform: `translate(${-mousePos.x * 25}px, ${-mousePos.y * 25}px)` }} />
        <div className="glass-bubble bubble-orange bottom-[5%] right-[10%] w-[250px] h-[250px]"
          style={{ transform: `translate(${-mousePos.x * 22}px, ${-mousePos.y * 22}px)` }} />
        {/* Bolhas pequenas: movem mais (parecem próximas) */}
        <div className="glass-bubble bubble-magenta bottom-[10%] left-[30%] w-[100px] h-[100px]"
          style={{ transform: `translate(${-mousePos.x * 35}px, ${-mousePos.y * 35}px)` }} />
        <div className="glass-bubble bubble-cyan top-[10%] left-[50%] w-[80px] h-[80px]"
          style={{ transform: `translate(${-mousePos.x * 40}px, ${-mousePos.y * 40}px)` }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 h-full flex flex-col pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full w-full">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <TabsContent value="overview" className="mt-0 h-full outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <ParentDashboardContent />
                  </motion.div>
                </TabsContent>
              )}
              {activeTab === "authorizations" && (
                <TabsContent value="authorizations" className="mt-0 outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <ParentAuthorizationsContent />
                  </motion.div>
                </TabsContent>
              )}
              {activeTab === "history" && (
                <TabsContent value="history" className="mt-0 outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <ParentHistoryContent />
                  </motion.div>
                </TabsContent>
              )}
              {activeTab === "events" && (
                <TabsContent value="events" className="mt-0 outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <ParentEventsContent />
                  </motion.div>
                </TabsContent>
              )}
              {activeTab === "announcements" && (
                <TabsContent value="announcements" className="mt-0 outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <ParentAnnouncementsContent />
                  </motion.div>
                </TabsContent>
              )}
              {activeTab === "classes" && (
                <TabsContent value="classes" className="mt-0 outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <ParentClassesContent />
                  </motion.div>
                </TabsContent>
              )}
              {activeTab === "checkin" && (
                <TabsContent value="checkin" className="mt-0 outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <ParentCheckInContent />
                  </motion.div>
                </TabsContent>
              )}
              {activeTab === "schedules" && (
                <TabsContent value="schedules" className="mt-0 outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <ParentSchedulesContent />
                  </motion.div>
                </TabsContent>
              )}
              {activeTab === "rewards" && (
                <TabsContent value="rewards" className="mt-0 outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <ParentRewardsContent />
                  </motion.div>
                </TabsContent>
              )}
              {activeTab === "journey" && (
                <TabsContent value="journey" className="mt-0 outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <ParentJourneyContent />
                  </motion.div>
                </TabsContent>
              )}
              {activeTab === "profile" && (
                <TabsContent value="profile" className="mt-0 outline-none" forceMount>
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                    <div className="p-10 w-full glass-card-kids bg-white/70 text-center flex flex-col items-center justify-center min-h-[400px]">
                      <div className="relative mb-6">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full blur-xl opacity-30 animate-pulse" />
                        <img src="/kids/portal-kids-nav-profile-v2.png" alt="Profile" className="w-32 h-32 relative drop-shadow-2xl" />
                      </div>
                      <h2 className="font-extrabold text-[#1a1a1a] text-3xl tracking-tight">Área dos Pais</h2>
                      <p className="text-gray-600 mt-2 font-bold max-w-sm">Configurações de conta e preferências do portal estarão disponíveis em breve!</p>
                      <div className="mt-8 flex gap-6">
                        <img src="/kids/portal-kids-icon-calendar-v2.png" alt="Calendar" className="w-12 h-12 object-contain pop-out-character" />
                        <img src="/kids/portal-kids-icon-ticket-v2.png" alt="Ticket" className="w-12 h-12 object-contain pop-out-character" />
                        <img src="/kids/portal-kids-nav-journey-v2.png" alt="Trophy" className="w-12 h-12 object-contain pop-out-character" />
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              )}
            </AnimatePresence>
          </div>
        </Tabs>
      </div>

      {/* FLOATING BOTTOM NAV — 6 itens */}
      <div className="glass-bottom-nav">
        {/* Início */}
        <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => goToTab("overview")}>
          <motion.img
            src="/kids/portal-kids-icon-home-v2.png"
            alt="Início"
            className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md"
            whileHover={{ scale: 1.2, y: -5 }}
            animate={activeTab === 'overview' ? { scale: 1.15, y: -3, filter: "brightness(1.1) drop-shadow(0 5px 15px rgba(59,130,246,0.4))" } : { scale: 1, y: 0 }}
          />
          <span className={`${activeTab === 'overview' ? 'text-blue-600 font-black' : 'text-gray-500 font-bold'} transition-all`}>Início</span>
        </div>

        {/* Aventuras */}
        <div className={`nav-item ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => goToTab("classes")}>
          <motion.img
            src="/kids/portal-kids-nav-classes-v2.png"
            alt="Aventuras"
            className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md"
            whileHover={{ scale: 1.2, y: -5 }}
            animate={activeTab === 'classes' ? { scale: 1.15, y: -3, filter: "brightness(1.1) drop-shadow(0 5px 15px rgba(139,92,246,0.4))" } : { scale: 1, y: 0 }}
          />
          <span className={`${activeTab === 'classes' ? 'text-purple-600 font-black' : 'text-gray-500 font-bold'} transition-all`}>Aventuras</span>
        </div>

        {/* Agenda */}
        <div className={`nav-item ${activeTab === 'checkin' ? 'active' : ''}`} onClick={() => goToTab("checkin")}>
          <motion.img
            src="/kids/portal-kids-nav-schedules-v2.png"
            alt="Agenda"
            className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md"
            whileHover={{ scale: 1.2, y: -5 }}
            animate={activeTab === 'checkin' ? { scale: 1.15, y: -3, filter: "brightness(1.1) drop-shadow(0 5px 15px rgba(245,158,11,0.4))" } : { scale: 1, y: 0 }}
          />
          <span className={`${activeTab === 'checkin' ? 'text-orange-600 font-black' : 'text-gray-500 font-bold'} transition-all`}>Agenda</span>
        </div>

        {/* Minha Jornada */}
        <div className={`nav-item ${activeTab === 'journey' ? 'active' : ''}`} onClick={() => goToTab("journey")}>
          <motion.img
            src="/kids/portal-kids-nav-journey-v2.png"
            alt="Minha Jornada"
            className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md"
            whileHover={{ scale: 1.2, y: -5 }}
            animate={activeTab === 'journey' ? { scale: 1.15, y: -3, filter: "brightness(1.1) drop-shadow(0 5px 15px rgba(234,179,8,0.5))" } : { scale: 1, y: 0 }}
          />
          <span className={`${activeTab === 'journey' ? 'text-yellow-600 font-black' : 'text-gray-500 font-bold'} transition-all`}>Jornada</span>
        </div>

        {/* Perfil */}
        <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => goToTab("profile")}>
          <motion.img
            src="/kids/portal-kids-nav-profile-v2.png"
            alt="Perfil"
            className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md"
            whileHover={{ scale: 1.2, y: -5 }}
            animate={activeTab === 'profile' ? { scale: 1.15, y: -3, filter: "brightness(1.1) drop-shadow(0 5px 15px rgba(249,115,22,0.4))" } : { scale: 1, y: 0 }}
          />
          <span className={`${activeTab === 'profile' ? 'text-orange-600 font-black' : 'text-gray-500 font-bold'} transition-all`}>Perfil</span>
        </div>

        {/* Sair */}
        <div className="nav-item group" onClick={() => navigate("/portal")}>
          <motion.img
            src="/kids/icon_sair.png"
            alt="Sair"
            className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md group-hover:opacity-80"
            whileHover={{ scale: 1.2, y: -5 }}
          />
          <span className="text-gray-400 group-hover:text-red-400 font-bold transition-all">Sair</span>
        </div>
      </div>
    </div>
  );
}
