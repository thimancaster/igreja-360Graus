import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLessonPreparation, ClassroomLesson } from "@/hooks/useLessonPreparation";
import { Loader2, BookOpen, Link as LinkIcon, Upload, Trash2, FileText, FileImage, File } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface LessonPreparationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: any;
}

export function LessonPreparationModal({ open, onOpenChange, schedule }: LessonPreparationModalProps) {
  const { lesson: rawLesson, isLoading, saveLesson, isSaving, uploadMaterial, isUploading, deleteMaterial } = useLessonPreparation(schedule?.id || "");
  const lesson = rawLesson as ClassroomLesson | null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");

  // Sync local state when lesson loads
  React.useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || "");
      setDescription(lesson.description || "");
      setExternalLink(lesson.external_link || "");
    }
  }, [lesson]);

  if (!schedule) return null;

  const handleSave = async () => {
    if (!title) return;
    await saveLesson({ title, description, external_link: externalLink });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file) {
      await uploadMaterial(file);
    }
  };

  const getFileIcon = (type: string | null) => {
    if (type?.includes("image")) return <FileImage className="w-4 h-4" />;
    if (type?.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl glass-card-static rounded-3xl border border-white/20 p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 pb-4 border-b border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <BookOpen className="w-6 h-6 text-primary" />
              Preparação de Aula
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex items-center gap-2 text-sm text-foreground/80">
            <Badge variant="secondary" className="rounded-full">{schedule.ministry_staff?.profiles?.full_name}</Badge>
            <span>•</span>
            <span>{format(new Date(schedule.shift_start), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="font-bold">Título da Lição</Label>
                  <Input 
                    placeholder="Ex: A Arca de Noé"
                    className="rounded-xl border-white/20 bg-black/5 dark:bg-white/5"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="font-bold">Descrição / Roteiro</Label>
                  <Textarea 
                    placeholder="Resumo do que será ensinado..."
                    className="rounded-xl border-white/20 bg-black/5 dark:bg-white/5 min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-bold">Link Externo (Vídeo/Drive)</Label>
                  <Input 
                    placeholder="https://youtube.com/..."
                    className="rounded-xl border-white/20 bg-black/5 dark:bg-white/5"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full rounded-2xl shadow-lg shadow-primary/20 font-bold"
                  onClick={handleSave}
                  disabled={isSaving || !title}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Lição"}
                </Button>
              </div>

              {/* Se a lição foi salva no DB, podemos anexar arquivos */}
              {lesson?.id && (
                <div className="pt-6 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-lg">Materiais (PDF, Imagens)</Label>
                    <div className="relative">
                      <Input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <Button variant="outline" size="sm" className="rounded-full border-primary/20 text-primary gap-1">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Anexar Arquivo
                      </Button>
                    </div>
                  </div>

                  {lesson.materials && lesson.materials.length > 0 ? (
                    <div className="space-y-2">
                      {lesson.materials.map((mat) => (
                        <div key={mat.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-background rounded-lg shadow-sm">
                              {getFileIcon(mat.file_type)}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-semibold truncate">{mat.file_name}</p>
                              <a href={mat.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" /> Visualizar
                              </a>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => deleteMaterial(mat.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 border border-dashed border-white/20 rounded-xl text-muted-foreground text-sm">
                      Nenhum material anexado.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
