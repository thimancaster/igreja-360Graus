import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

type PaymentMethod = 'pix' | 'credit_card' | 'debit_card';
type Step = 'form' | 'payment' | 'processing' | 'success';

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export default function EventRegistration() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { createRegistration, updatePaymentStatus } = useEventTickets();
  
  const paymentStatus = searchParams.get('payment');
  
  const [step, setStep] = useState<Step>("form");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('pix');
  const [formData, setFormData] = useState({
    name: profile?.full_name || "",
    email: "",
    phone: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  
  const [event, setEvent] = useState<any>(null);
  const [church, setChurch] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  useState(() => {
    const fetchData = async () => {
      if (!eventId) return;
      
      const { data: eventData } = await supabase
        .from("ministry_events")
        .select("*")
        .eq("id", eventId)
        .single();
      setEvent(eventData);
      
      if (eventData?.church_id) {
        const { data: churchData } = await supabase
          .from("churches")
          .select("*")
          .eq("id", eventData.church_id)
          .single();
        setChurch(churchData);

        const { data: settings } = await (supabase
          .from("payment_settings" as any)
          .select("*")
          .eq("church_id", eventData.church_id)
          .eq("is_active", true)
          .maybeSingle() as any);
        setPaymentSettings(settings);
      }
    };
    fetchData();
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
        if (selectedPayment === 'pix' && !paymentSettings?.mercadopago_access_token) {
          setStep("payment");
        } else {
          setStep("processing");
          await createMercadoPagoPayment(result.id, event, formData);
        }
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

  const createMercadoPagoPayment = async (regId: string, evt: any, data: typeof formData) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('create-event-payment', {
        body: {
          registration_id: regId,
          event_id: evt.id,
          church_id: church.id,
          amount: evt.ticket_price,
          payment_method: selectedPayment,
          attendee_name: data.name,
          attendee_email: data.email,
        },
      });

      if (error) throw error;

      if (result.init_point) {
        setPaymentUrl(result.init_point);
        window.location.href = result.init_point;
      } else if (result.manual_payment) {
        setStep("payment");
        toast.info("Pagamento manual disponível");
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setStep("payment");
      toast.error("Erro ao processar pagamento. Use o pagamento manual.");
    }
  };

  const handleCopyPix = () => {
    if (church?.pix_key) {
      navigator.clipboard.writeText(church.pix_key);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    }
  };

  const handleManualConfirm = async () => {
    if (!registrationId) return;
    try {
      await updatePaymentStatus({ registrationId, status: "pending", paymentId: "manual-" + Date.now() });
      setStep("success");
      toast.success("Pagamento registrado! Aguarde confirmação.");
    } catch (error) {
      toast.error("Erro ao registrar");
    }
  };

  const paymentOptions: PaymentOption[] = [
    {
      id: 'pix',
      label: 'PIX',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Transferência instantânea',
    },
    {
      id: 'credit_card',
      label: 'Cartão de Crédito',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Parcele em até 12x',
    },
    {
      id: 'debit_card',
      label: 'Cartão de Débito',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Débito imediato',
    },
  ];

  const hasMercadoPago = paymentSettings?.mercadopago_access_token;

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
            <p className="text-muted-foreground">Preencha seus dados para se'inscrire</p>
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
                </div>
              )}

              {event.is_paid_event && event.ticket_price > 0 && (
                <div className="mb-6">
                  <Label className="text-base">Forma de pagamento</Label>
                  <RadioGroup 
                    value={selectedPayment} 
                    onValueChange={(v) => setSelectedPayment(v as PaymentMethod)}
                    className="mt-2 space-y-2"
                  >
                    {paymentOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                          {option.icon}
                          <div>
                            <p className="font-medium">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {!hasMercadoPago && (
                    <p className="text-xs text-yellow-600 mt-2">
                      * PIX manual. O pagamento será confirmado pela igreja.
                    </p>
                  )}
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
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                  ) : event.is_paid_event ? (
                    `Pagar R$ ${event.ticket_price?.toFixed(2).replace(".", ",")}`
                  ) : (
                    "Confirmar Inscrição"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {step === "processing" && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <h2 className="text-xl font-bold">Processando pagamento...</h2>
            <p className="text-muted-foreground">Você será redirecionado para o pagamento.</p>
          </CardContent>
        </Card>
      )}

      {step === "payment" && event && (
        <>
          <div>
            <h1 className="text-2xl font-bold">Pagamento</h1>
            <p className="text-muted-foreground">
              {hasMercadoPago 
                ? "Escaneie o QR Code ou copie a chave PIX"
                : "Faça o transferência e envie o comprovante"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pagamento via {selectedPayment === 'pix' ? 'PIX' : 'Cartão'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasMercadoPago ? (
                <>
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">Valor a pagar</p>
                    <p className="text-4xl font-bold text-primary">
                      R$ {event.ticket_price?.toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  {paymentUrl && (
                    <Button className="w-full" onClick={() => window.location.href = paymentUrl}>
                      <QrCode className="w-4 h-4 mr-2" />
                      Ir para Pagamento
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Importante</p>
                        <p className="text-sm text-yellow-700">
                          Após realizar o pagamento, um responsável confirmará sua inscrição em até 24 horas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">Valor a pagar</p>
                    <p className="text-4xl font-bold text-primary">
                      R$ {event.ticket_price?.toFixed(2).replace(".", ",")}
                    </p>
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
                </>
              )}

              <div className="space-y-3 pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleManualConfirm}
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
