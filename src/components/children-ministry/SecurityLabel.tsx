import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, AlertTriangle, Camera, Star, Heart, Eye, Baby } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SecurityLabelProps {
  child: {
    full_name: string;
    classroom: string;
    birth_date: string;
    allergies?: string | null;
    medications?: string | null;
    special_needs?: string | null;
    image_consent?: boolean | null;
    photo_url?: string | null;
  };
  labelNumber: string;
  qrCode: string;
  eventName: string;
}

export function SecurityLabel({ child, labelNumber, qrCode, eventName }: SecurityLabelProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const age = differenceInYears(new Date(), new Date(child.birth_date));
  const securityCode = qrCode.slice(-8).toUpperCase();
  const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const indicators = [
    { show: !!child.allergies, icon: AlertTriangle, label: "Alergia", color: "bg-red-100 text-red-700 border-red-200" },
    { show: !!child.medications, icon: Heart, label: "Medicação", color: "bg-amber-100 text-amber-700 border-amber-200" },
    { show: !!child.special_needs, icon: Star, label: "N. Especial", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { show: !!child.image_consent, icon: Camera, label: "Foto OK", color: "bg-green-100 text-green-700 border-green-200" },
  ];

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !labelRef.current) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiqueta - ${child.full_name}</title>
        <style>
          @page { size: 10cm 6cm; margin: 0; }
          body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
          .label { width: 10cm; height: 6cm; padding: 0.4cm; box-sizing: border-box; border: 2px dashed #ccc; display: flex; flex-direction: column; gap: 0.2cm; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .name { font-size: 16pt; font-weight: 700; }
          .number { font-size: 24pt; font-weight: 900; color: #3b82f6; }
          .info { display: flex; gap: 0.5cm; font-size: 9pt; color: #555; }
          .indicators { display: flex; gap: 0.2cm; flex-wrap: wrap; }
          .indicator { padding: 2px 6px; border-radius: 4px; font-size: 7pt; font-weight: 600; border: 1px solid; }
          .ind-red { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
          .ind-amber { background: #fef3c7; color: #92400e; border-color: #fde68a; }
          .ind-blue { background: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
          .ind-green { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
          .security { font-size: 10pt; font-family: monospace; letter-spacing: 2px; text-align: center; padding: 0.2cm; background: #f1f5f9; border-radius: 4px; }
          .footer { display: flex; justify-content: space-between; font-size: 7pt; color: #999; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <span class="name">${child.full_name}</span>
            <span class="number">#${labelNumber}</span>
          </div>
          <div class="info">
            <span>🏫 ${child.classroom}</span>
            <span>🎂 ${age} anos</span>
            <span>📅 ${today}</span>
          </div>
          <div class="indicators">
            ${child.allergies ? '<span class="indicator ind-red">⚠️ ALERGIA</span>' : ''}
            ${child.medications ? '<span class="indicator ind-amber">💊 MEDICAÇÃO</span>' : ''}
            ${child.special_needs ? '<span class="indicator ind-blue">⭐ N. ESPECIAL</span>' : ''}
            ${child.image_consent ? '<span class="indicator ind-green">📸 FOTO OK</span>' : ''}
          </div>
          <div class="security">🔐 ${securityCode}</div>
          <div class="footer">
            <span>${eventName}</span>
            <span>Código de segurança - NÃO compartilhar</span>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div className="space-y-3">
      <div ref={labelRef} className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-4 bg-white dark:bg-card space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">{child.full_name}</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>🏫 {child.classroom}</span>
              <span>🎂 {age} anos</span>
              <span>📅 {today}</span>
            </div>
          </div>
          <div className="text-3xl font-black text-primary">#{labelNumber}</div>
        </div>

        {/* Indicators */}
        <div className="flex flex-wrap gap-1.5">
          {indicators.filter(i => i.show).map(({ icon: Icon, label, color }) => (
            <span key={label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>
              <Icon className="h-3 w-3" />
              {label}
            </span>
          ))}
        </div>

        {/* Security Code */}
        <div className="text-center py-2 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-0.5">Código de Segurança</p>
          <p className="font-mono font-bold text-lg tracking-[0.2em]">🔐 {securityCode}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{eventName}</span>
          <span>Código de segurança - NÃO compartilhar</span>
        </div>
      </div>

      <Button onClick={handlePrint} className="w-full gap-2" variant="outline">
        <Printer className="h-4 w-4" />
        Imprimir Etiqueta
      </Button>
    </div>
  );
}
