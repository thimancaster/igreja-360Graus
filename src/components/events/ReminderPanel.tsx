import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Bell, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  ExternalLink
} from "lucide-react";
import { useEventReminders } from "@/hooks/useEventReminders";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReminderPanelProps {
  eventId: string;
}

export function ReminderPanel({ eventId }: ReminderPanelProps) {
  const { reminders, isLoading, createReminder, deleteReminder } = useEventReminders(eventId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    date: "",
    time: "09:00",
    message: ""
  });

  const handleAdd = async () => {
    if (!newReminder.date) {
      toast.error("Data é obrigatória");
      return;
    }
    try {
      const reminderDate = `${newReminder.date}T${newReminder.time}:00`;
      await createReminder.mutateAsync({
        eventId,
        reminderDate,
        message: newReminder.message || "Lembrete de evento",
      });
      setNewReminder({ date: "", time: "09:00", message: "" });
      setAddDialogOpen(false);
    } catch (error) {
      // erro tratado no hook
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando lembretes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Lembretes
            </CardTitle>
            <CardDescription>
              {reminders.length} lembrete(s) agendado(s)
            </CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lembrete
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum lembrete agendado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {format(parseISO(reminder.reminder_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {reminder.message && (
                      <p className="text-sm text-muted-foreground">{reminder.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={reminder.is_sent ? "default" : "secondary"}>
                    {reminder.is_sent ? "Enviado" : "Pendente"}
                  </Badge>
                  {!reminder.is_sent && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteReminder.mutate(reminder.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lembrete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={newReminder.date}
                onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Horário</label>
              <Input
                type="time"
                value={newReminder.time}
                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mensagem (opcional)</label>
              <Textarea
                placeholder="Mensagem do lembrete..."
                value={newReminder.message}
                onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={createReminder.isPending}>
              Criar Lembrete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function generateCalendarLink(
  title: string,
  startDate: string,
  endDate?: string,
  location?: string,
  description?: string
): string {
  const start = new Date(startDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = endDate ? new Date(endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : start;
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: description || '',
    location: location || '',
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}