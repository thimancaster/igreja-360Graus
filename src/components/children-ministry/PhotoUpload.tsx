import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, ImagePlus, Loader2, Trash2, SwitchCamera } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadProps {
  currentPhotoUrl: string | null | undefined;
  name: string;
  folder: "children" | "guardians" | "authorized";
  entityId?: string;
  onPhotoUploaded: (url: string | null) => void;
  size?: "sm" | "lg";
}

export function PhotoUpload({ currentPhotoUrl, name, folder, entityId, onPhotoUploaded, size = "lg" }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [streamReady, setStreamReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const avatarSize = size === "lg" ? "h-24 w-24" : "h-16 w-16";
  const initials = name?.substring(0, 2).toUpperCase() || "??";

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamReady(false);
  }, []);

  const startStream = useCallback(async (facing: "user" | "environment") => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamReady(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
      setCameraOpen(false);
    }
  }, [stopStream]);

  useEffect(() => {
    if (cameraOpen) {
      // Small delay to let the dialog mount the video element
      const timer = setTimeout(() => startStream(facingMode), 150);
      return () => clearTimeout(timer);
    } else {
      stopStream();
    }
  }, [cameraOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwitchCamera = async () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    await startStream(newFacing);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${folder}/${entityId || crypto.randomUUID()}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(fileName);

      onPhotoUploaded(publicUrl);
      toast.success("Foto enviada com sucesso!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar foto: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          toast.error("Erro ao capturar foto");
          return;
        }
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        setCameraOpen(false);
        await processFile(file);
      },
      "image/jpeg",
      0.85
    );
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await processFile(file);
    event.target.value = "";
  };

  const handleRemove = () => {
    onPhotoUploaded(null);
  };

  const hasCameraSupport = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  return (
    <div className="flex items-center gap-4">
      <Avatar className={avatarSize}>
        <AvatarImage src={currentPhotoUrl || undefined} />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {hasCameraSupport && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => setCameraOpen(true)}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            Tirar Foto
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          {currentPhotoUrl ? "Trocar da Galeria" : "Escolher da Galeria"}
        </Button>

        {currentPhotoUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover
          </Button>
        )}
      </div>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Capturar Foto
            </DialogTitle>
          </DialogHeader>
          <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!streamReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <DialogFooter className="p-4 pt-2 flex-row justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchCamera}
              disabled={!streamReady}
            >
              <SwitchCamera className="h-4 w-4 mr-2" />
              Virar
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={!streamReady || uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Capturar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
