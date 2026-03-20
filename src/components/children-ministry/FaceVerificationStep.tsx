import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle2, XCircle, RotateCcw, Eye, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import {
  loadModelsOnce, loadImageWithCORS, getFaceApi,
  MATCH_THRESHOLD, HIGH_CONFIDENCE_THRESHOLD
} from "@/lib/faceRecognition";

type VerificationResult = "pending" | "verifying" | "match" | "no_match" | "error";

interface FaceVerificationStepProps {
  personName: string;
  personPhotoUrl: string | null | undefined;
  onVerified: (result: "approved" | "rejected" | "skipped") => void;
}

export function FaceVerificationStep({ personName, personPhotoUrl, onVerified }: FaceVerificationStepProps) {
  const [result, setResult] = useState<VerificationResult>("pending");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const hasPhoto = !!personPhotoUrl;

  // Callback ref to attach stream when video element mounts
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && pendingStreamRef.current) {
      node.srcObject = pendingStreamRef.current;
      node.play().catch(console.error);
      pendingStreamRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    try {
      setLoadingModels(true);
      const [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        }),
        loadModelsOnce(),
      ]);
      streamRef.current = stream;
      pendingStreamRef.current = stream;

      // If video element already exists, attach immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        pendingStreamRef.current = null;
      }

      setCameraActive(true);
      setLoadingModels(false);
    } catch (err) {
      console.error("Camera/model error:", err);
      setLoadingModels(false);
      toast.error("Não foi possível acessar a câmera ou carregar os modelos de IA.");
    }
  };

  const captureAndCompare = async () => {
    if (!videoRef.current || !canvasRef.current || !getFaceApi()) return;

    setResult("verifying");

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

    const capturedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(capturedDataUrl);
    stopCamera();

    try {
      const faceapi = getFaceApi();
      if (!faceapi) throw new Error("face-api not loaded");

      // Load captured image
      const capturedImg = await faceapi.fetchImage(capturedDataUrl);
      const capturedDetection = await faceapi
        .detectSingleFace(capturedImg, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!capturedDetection) {
        setResult("error");
        toast.error("Nenhum rosto detectado na captura. Tente novamente.");
        return;
      }

      // Load reference image with CORS support
      const refImg = await loadImageWithCORS(personPhotoUrl!);
      const refDetection = await faceapi
        .detectSingleFace(refImg, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!refDetection) {
        setResult("error");
        toast.error("Não foi possível detectar rosto na foto cadastrada. Verifique visualmente.");
        return;
      }

      const distance = faceapi.euclideanDistance(capturedDetection.descriptor, refDetection.descriptor);
      const matchConfidence = Math.max(0, Math.min(1, 1 - distance));
      setConfidence(matchConfidence);

      if (distance <= HIGH_CONFIDENCE_THRESHOLD) {
        setResult("match");
        toast.success("Identidade verificada com alta confiança!");
      } else if (distance <= MATCH_THRESHOLD) {
        setResult("match");
        toast.success("Identidade verificada!");
      } else {
        setResult("no_match");
      }
    } catch (err) {
      console.error("Face comparison error:", err);
      setResult("error");
      toast.error("Erro na verificação facial. Verifique visualmente.");
    }
  };

  const retry = () => {
    setResult("pending");
    setConfidence(null);
    setCapturedImage(null);
    startCamera();
  };

  const confidencePercent = confidence !== null ? Math.round(confidence * 100) : null;

  if (!hasPhoto) {
    return (
      <div className="rounded-lg border border-muted p-3 text-center text-sm text-muted-foreground">
        <Eye className="h-5 w-5 mx-auto mb-1" />
        <p>Foto não cadastrada para {personName}.</p>
        <p className="text-xs mt-1">Verificação facial indisponível. Prossiga com o PIN.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center gap-2">
        <Camera className="h-4 w-4" />
        Verificação Facial
      </label>

      {/* Start state */}
      {result === "pending" && !cameraActive && !loadingModels && (
        <div className="text-center py-4 border rounded-lg bg-muted/30">
          <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Verifique a identidade de <strong>{personName}</strong>
          </p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" onClick={startCamera}>
              <Camera className="h-4 w-4 mr-2" />
              Iniciar Verificação
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onVerified("skipped")}>
              Pular
            </Button>
          </div>
        </div>
      )}

      {/* Loading models */}
      {loadingModels && (
        <div className="text-center py-6 border rounded-lg bg-muted/30">
          <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Carregando modelos de IA...</p>
          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos na primeira vez</p>
        </div>
      )}

      {/* Camera active - side by side */}
      {cameraActive && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-center text-muted-foreground">Foto Cadastrada</p>
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-primary/30 bg-muted">
                <img
                  src={personPhotoUrl!}
                  alt={personName}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-center text-muted-foreground">Câmera ao Vivo</p>
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-muted bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <Button className="w-full" onClick={captureAndCompare}>
            <Camera className="h-4 w-4 mr-2" />
            Capturar e Comparar
          </Button>
        </div>
      )}

      {/* Verifying */}
      {result === "verifying" && (
        <div className="text-center py-6 border rounded-lg bg-muted/30">
          <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Analisando rosto...</p>
        </div>
      )}

      {/* Results */}
      {(result === "match" || result === "no_match" || result === "error") && (
        <div className="space-y-3">
          {capturedImage && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-center text-muted-foreground">Foto Cadastrada</p>
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-primary/30 bg-muted">
                  <img src={personPhotoUrl!} alt={personName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-center text-muted-foreground">Foto Capturada</p>
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-muted bg-muted">
                  <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          )}

          {result === "match" && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Identidade Verificada</p>
                {confidencePercent !== null && (
                  <p className="text-xs text-muted-foreground">Confiança: {confidencePercent}%</p>
                )}
              </div>
              <Badge variant="outline" className="border-primary/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Aprovado
              </Badge>
            </div>
          )}

          {result === "no_match" && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <ShieldAlert className="h-6 w-6 text-destructive flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive">Rosto Não Corresponde</p>
                  {confidencePercent !== null && (
                    <p className="text-xs text-muted-foreground">Confiança: {confidencePercent}%</p>
                  )}
                </div>
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Falhou
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Compare visualmente as fotos acima. Se a pessoa for a mesma, aprove manualmente.
              </p>
            </div>
          )}

          {result === "error" && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-accent bg-accent/50">
              <ShieldAlert className="h-6 w-6 text-accent-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Verificação Inconclusiva</p>
                <p className="text-xs text-muted-foreground">Compare visualmente as fotos e decida.</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={retry} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-1" />
              Tentar Novamente
            </Button>

            {result === "match" ? (
              <Button size="sm" onClick={() => onVerified("approved")} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Prosseguir
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onVerified("rejected")}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onVerified("approved")}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Aprovar Visual
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
