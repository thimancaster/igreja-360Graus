import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  CameraOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  History,
  UserCheck
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useEventTickets } from "@/hooks/useEventTickets";
import type { CheckinResult } from "@/types/event-checkin";

interface QRScannerProps {
  eventId: string;
  mode: "checkin" | "checkout";
  onResult?: (result: CheckinResult) => void;
}

export function QRScanner({ eventId, mode, onResult }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null);
  const [history, setHistory] = useState<CheckinResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { checkIn, checkOut, isCheckingIn, isCheckingOut } = useEventTickets();

  const handleScan = useCallback(async (decodedText: string) => {
    try {
      const deviceInfo = navigator.userAgent;
      let result: CheckinResult;

      if (mode === "checkin") {
        result = await checkIn({ qrData: decodedText, eventId, deviceInfo });
      } else {
        result = await checkOut({ qrData: decodedText, eventId, deviceInfo });
      }

      setLastResult(result);
      setHistory(prev => [result, ...prev.slice(0, 49)]);
      onResult?.(result);

      if (result.success) {
        setTimeout(() => setLastResult(null), 3000);
      }
    } catch (err) {
      setLastResult({
        success: false,
        error: "Erro ao processar QR Code",
        code: "PROCESS_ERROR",
      });
    }
  }, [mode, eventId, checkIn, checkOut, onResult]);

  const startScanning = useCallback(async () => {
    setError(null);
    setIsScanning(true);

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        handleScan,
        () => {}
      );
    } catch (err: any) {
      setError(err.message || "Não foi possível acessar a câmera");
      setIsScanning(false);
      
      if (err.name === "NotAllowedError") {
        setError("Permissão de câmera negada. Por favor, permita o acesso à câmera.");
      }
    }
  }, [handleScan]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualInput = async () => {
    const ticketNumber = prompt("Digite o número do ingresso:");
    if (!ticketNumber) return;

    const qrData = btoa(JSON.stringify({
      id: ticketNumber.split("-").pop() || ticketNumber,
      ticket: ticketNumber,
      event: eventId,
      church: "",
      ts: Date.now(),
      sig: "",
    }));

    await handleScan(qrData);
  };

  const getResultIcon = (result: CheckinResult) => {
    if (result.success) {
      return <CheckCircle className="w-16 h-16 text-green-500" />;
    }
    switch (result.code) {
      case "PAYMENT_REQUIRED":
        return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
      case "ALREADY_CHECKED_IN":
      case "ALREADY_CHECKED_OUT":
        return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
      default:
        return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getResultColor = (result: CheckinResult) => {
    if (result.success) return "bg-green-50 border-green-200";
    if (result.code === "ALREADY_CHECKED_IN" || result.code === "ALREADY_CHECKED_OUT") {
      return "bg-yellow-50 border-yellow-200";
    }
    return "bg-red-50 border-red-200";
  };

  const isLoading = isCheckingIn || isCheckingOut;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              <span className="font-semibold">
                {mode === "checkin" ? "Check-in" : "Check-out"}
              </span>
            </div>
            <Badge variant={mode === "checkin" ? "default" : "secondary"}>
              {mode === "checkin" ? "Entrada" : "Saída"}
            </Badge>
          </div>

          <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-4">
            <div id="qr-reader" className="w-full h-full" />
            
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique em "Ler QR Code" para começar
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center p-4">
                  <CameraOff className="w-12 h-12 mx-auto mb-2 text-red-500" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              </div>
            )}

            {lastResult && (
              <div className={`absolute inset-0 flex items-center justify-center ${getResultColor(lastResult)}`}>
                <div className="text-center p-4">
                  {getResultIcon(lastResult)}
                  <p className={`font-bold mt-2 ${lastResult.success ? "text-green-600" : "text-red-600"}`}>
                    {lastResult.success ? lastResult.message : lastResult.error}
                  </p>
                  {lastResult.registration && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {lastResult.registration.attendee_name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isScanning ? (
              <Button className="flex-1" onClick={startScanning} disabled={isLoading}>
                <Camera className="w-4 h-4 mr-2" />
                Ler QR Code
              </Button>
            ) : (
              <Button variant="destructive" className="flex-1" onClick={stopScanning}>
                <CameraOff className="w-4 h-4 mr-2" />
                Parar
              </Button>
            )}
            <Button variant="outline" onClick={handleManualInput}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4" />
              <span className="font-semibold">Histórico</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${getResultColor(result)}`}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {result.registration?.attendee_name || result.registration?.ticket_number || "—"}
                    </span>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                    {result.success ? "OK" : result.code}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
