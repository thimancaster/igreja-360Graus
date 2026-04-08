import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  DollarSign,
  Clock,
  Eye,
  ExternalLink
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function EventPayments() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ministry_events")
        .select("*, church:churches(name)")
        .eq("id", eventId)
        .single();
      return data;
    },
    enabled: !!eventId,
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["event-payments", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_registrations")
        .select(`
          *,
          event:ministry_events(title, start_datetime)
        `)
        .eq("event_id", eventId)
        .in("payment_status", ["pending", "paid"])
        .order("registered_at", { ascending: false });
      return data;
    },
    enabled: !!eventId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "paid" | "pending" }) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({
          payment_status: status,
          ticket_status: status === 'paid' ? 'paid' : 'pending_payment',
          payment_date: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-payments"] });
      toast.success("Pagamento atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar");
    },
  });

  const filteredPayments = payments.filter((p: any) => {
    const search = searchTerm.toLowerCase();
    return (
      p.attendee_name?.toLowerCase().includes(search) ||
      p.attendee_email?.toLowerCase().includes(search) ||
      p.ticket_number?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: payments.length,
    paid: payments.filter((p: any) => p.payment_status === "paid").length,
    pending: payments.filter((p: any) => p.payment_status === "pending").length,
    revenue: payments
      .filter((p: any) => p.payment_status === "paid")
      .reduce((sum: number, p: any) => sum + (p.payment_amount || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate("/app/eventos")} className="mb-2">
            Voltar aos Eventos
          </Button>
          <h1 className="text-2xl font-bold">Pagamentos - {event?.title}</h1>
          <p className="text-muted-foreground">
            Gerencie os pagamentos das inscrições neste evento
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold">
                  R$ {stats.revenue.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Pagamentos</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participante</TableHead>
                <TableHead>Ingresso</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum pagamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.attendee_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{payment.attendee_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.ticket_number}</Badge>
                    </TableCell>
                    <TableCell>
                      R$ {(payment.payment_amount || 0).toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.payment_status === "paid" ? "default" : "secondary"}>
                        {payment.payment_status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.registered_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {payment.payment_status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateMutation.mutate({ id: payment.id, status: "pending" })}
                              disabled={updateMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateMutation.mutate({ id: payment.id, status: "paid" })}
                              disabled={updateMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/portal/my-tickets`)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
