import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useEventTickets } from "@/hooks/useEventTickets";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

export default function EventRegistration() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { createRegistration, myTickets } = useEventTickets();
  
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [formData, setFormData] = useState({
    name: profile?.full_name || "",
    email: "",
    phone: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  
  const [event, setEvent] = useState<any>(null);
  const [church, setChurch] = useState<any>(null);

  useState(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      const { data } = await supabase
        .from("ministry_events")
        .select("*")
        .eq("id", eventId)
        .single();
      setEvent(data);
      
      if (data?.church_id) {
        const { data: churchData } = await supabase
          .from("churches")
          .select("*")
          .eq("id", data.church_id)
          .single();
        setChurch(churchData);
      }
    };
    fetchEvent();
  });

  if (!eventId) {
    return (
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Evento não encontrado</p>
            <Button onClick={() => navigate("/portal/events")} className="mt-4">
              Voltar aos Eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!church?.id) {
      toast.error("Igreja não encontrada");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createRegistration({
        event_id: eventId,
        church_id: church.id,
        profile_id: profile?.id,
        attendee_name: formData.name,
        attendee_email: formData.email,
        attendee_phone: formData.phone,
        notes: formData.notes,
      });

      setRegistrationId(result.id);
      
      if (event.is_paid_event && event.ticket_price > 0) {
        setStep("payment");
        toast.success("Inscrição realizada! Complete o pagamento para confirmar.");
      } else {
        setStep("success");
        toast.success("Inscrição confirmada!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar inscrição");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPix = () => {
    if (church?.pix_key) {
      navigator.clipboard.writeText(church.pix_key);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!registrationId) return;
    
    const { updatePaymentStatus } = useEventTickets();
    try {
      await updatePaymentStatus({
        registrationId,
        status: "paid",
      });
      setStep("success");
      toast.success("Pagamento confirmado!");
    } catch (error) {
      toast.error("Erro ao confirmar pagamento");
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {step === "form" && event && (
        <>
          <div>
            <h1 className="text-2xl font-bold">Inscrição</h1>
            <p className="text-muted-foreground">Preencha seus dados para se inscrever</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              <CardDescription>
                {format(parseISO(event.start_datetime), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                {" • "}
                {format(parseISO(event.start_datetime), "HH:mm")}
              </CardDescription>
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {event.is_paid_event && event.ticket_price > 0 && (
                <div className="bg-primary/5 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Valor do ingresso</span>
                    <span className="text-2xl font-bold">
                      R$ {event.ticket_price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pagamento via PIX após a inscrição
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Alguma informação adicional?"
                    className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Processando..." : 
                   event.is_paid_event ? "Continuar para Pagamento" : "Confirmar Inscrição"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {step === "payment" && event && (
        <>
          <div>
            <h1 className="text-2xl font-bold">Pagamento</h1>
            <p className="text-muted-foreground">Escaneie o QR Code ou copie a chave PIX</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pagamento via PIX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Importante</p>
                    <p className="text-sm text-yellow-700">
                      O QR Code e a chave PIX são gerados automaticamente. Após realizar o pagamento, 
                      um responsável confirmará sua inscrição em até 24 horas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground mb-4">Valor a pagar</p>
                <p className="text-4xl font-bold text-primary">
                  R$ {event.ticket_price?.toFixed(2).replace(".", ",")}
                </p>
                <Badge className="mt-2">
                 PIX Copy & Paste
                </Badge>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Chave PIX (CNPJ/E-mail/Telefone)
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={church?.pix_key || ""}
                    readOnly
                    className="font-mono text-center"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyPix}>
                    {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {church?.pix_qr_image_url && (
                <div className="flex justify-center">
                  <img 
                    src={church.pix_qr_image_url} 
                    alt="PIX QR Code" 
                    className="max-w-[200px] rounded-lg border"
                  />
                </div>
              )}

              <div className="pt-4 border-t space-y-3">
                <p className="text-sm text-muted-foreground">
                  Dados para transferência:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {church?.bank_name && (
                    <>
                      <span className="text-muted-foreground">Banco:</span>
                      <span>{church.bank_name}</span>
                    </>
                  )}
                  {church?.bank_agency && (
                    <>
                      <span className="text-muted-foreground">Agência:</span>
                      <span>{church.bank_agency}</span>
                    </>
                  )}
                  {church?.bank_account && (
                    <>
                      <span className="text-muted-foreground">Conta:</span>
                      <span>{church.bank_account}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setStep("success")}
                >
                  Já fiz o pagamento
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate("/portal/my-tickets")}
                >
                  Ver meus ingressos
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === "success" && (
        <>
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-600">Inscrição Realizada!</h1>
            <p className="text-muted-foreground mt-2">
              {event.is_paid_event 
                ? "Aguarde a confirmação do pagamento para acessar seu ingresso."
                : "Sua inscrição foi confirmada!"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span>
                  {format(parseISO(event.start_datetime), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span>{format(parseISO(event.start_datetime), "HH:mm")}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate("/portal/events")}
            >
              Ver outros eventos
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate("/portal/my-tickets")}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Meus Ingressos
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
