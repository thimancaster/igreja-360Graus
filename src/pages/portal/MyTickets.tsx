import { useState } from "react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TicketCard } from "@/components/events/TicketCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Calendar, Clock, MapPin, QrCode } from "lucide-react";
import { useEventTickets } from "@/hooks/useEventTickets";
import type { EventRegistrationExtended } from "@/types/event-checkin";

export default function MyTickets() {
  const { myTickets } = useEventTickets();
  const [selectedTicket, setSelectedTicket] = useState<EventRegistrationExtended | null>(null);

  if (myTickets.isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Ingressos</h1>
          <p className="text-muted-foreground">Gerencie seus ingressos para eventos</p>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  const tickets = myTickets.data || [];
  
  const upcomingTickets = tickets.filter(t => {
    const eventDate = t.event?.start_datetime;
    return eventDate && !isPast(parseISO(eventDate));
  });

  const pastTickets = tickets.filter(t => {
    const eventDate = t.event?.start_datetime;
    return eventDate && isPast(parseISO(eventDate));
  });

  const paidTickets = tickets.filter(t => 
    t.payment_status === "paid" || t.payment_status === "free"
  );

  const pendingTickets = tickets.filter(t => 
    t.payment_status === "pending" || t.ticket_status === "pending_payment"
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Ingressos</h1>
          <p className="text-muted-foreground">Gerencie seus ingressos para eventos</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {tickets.length} ingresso{tickets.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          icon={<Ticket className="w-5 h-5" />}
          label="Total"
          value={tickets.length}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          icon={<Calendar className="w-5 h-5" />}
          label="Próximos"
          value={upcomingTickets.length}
          color="bg-green-50 text-green-600"
        />
        <StatCard 
          icon={<QrCode className="w-5 h-5" />}
          label="Pendentes"
          value={pendingTickets.length}
          color="bg-yellow-50 text-yellow-600"
        />
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Próximos ({upcomingTickets.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Confirmados ({paidTickets.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({pendingTickets.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Anteriores ({pastTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingTickets.length === 0 ? (
            <EmptyState message="Você não tem ingressos para eventos futuros" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingTickets.map(ticket => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paid">
          {paidTickets.length === 0 ? (
            <EmptyState message="Nenhum ingresso confirmado ainda" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {paidTickets.map(ticket => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingTickets.length === 0 ? (
            <EmptyState message="Nenhum pagamento pendente" />
          ) : (
            <div className="space-y-4">
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-4">
                  <p className="text-sm text-yellow-800">
                    Você tem {pendingTickets.length} ingresso(s) pendente(s) de pagamento. 
                    Apresente o QR Code no evento para realizar o check-in após confirmação do pagamento.
                  </p>
                </CardContent>
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                {pendingTickets.map(ticket => (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket}
                    onClick={() => setSelectedTicket(ticket)}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastTickets.length === 0 ? (
            <EmptyState message="Nenhum ingresso de eventos anteriores" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pastTickets.map(ticket => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedTicket && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTicket(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <TicketCard ticket={selectedTicket} />
            <button 
              className="w-full mt-4 p-2 bg-muted rounded-lg text-sm"
              onClick={() => setSelectedTicket(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
