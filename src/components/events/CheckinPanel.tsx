import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  DollarSign,
  Clock,
  Download,
  Search
} from "lucide-react";
import { QRScanner } from "./QRScanner";
import { useEventTickets } from "@/hooks/useEventTickets";
import type { EventRegistrationExtended, EventCheckinStats } from "@/types/event-checkin";
import { Input } from "@/components/ui/input";

interface CheckinPanelProps {
  eventId: string;
}

export function CheckinPanel({ eventId }: CheckinPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { ticketsByEvent, checkinStats } = useEventTickets();
  
  const { data: tickets = [], isLoading: isLoadingTickets } = ticketsByEvent(eventId);
  const { data: stats, isLoading: isLoadingStats } = checkinStats(eventId);
  
  const filteredTickets = tickets.filter(ticket => {
    const search = searchTerm.toLowerCase();
    return (
      ticket.attendee_name?.toLowerCase().includes(search) ||
      ticket.ticket_number?.toLowerCase().includes(search) ||
      ticket.attendee_email?.toLowerCase().includes(search)
    );
  });

  const handleExportCSV = () => {
    const headers = ["Nome", "Email", "Telefone", "Ingresso", "Status", "Check-in", "Check-out", "Pagamento"];
    const rows = tickets.map(t => [
      t.attendee_name || "",
      t.attendee_email || "",
      t.attendee_phone || "",
      t.ticket_number || "",
      t.ticket_status || t.status,
      t.check_in_at ? new Date(t.check_in_at).toLocaleString("pt-BR") : "",
      t.check_out_at ? new Date(t.check_out_at).toLocaleString("pt-BR") : "",
      t.payment_status,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkin-${eventId}.csv`;
    a.click();
  };

  const getStatusBadge = (ticket: EventRegistrationExtended) => {
    const status = ticket.ticket_status || ticket.status;
    const isPaid = ticket.payment_status === "paid" || ticket.payment_status === "free";
    
    if (ticket.check_in_at && ticket.check_out_at) {
      return <Badge className="bg-blue-500">Finalizado</Badge>;
    }
    if (ticket.check_in_at) {
      return <Badge className="bg-green-500">Presente</Badge>;
    }
    if (!isPaid) {
      return <Badge className="bg-yellow-500">Pendente</Badge>;
    }
    return <Badge variant="secondary">Aguardando</Badge>;
  };

  if (isLoadingStats) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Users className="w-5 h-5" />}
          label="Total Inscritos"
          value={stats?.total_registrations || 0}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          icon={<UserCheck className="w-5 h-5" />}
          label="Check-in"
          value={stats?.checked_in || 0}
          color="bg-green-50 text-green-600"
        />
        <StatCard 
          icon={<Clock className="w-5 h-5" />}
          label="Pendentes"
          value={stats?.paid_not_checked_in || 0}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard 
          icon={<DollarSign className="w-5 h-5" />}
          label="Receita"
          value={`R$ ${((stats?.collected || 0)).toFixed(2)}`}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="presentes">
            Presentes ({stats?.checked_in || 0})
          </TabsTrigger>
          <TabsTrigger value="todos">
            Todos ({stats?.total_registrations || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <QRScanner eventId={eventId} mode="checkin" />
            <QRScanner eventId={eventId} mode="checkout" />
          </div>
        </TabsContent>

        <TabsContent value="presentes">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Lista de Presentes</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tickets.filter(t => t.check_in_at).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum check-in realizado ainda
                  </p>
                ) : (
                  tickets
                    .filter(t => t.check_in_at)
                    .map(ticket => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{ticket.attendee_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.ticket_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {ticket.check_in_at && new Date(ticket.check_in_at).toLocaleTimeString("pt-BR")}
                          </p>
                          {ticket.check_out_at && (
                            <p className="text-xs text-green-600">
                              Saída: {new Date(ticket.check_out_at).toLocaleTimeString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todos">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, ingresso ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoadingTickets ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma inscrição encontrada
                  </p>
                ) : (
                  filteredTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{ticket.attendee_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticket.attendee_email || ticket.ticket_number}
                        </p>
                      </div>
                      {getStatusBadge(ticket)}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
  value: string | number;
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
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
