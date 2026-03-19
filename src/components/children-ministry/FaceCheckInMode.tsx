import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Camera, Loader2, ScanFace, UserCheck, Baby,
  Check, RotateCcw, AlertTriangle, Square
} from "lucide-react";
import { toast } from "sonner";
import {
  loadModelsOnce, computeDescriptorFast, findBestMatch,
  precomputeDescriptors, type FaceCandidate, type MatchResult
} from "@/lib/faceRecognition";
import type { Child } from "@/hooks/useChildrenMinistry";
import { cn } from "@/lib/utils";

type CheckInMode = "child" | "guardian";

type GuardianWithChildren = {
  id: string;
  full_name: string;
  photo_url: string | null;
  children: Child[];
};

interface FaceCheckInModeProps {
  mode: CheckInMode;
  children: Child[];
  guardiansWithChildren: GuardianWithChildren[];
  checkedInIds: Set<string>;
  onCheckIn: (childId: string, notes?: string) => Promise<void>;
  isCheckingIn: boolean;
}

export function FaceCheckInMode({
  mode, children, guardiansWithChildren,
  checkedInIds, onCheckIn, isCheckingIn
}: FaceCheckInModeProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preparingDescriptors, setPreparingDescriptors] = useState(false);
  const [prepProgress, setPrepProgress] = useState({ done: 0, total: 0 });
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchedGuardian, setMatchedGuardian] = useState<GuardianWithChildren | null>(null);
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());
  const [candidatesReady, setCandidatesReady] = useState<FaceCandidate[]>([]);
  const [lastScanStatus, setLastScanStatus] = useState<"idle" | "no-face" | "no-match">("idle");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoScanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanningRef = useRef(false);

  const stopAutoScan = useCallback(() => {
    if (autoScanRef.current) {
      clearInterval(autoScanRef.current);
      autoScanRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopAutoScan();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, [stopAutoScan]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  // Build candidate list based on mode
  const rawCandidates = useMemo((): FaceCandidate[] => {
    if (mode === "child") {
      return children
        .filter((c) => c.status === "active" && c.photo_url && !checkedInIds.has(c.id))
        .map((c) => ({ id: c.id, label: c.full_name, photoUrl: c.photo_url! }));
    } else {
      return guardiansWithChildren
        .filter((g) => g.photo_url)
        .map((g) => ({ id: g.id, label: g.full_name, photoUrl: g.photo_url! }));
    }
  }, [mode, children, guardiansWithChildren, checkedInIds]);

  // Capture frame from video to canvas (downscaled to 320px)
  const captureFrame = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const targetWidth = 320;
    const scale = targetWidth / video.videoWidth;
    canvas.width = targetWidth;
    canvas.height = Math.round(video.videoHeight * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvas;
  }, []);

  // Single scan attempt
  const doScan = useCallback(async () => {
    if (scanningRef.current || candidatesReady.length === 0) return;
    scanningRef.current = true;
    setScanning(true);

    try {
      const canvas = captureFrame();
      if (!canvas) return;

      const queryDescriptor = await computeDescriptorFast(canvas);

      if (!queryDescriptor) {
        setLastScanStatus("no-face");
        return;
      }

      const best = findBestMatch(queryDescriptor, candidatesReady);

      if (best) {
        // Match found! Stop auto-scan and show result
        stopAutoScan();
        setMatchResult(best);
        setLastScanStatus("idle");

        if (mode === "guardian") {
          const guardian = guardiansWithChildren.find((g) => g.id === best.candidate.id);
          if (guardian) {
            const availableChildren = guardian.children.filter((c) => !checkedInIds.has(c.id));
            setMatchedGuardian({ ...guardian, children: availableChildren });
            setSelectedChildIds(new Set(availableChildren.map((c) => c.id)));
          }
        }

        toast.success(`Reconhecido: ${best.candidate.label} (${Math.round(best.confidence * 100)}%)`);
      } else {
        setLastScanStatus("no-match");
      }
    } catch (err) {
      console.error("Scan error:", err);
    } finally {
      scanningRef.current = false;
      setScanning(false);
    }
  }, [candidatesReady, captureFrame, stopAutoScan, mode, guardiansWithChildren, checkedInIds]);

  // Start auto-scanning
  const startAutoScan = useCallback(() => {
    stopAutoScan();
    // Initial scan after short delay
    setTimeout(() => doScan(), 800);
    // Then every 2.5 seconds
    autoScanRef.current = setInterval(() => {
      doScan();
    }, 2500);
  }, [doScan, stopAutoScan]);

  // Start auto-scan when descriptors are ready
  useEffect(() => {
    if (cameraActive && candidatesReady.length > 0 && !matchResult && !preparingDescriptors) {
      startAutoScan();
    }
    return () => stopAutoScan();
  }, [cameraActive, candidatesReady.length, matchResult, preparingDescriptors, startAutoScan, stopAutoScan]);

  // Attach stream to video once element is in the DOM
  const pendingStreamRef = useRef<MediaStream | null>(null);

  const videoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    (videoRef as any).current = el;
    if (el && pendingStreamRef.current) {
      el.srcObject = pendingStreamRef.current;
      el.play().catch(() => {});
      pendingStreamRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    try {
      setLoadingModels(true);
      setMatchResult(null);
      setMatchedGuardian(null);
      setLastScanStatus("idle");

      const [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        }),
        loadModelsOnce(),
      ]);

      streamRef.current = stream;
      pendingStreamRef.current = stream;

      // Set camera active first so the <video> renders
      setCameraActive(true);
      setLoadingModels(false);

      // If videoRef is already available, attach immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        pendingStreamRef.current = null;
      }

      // Pre-compute descriptors
      setPreparingDescriptors(true);
      const ready = await precomputeDescriptors(
        rawCandidates,
        (done, total) => setPrepProgress({ done, total })
      );
      setCandidatesReady(ready);
      setPreparingDescriptors(false);
    } catch (err) {
      console.error("Camera/model error:", err);
      setLoadingModels(false);
      setPreparingDescriptors(false);
      toast.error("Não foi possível acessar a câmera ou carregar os modelos de IA.");
    }
  };

  const handleConfirmChildCheckIn = async () => {
    if (!matchResult) return;
    const child = children.find((c) => c.id === matchResult.candidate.id);
    if (!child) return;
    await onCheckIn(child.id, "Check-in por reconhecimento facial da criança");
    resetForNext();
  };

  const handleConfirmGuardianCheckIn = async () => {
    if (!matchedGuardian || selectedChildIds.size === 0) return;
    for (const childId of selectedChildIds) {
      await onCheckIn(childId, `Check-in por reconhecimento facial do responsável: ${matchedGuardian.full_name}`);
    }
    resetForNext();
  };

  const resetForNext = () => {
    setMatchResult(null);
    setMatchedGuardian(null);
    setSelectedChildIds(new Set());
    setLastScanStatus("idle");
    // Auto-scan will restart via useEffect
  };

  const toggleChildSelection = (childId: string) => {
    setSelectedChildIds((prev) => {
      const next = new Set(prev);
      if (next.has(childId)) next.delete(childId);
      else next.add(childId);
      return next;
    });
  };

  const confidencePercent = matchResult ? Math.round(matchResult.confidence * 100) : 0;

  // Status indicator text
  const scanStatusText = lastScanStatus === "no-face"
    ? "Nenhum rosto detectado"
    : lastScanStatus === "no-match"
    ? "Sem correspondência — escaneando..."
    : "Escaneando automaticamente...";

  return (
    <div className="space-y-4">
      {/* Camera start screen */}
      {!cameraActive && !loadingModels && !matchResult && (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <ScanFace className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-1">
            {mode === "child"
              ? "Reconhecimento facial da criança"
              : "Reconhecimento facial do responsável"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {rawCandidates.length === 0
              ? "Nenhum cadastro com foto disponível para este modo."
              : `${rawCandidates.length} cadastro(s) com foto disponível(is)`}
          </p>
          <Button
            onClick={startCamera}
            disabled={rawCandidates.length === 0}
          >
            <Camera className="h-4 w-4 mr-2" />
            Iniciar Câmera
          </Button>
        </div>
      )}

      {/* Loading models */}
      {loadingModels && (
        <div className="text-center py-6 border rounded-lg bg-muted/30">
          <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Carregando modelos de IA...</p>
        </div>
      )}

      {/* Preparing descriptors */}
      {preparingDescriptors && (
        <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">
              Preparando banco de faces... {prepProgress.done}/{prepProgress.total}
            </span>
          </div>
          <Progress
            value={prepProgress.total > 0 ? (prepProgress.done / prepProgress.total) * 100 : 0}
            className="h-2"
          />
        </div>
      )}

      {/* Camera feed with auto-scan */}
      {cameraActive && !matchResult && (
        <div className="space-y-3">
          <div
            className={cn(
              "relative aspect-video rounded-lg overflow-hidden bg-black transition-all duration-500",
              scanning
                ? "border-2 border-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                : "border-2 border-muted"
            )}
          >
            <video
              ref={videoRefCallback}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {/* Scan indicator overlay - subtle, non-blocking */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90">
                  {scanning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ScanFace className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs">{scanStatusText}</span>
                </div>
                {lastScanStatus === "no-match" && (
                  <span className="text-xs text-amber-200">Tente se aproximar</span>
                )}
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={stopCamera}
            >
              <Square className="h-4 w-4 mr-2" />
              Parar Câmera
            </Button>
            <Button
              className="flex-1"
              onClick={doScan}
              disabled={scanning || preparingDescriptors || candidatesReady.length === 0}
            >
              <ScanFace className="h-4 w-4 mr-2" />
              {scanning ? "Analisando..." : "Escanear Agora"}
            </Button>
          </div>
        </div>
      )}

      {/* Match result: Child mode */}
      {matchResult && mode === "child" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <UserCheck className="h-5 w-5" />
              <span className="font-semibold">Criança Reconhecida!</span>
              <Badge variant="outline" className="ml-auto">
                {confidencePercent}% confiança
              </Badge>
            </div>

            <div className="flex items-center gap-4 p-3 bg-card rounded-lg border">
              <Avatar className="h-14 w-14">
                <AvatarImage src={matchResult.candidate.photoUrl} />
                <AvatarFallback>{matchResult.candidate.label.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{matchResult.candidate.label}</p>
                {(() => {
                  const child = children.find((c) => c.id === matchResult.candidate.id);
                  return child ? (
                    <Badge variant="outline">{child.classroom}</Badge>
                  ) : null;
                })()}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForNext} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-1" />
                Escanear Outro
              </Button>
              <Button onClick={handleConfirmChildCheckIn} disabled={isCheckingIn} className="flex-1">
                <Check className="h-4 w-4 mr-1" />
                Confirmar Check-in
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match result: Guardian mode */}
      {matchResult && mode === "guardian" && matchedGuardian && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <UserCheck className="h-5 w-5" />
              <span className="font-semibold">Responsável Reconhecido!</span>
              <Badge variant="outline" className="ml-auto">
                {confidencePercent}% confiança
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
              <Avatar className="h-12 w-12">
                <AvatarImage src={matchedGuardian.photo_url || undefined} />
                <AvatarFallback>{matchedGuardian.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{matchedGuardian.full_name}</p>
                <p className="text-xs text-muted-foreground">Responsável</p>
              </div>
            </div>

            {matchedGuardian.children.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selecione as crianças para check-in:</p>
                {matchedGuardian.children.map((child) => (
                  <label
                    key={child.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedChildIds.has(child.id)}
                      onCheckedChange={() => toggleChildSelection(child.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={child.photo_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {child.full_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{child.full_name}</p>
                      <Badge variant="outline" className="text-xs">{child.classroom}</Badge>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-muted-foreground">
                <Baby className="h-6 w-6 mx-auto mb-1" />
                <p className="text-sm">Todas as crianças deste responsável já fizeram check-in.</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForNext} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-1" />
                Escanear Outro
              </Button>
              <Button
                onClick={handleConfirmGuardianCheckIn}
                disabled={isCheckingIn || selectedChildIds.size === 0}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Check-in ({selectedChildIds.size})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
