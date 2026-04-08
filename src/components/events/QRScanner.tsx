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
              <motion.div 
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                className={`absolute inset-0 z-50 flex items-center justify-center p-6 ${
                  lastResult.success ? "bg-green-500/20" : 
                  lastResult.code === "ALREADY_CHECKED_IN" || lastResult.code === "ALREADY_CHECKED_OUT" ? "bg-yellow-500/20" : 
                  "bg-red-500/20"
                }`}
              >
                <div className="bg-white/95 dark:bg-black/95 p-8 rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-xs flex flex-col items-center text-center relative mt-12">
                  <motion.img 
                    src={lastResult.success ? "/kids/kids_character_vol_1.png" : "/kids/kids_character_oops.png"}
                    alt="Character"
                    className="absolute -top-32 w-48 drop-shadow-2xl z-20 pointer-events-none pop-out-character"
                    initial={{ y: 50, scale: 0.8, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                    className="mb-4 mt-4"
                  >
                    {getResultIcon(lastResult)}
                  </motion.div>
                  
                  <h3 className={`text-2xl font-black mb-1 ${
                    lastResult.success ? "text-green-600" : 
                    lastResult.code?.includes("ALREADY") ? "text-yellow-600" : 
                    "text-red-600"
                  }`}>
                    {lastResult.success ? (mode === "checkin" ? "Bem-vindo! 🎉" : "Até logo! 👋") : "Ops!"}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 font-bold mb-4 leading-tight">
                    {lastResult.success ? lastResult.message : lastResult.error}
                  </p>

                  {lastResult.registration && (
                    <div className="w-full p-4 rounded-3xl bg-muted/50 border border-black/5 flex items-center gap-3 text-left mb-2">
                       <div className="relative">
                          <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm" />
                          <Avatar className="h-10 w-10 border-2 border-white relative z-10 shadow-sm">
                            <AvatarImage src={lastResult.registration.photo_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{(lastResult.registration.attendee_name || "P")[0]}</AvatarFallback>
                          </Avatar>
                       </div>
                       <div className="min-w-0">
                        <p className="font-extrabold text-sm truncate text-foreground">{lastResult.registration.attendee_name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold tracking-wider">{lastResult.registration.ticket_number}</p>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="mt-6 w-full rounded-2xl h-12 font-black text-lg bg-zinc-900 hover:bg-black text-white shadow-xl"
                    onClick={() => setLastResult(null)}
                  >
                    CONTINUAR
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex gap-2">
            {!isScanning ? (
              <Button className="flex-1 h-12 rounded-2xl text-lg font-extrabold shadow-lg shadow-primary/20" onClick={startScanning} disabled={isLoading}>
                <Camera className="w-5 h-5 mr-2" />
                Iniciar Scanner
              </Button>
            ) : (
              <Button variant="destructive" className="flex-1 h-12 rounded-2xl text-lg font-extrabold" onClick={stopScanning}>
                <CameraOff className="w-5 h-5 mr-2" />
                Parar Câmera
              </Button>
            )}
            <Button variant="outline" className="h-12 w-12 rounded-2xl" onClick={handleManualInput}>
              <RefreshCw className="w-5 h-5" />
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
