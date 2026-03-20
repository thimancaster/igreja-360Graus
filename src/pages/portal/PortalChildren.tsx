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

const TABS = [
  { value: "overview", label: "Visão Geral", icon: Baby, color: "from-pink-400 to-rose-500" },
  { value: "authorizations", label: "Autorizações", icon: Shield, color: "from-violet-400 to-purple-500" },
  { value: "history", label: "Histórico", icon: History, color: "from-sky-400 to-blue-500" },
  { value: "events", label: "Eventos", icon: Calendar, color: "from-amber-400 to-orange-500" },
  { value: "announcements", label: "Avisos", icon: Megaphone, color: "from-emerald-400 to-green-500" },
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-4 p-4">
      {/* Kids-themed header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-100 via-purple-100 to-sky-100 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-sky-950/30 p-5">
        <div className="relative z-10">
          <motion.div
            className="flex items-center gap-3"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <motion.span
              className="text-4xl"
              animate={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              👶
            </motion.span>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Meus Filhos
              </h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe seus filhos no ministério infantil ✨
              </p>
            </div>
          </motion.div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-pink-200/40 dark:bg-pink-800/20" />
        <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-purple-200/40 dark:bg-purple-800/20" />
        <div className="absolute top-2 right-20 h-8 w-8 rounded-full bg-sky-200/50 dark:bg-sky-800/20" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid h-auto p-1 bg-gradient-to-r from-pink-50 via-purple-50 to-sky-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-sky-950/20">
          {TABS.map(({ value, label, icon: Icon, color }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
            >
              <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                <div className={`rounded-full p-1 bg-gradient-to-br ${color} bg-opacity-20`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
              </motion.div>
              <span className="hidden sm:inline text-xs font-medium">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><ParentDashboardContent /></TabsContent>
        <TabsContent value="authorizations"><ParentAuthorizationsContent /></TabsContent>
        <TabsContent value="history"><ParentHistoryContent /></TabsContent>
        <TabsContent value="events"><ParentEventsContent /></TabsContent>
        <TabsContent value="announcements"><ParentAnnouncementsContent /></TabsContent>
      </Tabs>
    </motion.div>
  );
}
