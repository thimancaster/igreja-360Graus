import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Mail,
  Phone
} from "lucide-react";
import { useEventWaitlist } from "@/hooks/useEventWaitlist";
import { toast } from "sonner";

interface WaitlistPanelProps {
  eventId: string;
  eventTitle?: string;
}

export function WaitlistPanel({ eventId, eventTitle }: WaitlistPanelProps) {
  const { waitlist, isLoading, addToWaitlist, removeFromWaitlist, convertToRegistration, refetch } = useEventWaitlist(eventId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: "", email: "", phone: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const handleAdd = async () => {
    if (!newEntry.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    try {
      await addToWaitlist.mutateAsync({
        eventId,
        attendeeName: newEntry.name,
        attendeeEmail: newEntry.email || undefined,
        attendeePhone: newEntry.phone || undefined,
      });
      setNewEntry({ name: "", email: "", phone: "" });
      setAddDialogOpen(false);
    } catch (error) {
      // erro tratado no hook
    }
  };

  const filteredWaitlist = waitlist.filter(entry => 
    entry.attendee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.attendee_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge className="bg-amber-500">Aguardando</Badge>;
      case "notified":
        return <Badge className="bg-blue-500">Notificado</Badge>;
      case "converted":
        return <Badge className="bg-green-500">Convertido</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando lista de espera...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lista de Espera
            </CardTitle>
            <CardDescription>
              {waitlist.filter(e => e.status === "waiting").length} pessoa(s) aguardando
            </CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar na lista de espera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {filteredWaitlist.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum participante na lista de espera</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWaitlist.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{entry.attendee_name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {entry.attendee_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {entry.attendee_email}
                        </span>
                      )}
                      {entry.attendee_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {entry.attendee_phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(entry.status)}
                  {entry.status === "waiting" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => convertToRegistration.mutate(entry.id)}
                        disabled={convertToRegistration.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Converter
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromWaitlist.mutate(entry.id)}
                        disabled={removeFromWaitlist.isPending}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
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
            <DialogTitle>Adicionar à Lista de Espera</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                placeholder="Nome completo"
                value={newEntry.name}
                onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={newEntry.email}
                onChange={(e) => setNewEntry({ ...newEntry, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <Input
                placeholder="(11) 99999-9999"
                value={newEntry.phone}
                onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={addToWaitlist.isPending}>
              Adicionar à Lista de Espera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}