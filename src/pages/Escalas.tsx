import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Bell, CalendarOff, ArrowLeftRight, Send } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useVolunteerStatus } from "@/hooks/useVolunteerStatus";
import { useDepartmentVolunteers } from "@/hooks/useDepartmentVolunteers";
import { useVolunteerSchedules, VolunteerSchedule } from "@/hooks/useVolunteerSchedules";
import { useVolunteerAnnouncements } from "@/hooks/useVolunteerAnnouncements";
import {
  DepartmentSelector,
  ScheduleCalendar,
  ScheduleDialog,
  VolunteerList,
  InviteVolunteerDialog,
  MySchedulesCard,
  VolunteerAnnouncementsPanel,
  VolunteerAvailabilityManager,
  ScheduleSwapManager,
  TeamAvailabilityCalendar,
} from "@/components/schedules";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function Escalas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isPastor, isTesoureiro, isLider, isLoading: roleLoading } = useRole();
  const { isVolunteer, hasPendingInvites, activeMinistries, isLoading: statusLoading } = useVolunteerStatus();

  const [selectedMinistry, setSelectedMinistry] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<VolunteerSchedule | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // State for volunteer swap flow
  const [selectedScheduleForSwap, setSelectedScheduleForSwap] = useState<VolunteerSchedule | null>(null);

  // State for new announcement dialog
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementPinned, setAnnouncementPinned] = useState(false);

  // Get current user's volunteer ID
  const { data: myVolunteerData } = useQuery({
    queryKey: ["my-volunteer-id", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("department_volunteers")
        .select("id, full_name")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Determine if user can edit schedules
  const canEdit = isAdmin || isPastor || isLider;
  const canViewAll = isAdmin || isPastor || isTesoureiro;

  // Fetch data for selected ministry
  const {
    volunteers,
    isLoading: volunteersLoading,
    inviteVolunteer,
    isInviting,
    deactivateVolunteer,
    reactivateVolunteer,
  } = useDepartmentVolunteers(selectedMinistry);

  const {
    schedules,
    schedulesByDate,
    mySchedules,
    isLoading: schedulesLoading,
    mySchedulesLoading,
    createSchedule,
    isCreating,
    updateSchedule,
    isUpdating,
    deleteSchedule,
    confirmSchedule,
    isConfirming,
    hasConflict,
  } = useVolunteerSchedules(selectedMinistry, currentMonth);

  const {
    myAnnouncements,
    unreadCount,
    myAnnouncementsLoading,
    markAsRead,
    createAnnouncement,
    isCreating: isCreatingAnnouncement,
  } = useVolunteerAnnouncements();

  // Redirect to accept term if has pending invites
  useEffect(() => {
    if (!statusLoading && hasPendingInvites) {
      navigate("/app/voluntario/aceitar-termo");
    }
  }, [statusLoading, hasPendingInvites, navigate]);

  // Auto-select first ministry for all users
  useEffect(() => {
    if (!selectedMinistry && activeMinistries.length > 0) {
      setSelectedMinistry(activeMinistries[0].ministry_id);
    }
  }, [activeMinistries, selectedMinistry]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
    setShowScheduleDialog(true);
  };

  const handleScheduleClick = (schedule: VolunteerSchedule) => {
    if (canEdit) {
      setSelectedSchedule(schedule);
      setSelectedDate(new Date(schedule.schedule_date));
      setShowScheduleDialog(true);
    }
  };

  // When a volunteer clicks "Trocar" on one of their schedules
  const handleRequestSwap = (schedule: any) => {
    // Cast to VolunteerSchedule for the SwapManager
    setSelectedScheduleForSwap(schedule as VolunteerSchedule);
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim() || !selectedMinistry) return;
    try {
      await createAnnouncement({
        ministry_id: selectedMinistry,
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        is_published: announcementPinned, // publish immediately when pinned; else save as draft
      });
      setShowAnnouncementDialog(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementPinned(false);
    } catch {
      // Error handled by hook
    }
  };

  if (roleLoading || statusLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  // Check if user has access
  if (!canViewAll && !isVolunteer && !isLider) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <Calendar className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Acesso Restrito</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Você não tem acesso às escalas de voluntários.
            Aguarde um convite de algum líder de ministério para participar.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Escalas de Voluntários</h1>
            <p className="text-muted-foreground">
              {canEdit ? "Gerencie as escalas do seu ministério" : "Visualize suas escalas"}
            </p>
          </div>

          {(canViewAll || isLider) && (
            <DepartmentSelector
              value={selectedMinistry}
              onValueChange={setSelectedMinistry}
            />
          )}
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendário
            </TabsTrigger>
            {canEdit && selectedMinistry && (
              <TabsTrigger value="volunteers" className="gap-2">
                <Users className="h-4 w-4" />
                Voluntários
              </TabsTrigger>
            )}
            <TabsTrigger value="my-schedules" className="gap-2">
              <Calendar className="h-4 w-4" />
              Minhas Escalas
            </TabsTrigger>
            {canEdit && selectedMinistry && (
              <TabsTrigger value="team-availability" className="gap-2">
                <CalendarOff className="h-4 w-4" />
                Disponibilidade
              </TabsTrigger>
            )}
            <TabsTrigger value="announcements" className="gap-2 relative">
              <Bell className="h-4 w-4" />
              Comunicados
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── TAB: Calendário ── */}
          <TabsContent value="calendar" className="space-y-4">
            {selectedMinistry ? (
              <ScheduleCalendar
                schedules={schedules}
                schedulesByDate={schedulesByDate}
                isLoading={schedulesLoading}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onDayClick={canEdit ? handleDayClick : undefined}
                onScheduleClick={handleScheduleClick}
                canEdit={canEdit}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um ministério para ver as escalas</p>
              </div>
            )}
          </TabsContent>

          {/* ── TAB: Voluntários ── */}
          {canEdit && selectedMinistry && (
            <TabsContent value="volunteers">
              <VolunteerList
                volunteers={volunteers}
                isLoading={volunteersLoading}
                onInvite={() => setShowInviteDialog(true)}
                onDeactivate={deactivateVolunteer}
                onReactivate={reactivateVolunteer}
                canEdit={canEdit}
              />
            </TabsContent>
          )}

          {/* ── TAB: Minhas Escalas ── */}
          <TabsContent value="my-schedules" className="space-y-4">
            <MySchedulesCard
              schedules={mySchedules}
              isLoading={mySchedulesLoading}
              onConfirm={confirmSchedule}
              isConfirming={isConfirming}
              onRequestSwap={handleRequestSwap}
            />

            {/* Availability & Swaps for volunteers */}
            {myVolunteerData && (
              <div className="grid gap-4 md:grid-cols-2">
                <VolunteerAvailabilityManager
                  volunteerId={myVolunteerData.id}
                  volunteerName={myVolunteerData.full_name}
                />
                <ScheduleSwapManager
                  volunteerId={myVolunteerData.id}
                  schedule={selectedScheduleForSwap}
                />
              </div>
            )}
          </TabsContent>

          {/* ── TAB: Disponibilidade da Equipe (líderes) ── */}
          {canEdit && selectedMinistry && (
            <TabsContent value="team-availability" className="space-y-4">
              <TeamAvailabilityCalendar ministryId={selectedMinistry} />
            </TabsContent>
          )}

          {/* ── TAB: Comunicados ── */}
          <TabsContent value="announcements" className="space-y-4">
            {canEdit && selectedMinistry && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowAnnouncementDialog(true)}
                >
                  <Send className="h-4 w-4" />
                  Novo Comunicado
                </Button>
              </div>
            )}
            <VolunteerAnnouncementsPanel
              announcements={myAnnouncements}
              isLoading={myAnnouncementsLoading}
              onMarkAsRead={markAsRead}
              showMinistryName
            />
          </TabsContent>
        </Tabs>

        {/* ── Schedule Dialog ── */}
        {selectedMinistry && (
          <ScheduleDialog
            open={showScheduleDialog}
            onOpenChange={setShowScheduleDialog}
            volunteers={volunteers}
            selectedDate={selectedDate}
            selectedSchedule={selectedSchedule}
            ministryId={selectedMinistry}
            onSave={createSchedule}
            onUpdate={updateSchedule}
            onDelete={deleteSchedule}
            isLoading={isCreating || isUpdating}
            hasConflict={hasConflict}
          />
        )}

        {/* ── Invite Dialog ── */}
        {selectedMinistry && (
          <InviteVolunteerDialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            ministryId={selectedMinistry}
            onInvite={inviteVolunteer}
            isLoading={isInviting}
          />
        )}

        {/* ── New Announcement Dialog ── */}
        <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Novo Comunicado</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="ann-title">Título</Label>
                <Input
                  id="ann-title"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Ex: Mudança de horário no sábado"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ann-content">Mensagem</Label>
                <Textarea
                  id="ann-content"
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Escreva o comunicado para os voluntários do ministério..."
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="ann-pinned"
                  checked={announcementPinned}
                  onCheckedChange={setAnnouncementPinned}
                />
                <Label htmlFor="ann-pinned" className="cursor-pointer">
                  Fixar comunicado no topo
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendAnnouncement}
                disabled={isCreatingAnnouncement || !announcementTitle.trim() || !announcementContent.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
