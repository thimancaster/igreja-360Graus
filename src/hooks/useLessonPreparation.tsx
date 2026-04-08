import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClassroomLesson {
  id: string;
  staff_schedule_id: string;
  title: string;
  description: string | null;
  external_link: string | null;
  materials?: LessonMaterial[];
}

export interface LessonMaterial {
  id: string;
  lesson_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  size_bytes: number | null;
}

export function useLessonPreparation(staffScheduleId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["classroom-lesson", staffScheduleId],
    queryFn: async () => {
      if (!staffScheduleId) return null;

      const { data, error } = await supabase
        .from("classroom_lessons")
        .select("*, materials:lesson_materials(*)")
        .eq("staff_schedule_id", staffScheduleId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching lesson:", error);
        throw error;
      }
      return data;
    },
    enabled: !!staffScheduleId,
  });

  const saveLesson = useMutation({
    mutationFn: async (input: { title: string; description?: string; external_link?: string }) => {
      if (!profile?.church_id) throw new Error("Igreja não encontrada");

      const payload = {
        church_id: profile.church_id,
        staff_schedule_id: staffScheduleId,
        title: input.title,
        description: input.description || null,
        external_link: input.external_link || null,
      };

      if (lesson?.id) {
        const { data, error } = await supabase
          .from("classroom_lessons")
          .update(payload)
          .eq("id", lesson.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("classroom_lessons")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success("Aula salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["classroom-lesson", staffScheduleId] });
    },
    onError: (err) => {
      toast.error("Erro ao salvar aula.");
      console.error(err);
    }
  });

  const uploadMaterial = useMutation({
    mutationFn: async (file: File) => {
      if (!lesson?.id || !profile?.church_id) throw new Error("Aula não existe ainda.");
      
      const filePath = `${profile.church_id}/${lesson.id}/${crypto.randomUUID()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("lesson_materials")
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from("lesson_materials")
        .getPublicUrl(filePath);
        
      const { data, error } = await supabase
        .from("lesson_materials")
        .insert({
          church_id: profile.church_id,
          lesson_id: lesson.id,
          file_name: file.name,
          file_url: publicUrlData.publicUrl,
          file_type: file.type,
          size_bytes: file.size,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Arquivo enviado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["classroom-lesson", staffScheduleId] });
    },
    onError: (err) => {
      toast.error("Erro ao enviar arquivo.");
      console.error(err);
    }
  });

  const deleteMaterial = useMutation({
    mutationFn: async (materialId: string) => {
      const { error } = await supabase
        .from("lesson_materials")
        .delete()
        .eq("id", materialId);
      if (error) throw error;
      // Not deleting from storage physically to save time, logic can be added later.
    },
    onSuccess: () => {
      toast.success("Material removido!");
      queryClient.invalidateQueries({ queryKey: ["classroom-lesson", staffScheduleId] });
    }
  });

  return {
    lesson,
    isLoading,
    saveLesson: saveLesson.mutateAsync,
    isSaving: saveLesson.isPending,
    uploadMaterial: uploadMaterial.mutateAsync,
    isUploading: uploadMaterial.isPending,
    deleteMaterial: deleteMaterial.mutateAsync,
  };
}
