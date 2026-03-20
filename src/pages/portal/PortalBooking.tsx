import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, CheckCircle2, Clock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30",
];

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  },
};

export default function PortalBooking() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [pastorName, setPastorName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");

  // Fetch available pastors from members
  const { data: pastors, isLoading: pastorsLoading } = useQuery({
    queryKey: ["portal-pastors", profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return [];
      const { data } = await supabase
        .from("members")
        .select("id, full_name")
        .eq("church_id", profile.church_id)
        .eq("status", "active")
        .or("profession.ilike.%pastor%,notes.ilike.%pastor%,leadership_notes.ilike.%pastor%")
        .order("full_name");
      return data || [];
    },
    enabled: !!profile?.church_id,
  });

  // Fetch my appointments
  const { data: myAppointments, isLoading: apptLoading } = useQuery({
    queryKey: ["portal-my-appointments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("pastoral_appointments")
        .select("*")
        .eq("member_profile_id", profile.id)
        .order("appointment_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const createAppointment = useMutation({
    mutationFn: async () => {
      if (!profile?.church_id || !profile?.id) throw new Error("Sem dados do perfil");
      const { error } = await supabase.from("pastoral_appointments").insert({
        church_id: profile.church_id,
        member_profile_id: profile.id,
        pastor_name: pastorName,
        appointment_date: date,
        appointment_time: time,
        reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento solicitado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["portal-my-appointments"] });
      setPastorName("");
      setDate("");
      setTime("");
      setReason("");
    },
    onError: (err: any) => {
      toast.error("Erro ao agendar: " + err.message);
    },
  });

  const canSubmit = pastorName && date && time;

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", variant: "outline" },
    confirmed: { label: "Confirmado", variant: "default" },
    cancelled: { label: "Cancelado", variant: "destructive" },
    completed: { label: "Realizado", variant: "secondary" },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 space-y-5 p-4 max-w-2xl mx-auto w-full pb-24 lg:pb-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <CalendarClock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Agendar Atendimento</h1>
            <p className="text-sm text-muted-foreground">Secretaria e pastores</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-4">
        {/* Booking Form */}
        <motion.div variants={stagger.item}>
          <Card className="rounded-2xl border-0 shadow-md">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label>Com quem deseja falar?</Label>
                {pastors && pastors.length > 0 ? (
                  <Select value={pastorName} onValueChange={setPastorName}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione um pastor" />
                    </SelectTrigger>
                    <SelectContent>
                      {pastors.map((p: any) => (
                        <SelectItem key={p.id} value={p.full_name}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Secretaria">Secretaria da Igreja</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Nome do pastor ou secretaria"
                    value={pastorName}
                    onChange={(e) => setPastorName(e.target.value)}
                    className="rounded-xl"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo (opcional)</Label>
                <Textarea
                  placeholder="Descreva brevemente o motivo do agendamento..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <Button
                className="w-full rounded-xl h-11 gap-2 active:scale-[0.97] transition-transform"
                disabled={!canSubmit || createAppointment.isPending}
                onClick={() => createAppointment.mutate()}
              >
                <CalendarClock className="h-4 w-4" />
                {createAppointment.isPending ? "Agendando..." : "Solicitar Agendamento"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Appointments */}
        <motion.div variants={stagger.item}>
          <div className="space-y-3">
            <h2 className="font-bold text-base">Meus Agendamentos</h2>
            {apptLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : myAppointments && myAppointments.length > 0 ? (
              <div className="space-y-2">
                {myAppointments.map((appt: any) => {
                  const st = statusLabels[appt.status] || statusLabels.pending;
                  return (
                    <Card key={appt.id} className="rounded-xl border-0 shadow-sm">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{appt.pastor_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(appt.appointment_date + "T00:00:00"), "dd/MM/yyyy")} às {appt.appointment_time}
                          </p>
                        </div>
                        <Badge variant={st.variant} className="text-xs shrink-0">{st.label}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="rounded-xl border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">Nenhum agendamento realizado.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
