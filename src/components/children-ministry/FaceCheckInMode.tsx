import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Camera, Loader2, ScanFace, UserCheck, Baby,
  Check, RotateCcw, AlertTriangle, X
} from "lucide-react";
import { toast } from "sonner";
import {
  loadModelsOnce, computeDescriptor, findBestMatch,
  precomputeDescriptors, type FaceCandidate, type MatchResult
} from "@/lib/faceRecognition";
import type { Child } from "@/hooks/useChildrenMinistry";

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
  const [noMatch, setNoMatch] = useState(false);
  const [candidatesReady, setCandidatesReady] = useState<FaceCandidate[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

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

  const startCamera = async () => {
    try {
      setLoadingModels(true);
      setNoMatch(false);
      setMatchResult(null);
      setMatchedGuardian(null);

      const [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        }),
        loadModelsOnce(),
      ]);

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setLoadingModels(false);

      // Pre-compute descriptors
      setPreparingDescriptors(true);
      const ready = await precomputeDescriptors(
        rawCandidates.map((c) => ({ ...c })),
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

  const scanFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setScanning(true);
    setNoMatch(false);
    setMatchResult(null);
    setMatchedGuardian(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    try {
      const queryDescriptor = await computeDescriptor(canvas);

      if (!queryDescriptor) {
        toast.error("Nenhum rosto detectado. Posicione o rosto na câmera e tente novamente.");
        setScanning(false);
        return;
      }

      const best = findBestMatch(queryDescriptor, candidatesReady);

      if (best) {
        setMatchResult(best);

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
        setNoMatch(true);
        toast.info("Nenhuma correspondência encontrada. Tente novamente ou use busca manual.");
      }
    } catch (err) {
      console.error("Scan error:", err);
      toast.error("Erro ao escanear rosto.");
    } finally {
      setScanning(false);
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
    setNoMatch(false);
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

  return (
    <div className="space-y-4">
      {/* Camera area */}
      {!cameraActive && !matchResult && !noMatch && (
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
            disabled={loadingModels || rawCandidates.length === 0}
          >
            {loadingModels ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Carregando...</>
            ) : (
              <><Camera className="h-4 w-4 mr-2" />Iniciar Câmera</>
            )}
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

      {/* Camera feed */}
      {cameraActive && !matchResult && !noMatch && (
        <div className="space-y-3">
          <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary/30 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {scanning && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                  <p className="text-sm">Analisando rosto...</p>
                </div>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <Button
            className="w-full"
            onClick={scanFace}
            disabled={scanning || preparingDescriptors}
          >
            <ScanFace className="h-4 w-4 mr-2" />
            {scanning ? "Analisando..." : "Escanear Rosto"}
          </Button>
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

      {/* No match */}
      {noMatch && (
        <div className="text-center py-6 border rounded-lg border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
          <p className="text-sm font-medium text-destructive">Nenhuma correspondência encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tente novamente ou use a busca manual.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button size="sm" variant="outline" onClick={resetForNext}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
