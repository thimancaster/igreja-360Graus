import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  QrCode, 
  Calendar, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { useEventTickets } from "@/hooks/useEventTickets";
import type { EventRegistrationExtended } from "@/types/event-checkin";

interface TicketCardProps {
  ticket: EventRegistrationExtended;
  showActions?: boolean;
  onClick?: () => void;
}

export function TicketCard({ ticket, showActions = true, onClick }: TicketCardProps) {
  const [qrData, setQrData] = useState<string>("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const { generateQRTicketData } = useEventTickets();

  const event = ticket.event;

  useEffect(() => {
    const generate = async () => {
      if (!qrData && ticket.ticket_number) {
        setIsGeneratingQR(true);
        try {
          const data = await generateQRTicketData(ticket);
          setQrData(data);
        } catch (error) {
          console.error("Error generating QR:", error);
        } finally {
          setIsGeneratingQR(false);
        }
      }
    };
    generate();
  }, [ticket, qrData, generateQRTicketData]);

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${ticket.id}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 400, 400);
        
        const link = document.createElement("a");
        link.download = `ingresso-${ticket.ticket_number}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const getStatusBadge = () => {
    const status = ticket.ticket_status || ticket.status;
    switch (status) {
      case "paid":
      case "checked_in":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Confirmado</Badge>;
      case "pending_payment":
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case "cancelled":
      case "refunded":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      case "checked_out":
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" /> Saída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className={`overflow-hidden ${onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}`} onClick={onClick}>
      <div className="bg-gradient-to-r from-primary/90 to-primary p-4 text-primary-foreground">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{event?.title || "Evento"}</h3>
            <p className="text-sm opacity-90">{ticket.ticket_number}</p>
          </div>
          {getStatusBadge()}
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{event?.start_datetime ? formatDate(event.start_datetime) : "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{event?.start_datetime ? formatTime(event.start_datetime) : "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{event?.location || "Local não informado"}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border">
            {isGeneratingQR ? (
              <div className="w-24 h-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : qrData ? (
              <>
                <QRCodeSVG 
                  id={`qr-${ticket.id}`}
                  value={qrData}
                  size={96}
                  level="H"
                  includeMargin
                />
                <p className="text-xs text-muted-foreground">QR Code do Ingresso</p>
              </>
            ) : (
              <QrCode className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
        </div>

        {ticket.attendee_name && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">Nome do Participante</p>
            <p className="font-medium">{ticket.attendee_name}</p>
          </div>
        )}

        {event?.is_paid_event && (
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="font-bold text-lg">
                {event.ticket_price 
                  ? `R$ ${event.ticket_price.toFixed(2).replace(".", ",")}`
                  : "Gratuito"}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-muted-foreground">Pagamento</span>
              <Badge variant={ticket.payment_status === "paid" ? "default" : "secondary"}>
                {ticket.payment_status === "paid" ? "Pago" : 
                 ticket.payment_status === "pending" ? "Pendente" : "Não requerido"}
              </Badge>
            </div>
          </div>
        )}

        {ticket.check_in_at && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">
                Check-in realizado em {new Date(ticket.check_in_at).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        )}

        {showActions && (
          <div className="pt-3 border-t flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleDownload}
              disabled={!qrData}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Ingresso
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
