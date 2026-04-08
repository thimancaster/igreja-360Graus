import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, List, QrCode, DollarSign, Users, Bell } from "lucide-react";
import { pageVariants, pageTransition } from "@/lib/pageAnimations";
import { EventDashboard } from "@/components/events/EventDashboard";
import { EventCalendar } from "@/components/events/EventCalendar";
import { EventList } from "@/components/events/EventList";
import { CheckinPanel } from "@/components/events/CheckinPanel";
import { WaitlistPanel } from "@/components/events/WaitlistPanel";
import { ReminderPanel } from "@/components/events/ReminderPanel";
import { Button } from "@/components/ui/button";

export default function Eventos() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId?: string }>();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="flex-1 space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">Gerencie todos os eventos da igreja</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Lista</span>
          </TabsTrigger>
          <TabsTrigger value="checkin" className="gap-2">
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Check-in</span>
          </TabsTrigger>
          <TabsTrigger value="waitlist" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Espera</span>
          </TabsTrigger>
          <TabsTrigger value="reminders" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Lembretes</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Pagamentos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><EventDashboard /></TabsContent>
        <TabsContent value="calendar"><EventCalendar /></TabsContent>
        <TabsContent value="list"><EventList /></TabsContent>
        <TabsContent value="checkin">
          <CheckinPanelSelect navigate={navigate} />
        </TabsContent>
        <TabsContent value="waitlist">
          <WaitlistPanelSelect />
        </TabsContent>
        <TabsContent value="reminders">
          <RemindersPanelSelect />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentPanelSelect navigate={navigate} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function CheckinPanelSelect({ navigate }: { navigate: (path: string) => void }) {
  const { data: events, isLoading } = useEventsList();

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Selecione um evento para fazer check-in</h3>
        <div className="space-y-2">
          {events?.filter(e => e.status === 'published').map(event => (
            <Button
              key={event.id}
              variant="outline"
              className="w-full justify-between text-left h-auto py-3"
              onClick={() => navigate(`/app/eventos/${event.id}/checkin`)}
            >
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.start_datetime).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <QrCode className="h-5 w-5 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WaitlistPanelSelect({ navigate }: { navigate: (path: string) => void }) {
  const { data: events, isLoading } = useEventsList();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = events?.find(e => e.id === selectedEventId);

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  const eventsWithWaitlist = events?.filter(e => e.enable_waitlist && e.max_capacity);

  if (selectedEventId && selectedEvent) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedEventId(null)}>
          ← Voltar para lista de eventos
        </Button>
        <WaitlistPanel eventId={selectedEventId} eventTitle={selectedEvent.title} />
      </div>
  );
}

function RemindersPanelSelect() {
  const { data: events, isLoading } = useEventsList();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = events?.find(e => e.id === selectedEventId);

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (selectedEventId && selectedEvent) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedEventId(null)}>
          ← Voltar para lista de eventos
        </Button>
        <ReminderPanel eventId={selectedEventId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Selecione um evento para gerenciar lembretes</h3>
        {events?.length === 0 ? (
          <p className="text-muted-foreground">Nenhum evento encontrado</p>
        ) : (
          <div className="space-y-2">
            {events?.map(event => (
              <Button
                key={event.id}
                variant="outline"
                className="w-full justify-between text-left h-auto py-3"
                onClick={() => setSelectedEventId(event.id)}
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.start_datetime).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Bell className="h-5 w-5 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Selecione um evento com lista de espera</h3>
        {eventsWithWaitlist?.length === 0 ? (
          <p className="text-muted-foreground">Nenhum evento com lista de espera ativa</p>
        ) : (
          <div className="space-y-2">
            {eventsWithWaitlist?.map(event => (
              <Button
                key={event.id}
                variant="outline"
                className="w-full justify-between text-left h-auto py-3"
                onClick={() => setSelectedEventId(event.id)}
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.max_capacity} vagas • {new Date(event.start_datetime).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WaitlistPanel } from "@/components/events/WaitlistPanel";

function useEventsList() {
  return useQuery({
    queryKey: ["events-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ministry_events")
        .select("id, title, start_datetime, status, is_paid_event, ticket_price")
        .order("start_datetime", { ascending: false })
        .limit(20);
      return data;
    },
  });
}

function PaymentPanelSelect({ navigate }: { navigate: (path: string) => void }) {
  const { data: events, isLoading } = useEventsList();

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  const paidEvents = events?.filter(e => e.is_paid_event && e.ticket_price > 0);

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Selecione um evento para gerenciar pagamentos</h3>
        {paidEvents?.length === 0 ? (
          <p className="text-muted-foreground">Nenhum evento pago encontrado</p>
        ) : (
          <div className="space-y-2">
            {paidEvents?.map(event => (
              <Button
                key={event.id}
                variant="outline"
                className="w-full justify-between text-left h-auto py-3"
                onClick={() => navigate(`/app/eventos/${event.id}/pagamentos`)}
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {event.ticket_price?.toFixed(2).replace(".", ",")} • {" "}
                    {new Date(event.start_datetime).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
