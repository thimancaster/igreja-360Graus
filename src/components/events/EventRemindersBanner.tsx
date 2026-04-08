import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Calendar, 
  Clock, 
  MapPin,
  ChevronRight,
  Plus,
  AlertCircle
} from "lucide-react";
import { useUpcomingEventReminders } from "@/hooks/useEventReminders";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function EventRemindersBanner() {
  const { data: reminders, isLoading } = useUpcomingEventReminders();

  if (isLoading || !reminders?.length) return null;

  return (
    <Card className="border-blue-500 bg-blue-50/50">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-sm font-semibold text-blue-800">
              Lembretes de Eventos Próximos
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {reminders.length} lembrete{reminders.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4 space-y-2">
        {reminders.slice(0, 3).map((reminder) => {
          const daysUntil = differenceInDays(parseISO(reminder.reminder_date), new Date());
          return (
            <div 
              key={reminder.id} 
              className="flex items-center justify-between bg-white p-2 rounded border border-blue-100"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{reminder.event?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(reminder.reminder_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <Badge variant={daysUntil <= 1 ? "destructive" : "outline"}>
                {daysUntil === 0 ? "Hoje" : daysUntil === 1 ? "Amanhã" : `${daysUntil} dias`}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function EventRemindersInline() {
  const { data: reminders, isLoading } = useUpcomingEventReminders();

  if (isLoading || !reminders?.length) return null;

  return (
    <div className="space-y-2">
      {reminders.map((reminder) => {
        const daysUntil = differenceInDays(parseISO(reminder.reminder_date), new Date());
        return (
          <div 
            key={reminder.id} 
            className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-100"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="text-sm">{reminder.event?.title}</span>
              <span className="text-xs text-muted-foreground">
                {format(parseISO(reminder.reminder_date), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            </div>
            <Badge variant={daysUntil <= 1 ? "destructive" : "secondary"} className="text-xs">
              {daysUntil === 0 ? "Hoje" : daysUntil === 1 ? "Amanhã" : `${daysUntil}d`}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}