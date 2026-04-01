import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Baby, Shield, History, Calendar, Megaphone } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useSearchParams } from "react-router-dom";

import ParentDashboardContent from "@/pages/parent/ParentDashboard";
import ParentAuthorizationsContent from "@/pages/parent/ParentAuthorizations";
import ParentHistoryContent from "@/pages/parent/ParentHistory";
import ParentEventsContent from "@/pages/parent/ParentEvents";
import ParentAnnouncementsContent from "@/pages/parent/ParentAnnouncements";
import { User } from "lucide-react";

const TABS = [
  { value: "overview", label: "Início", icon: Baby, color: "from-pink-400 to-rose-500" },
  { value: "events", label: "Eventos", icon: Calendar, color: "from-amber-400 to-orange-500" },
  { value: "authorizations", label: "Avisos", icon: Megaphone, color: "from-emerald-400 to-green-500" },
  { value: "history", label: "Histórico", icon: History, color: "from-sky-400 to-blue-500" },
  { value: "profile", label: "Perfil", icon: User, color: "from-violet-400 to-purple-500" },
];

export default function PortalChildren() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "overview");
  const { isParent } = useRole();

  useEffect(() => {
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-4 relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Playful Background Bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-sky-50/50 dark:from-pink-950/10 dark:via-purple-950/10 dark:to-sky-950/10">
        <motion.div 
          className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-pink-400/20 dark:bg-pink-600/10 blur-[80px]"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] rounded-full bg-sky-400/20 dark:bg-sky-600/10 blur-[80px]"
          animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute -bottom-[10%] left-[20%] w-[600px] h-[600px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[80px]"
          animate={{ x: [0, 30, 0], y: [0, -40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative z-10 space-y-2 flex flex-col h-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="flex-1">
            <TabsContent value="overview" className="mt-0 h-full outline-none"><ParentDashboardContent /></TabsContent>
            <TabsContent value="authorizations" className="mt-0 outline-none"><ParentAuthorizationsContent /></TabsContent>
            <TabsContent value="history" className="mt-0 outline-none"><ParentHistoryContent /></TabsContent>
            <TabsContent value="events" className="mt-0 outline-none"><ParentEventsContent /></TabsContent>
            <TabsContent value="announcements" className="mt-0 outline-none"><ParentAnnouncementsContent /></TabsContent>
            <TabsContent value="profile" className="mt-0 outline-none">
              <div className="p-8 text-center text-muted-foreground">Configurações de Perfil (KIDS)</div>
            </TabsContent>
          </div>

          {/* Bottom/Mockup Style Navigation Bar */}
          <div className="mt-6 sm:mt-8 sticky bottom-4 z-50 px-2">
            <TabsList className="flex w-full max-w-lg mx-auto h-auto gap-1 sm:gap-2 p-2 rounded-[2rem] bg-white/70 dark:bg-black/50 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl shadow-pink-500/10">
              {TABS.map(({ value, label, icon: Icon, color }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-1 flex-col gap-1 p-2 sm:p-3 rounded-3xl data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-lg hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300"
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <div className={`p-1.5 rounded-full ${activeTab === value ? 'text-white shadow-inner shadow-white/30 bg-gradient-to-br ' + color : 'text-zinc-500 dark:text-zinc-400 bg-transparent'}`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
                    </div>
                  </motion.div>
                  <span className={`text-[10px] sm:text-xs font-bold tracking-wide ${activeTab === value ? 'text-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
}
