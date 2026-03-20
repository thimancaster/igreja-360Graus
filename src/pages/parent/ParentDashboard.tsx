import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Baby, Clock, MapPin, Plus, History, Calendar, Megaphone,
  ChevronRight, AlertCircle, Pencil, Heart, AlertTriangle, QrCode, FileText
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
  const { data: children, isLoading: loadingChildren } = useParentChildren();
  const { data: presentChildren, isLoading: loadingPresent } = useParentPresentChildren();
  const { parentAnnouncements, unreadCount } = useAnnouncements();
  const { createChild, updateChild } = useParentChildMutations();
  const navigate = useNavigate();

  const [childDialogOpen, setChildDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const [expandedQrId, setExpandedQrId] = useState<string | null>(null);

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
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const recentAnnouncements = parentAnnouncements?.slice(0, 2) || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 space-y-4 p-4">
      {/* Welcome */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="space-y-1"
      >
        <h1 className="text-2xl font-bold tracking-tight">
          Olá! <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ duration: 0.6, repeat: 2, repeatDelay: 2 }} className="inline-block">👋</motion.span>
        </h1>
        <p className="text-muted-foreground">Acompanhe seus filhos em tempo real 💜</p>
      </motion.div>

      {/* Present Children */}
      {presentChildren && presentChildren.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 shadow-lg shadow-emerald-100/50 dark:shadow-none rounded-2xl overflow-hidden">
            <div className="p-4 space-y-3">
              <h2 className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <MapPin className="h-5 w-5" />
                </motion.div>
                Filhos Presentes ✅
              </h2>
              {presentChildren.map((checkIn: any, i: number) => (
                <motion.div
                  key={checkIn.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border-0 bg-white/80 dark:bg-card/80 backdrop-blur p-3 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-0.5 bg-gradient-to-br ${getClassroomColor(checkIn.children?.classroom)}`}>
                        <Avatar className="h-12 w-12 border-2 border-white">
                          <AvatarImage src={checkIn.children?.photo_url || undefined} />
                          <AvatarFallback className="bg-white text-sm font-bold">
                            {checkIn.children?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="font-bold">{checkIn.children?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{checkIn.children?.classroom}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <Clock className="h-3 w-3" />
                        {getTimePresent(checkIn.checked_in_at)}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Entrada: {format(new Date(checkIn.checked_in_at), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {checkIn.qr_code && (
                    <div className="border-t border-emerald-100 dark:border-emerald-900/30 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 rounded-xl border-emerald-200 dark:border-emerald-800"
                        onClick={() => setExpandedQrId(expandedQrId === checkIn.id ? null : checkIn.id)}
                      >
                        <QrCode className="h-4 w-4" />
                        {expandedQrId === checkIn.id ? "Ocultar QR Code" : "Mostrar QR Code para Retirada"}
                      </Button>
                      <AnimatePresence>
                        {expandedQrId === checkIn.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col items-center gap-2 pt-3">
                              <div className="rounded-xl border-2 border-emerald-200 bg-white p-4">
                                <QRCodeSVG value={checkIn.qr_code} size={200} level="H" includeMargin={false} />
                              </div>
                              <p className="text-xs text-muted-foreground text-center max-w-[240px]">
                                Apresente este QR Code para a retirada da criança
                              </p>
                              <Badge variant="outline" className="text-xs font-mono">
                                {checkIn.label_number || checkIn.qr_code.slice(-8)}
                              </Badge>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Classroom Report Card */}
      {latestReport && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 shrink-0">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Relatório de Aula</p>
                  <p className="font-bold text-sm mt-0.5 truncate">{latestReport.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {latestReport.classroom} • {format(new Date(latestReport.event_date), "dd/MM", { locale: ptBR })}
                    {latestReport.teacher_name && ` • ${latestReport.teacher_name}`}
                  </p>
                  <p className="text-sm mt-2 line-clamp-2 text-muted-foreground">{latestReport.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Unread announcements */}
      {unreadCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div onClick={() => goToTab("announcements")} className="cursor-pointer active:scale-[0.98] transition-transform">
            <Card className="border-0 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 rounded-2xl shadow-sm">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="rounded-full bg-rose-100 dark:bg-rose-900/30 p-2"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Megaphone className="h-5 w-5 text-rose-600" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-sm">
                      {unreadCount} {unreadCount === 1 ? "comunicado novo" : "comunicados novos"} 📬
                    </p>
                    <p className="text-xs text-muted-foreground">Toque para ver</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Children Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Meus Filhos 👧👦</h2>
          <Button size="sm" onClick={handleAddChild} className="gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0">
            <Plus className="h-4 w-4" />
            Cadastrar
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
                <Card className="overflow-hidden border-0 rounded-2xl shadow-md hover:shadow-lg transition-shadow active:scale-[0.98]">
                  <div className={`h-1.5 bg-gradient-to-r ${getClassroomColor(child.classroom)}`} />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-full p-0.5 bg-gradient-to-br ${getClassroomColor(child.classroom)}`}>
                        <Avatar className="h-16 w-16 border-2 border-white">
                          <AvatarImage src={child.photo_url || undefined} />
                          <AvatarFallback className="text-lg font-bold bg-white">
                            {child.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{child.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{child.classroom}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {child.birth_date && (
                            <Badge variant="outline" className="text-xs rounded-full bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-300">
                              🎂 {getAge(child.birth_date)}
                            </Badge>
                          )}
                          {child.allergies && (
                            <Badge className="text-xs rounded-full bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300 gap-0.5">
                              <AlertTriangle className="h-3 w-3" />
                              Alergia
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0 rounded-full"
                        onClick={() => handleEditChild(child)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>

                    {(child.allergies || child.medications || child.special_needs) && (
                      <div className="mt-3 pt-3 border-t border-dashed space-y-1.5">
                        {child.allergies && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="text-red-500">⚠️</span>
                            <span className="truncate">Alergias: {child.allergies}</span>
                          </p>
                        )}
                        {child.medications && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span>💊</span>
                            <span className="truncate">Medicações: {child.medications}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-0 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <motion.span
                className="text-5xl mb-3"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👶
              </motion.span>
              <p className="font-bold text-center">Nenhum filho cadastrado</p>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Cadastre seus filhos para acompanhar no ministério infantil
              </p>
              <Button onClick={handleAddChild} className="mt-4 gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0">
                <Plus className="h-4 w-4" />
                Cadastrar Filho
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Ações Rápidas ⚡</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { tab: "authorizations", icon: "🛡️", label: "Autorizações", gradient: "from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20" },
            { tab: "history", icon: "📋", label: "Histórico", gradient: "from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20" },
            { tab: "events", icon: "🎉", label: "Eventos", gradient: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20" },
            { tab: "announcements", icon: "📢", label: "Comunicados", gradient: "from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20", badge: unreadCount },
          ].map(({ tab, icon, label, gradient, badge }, i) => (
            <motion.div
              key={tab}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              onClick={() => goToTab(tab)}
              className="cursor-pointer"
            >
              <Card className={`h-full border-0 rounded-2xl bg-gradient-to-br ${gradient} shadow-sm hover:shadow-md active:scale-[0.96] transition-all`}>
                <CardContent className="flex flex-col items-center justify-center py-6 text-center relative">
                  <motion.span className="text-3xl mb-2" whileHover={{ scale: 1.2, rotate: 5 }}>
                    {icon}
                  </motion.span>
                  <p className="font-bold text-sm">{label}</p>
                  {badge && badge > 0 && (
                    <Badge variant="destructive" className="absolute top-2 right-2 h-5 min-w-5 px-1.5 rounded-full text-xs">
                      {badge}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Announcements */}
      {recentAnnouncements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Comunicados Recentes 📣</h2>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => goToTab("announcements")}>
              Ver todos <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {recentAnnouncements.map((announcement: any) => (
              <div key={announcement.id} onClick={() => goToTab("announcements")} className="cursor-pointer">
                <Card className={`rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] ${!announcement.is_read ? "bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20" : ""}`}>
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-2 shrink-0 ${announcement.priority === "urgent" ? "bg-red-100" : "bg-muted"}`}>
                        {announcement.priority === "urgent" ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Megaphone className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{announcement.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{announcement.content}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

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
