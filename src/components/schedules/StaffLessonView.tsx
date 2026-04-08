import React from "react";
import { useLessonPreparation } from "@/hooks/useLessonPreparation";
import { Loader2, BookOpen, Link as LinkIcon, FileText, FileImage, File } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StaffLessonView({ scheduleId }: { scheduleId: string }) {
  const { lesson, isLoading } = useLessonPreparation(scheduleId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center text-sm text-muted-foreground p-6 border border-dashed border-white/20 rounded-xl bg-black/5 dark:bg-white/5">
        A liderança ainda não publicou a aula para esta escala.
      </div>
    );
  }

  const getFileIcon = (type: string | null) => {
    if (type?.includes("image")) return <FileImage className="w-4 h-4" />;
    if (type?.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          {lesson.title}
        </h3>
        {lesson.description && (
          <p className="text-sm mt-3 text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {lesson.description}
          </p>
        )}
        {lesson.external_link && (
          <a 
            href={lesson.external_link} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex mt-4 items-center gap-1.5 text-sm font-semibold text-primary/80 hover:text-primary transition-colors"
          >
            <LinkIcon className="w-4 h-4" /> Acessar Link Externo
          </a>
        )}
      </div>

      {lesson.materials && lesson.materials.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-bold text-sm ml-1">Materiais Anexos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lesson.materials.map((mat) => (
              <a
                key={mat.id}
                href={mat.file_url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-white/10 hover:border-primary/50 transition-all"
              >
                <div className="p-2 bg-background rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  {getFileIcon(mat.file_type)}
                </div>
                <div className="truncate overflow-hidden flex-1">
                  <p className="text-sm font-semibold truncate">{mat.file_name}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {(mat.size_bytes ? (mat.size_bytes / 1024).toFixed(0) : "0")} KB
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
