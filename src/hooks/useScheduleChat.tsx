import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

export interface ScheduleChatMessage {
  id: string;
  schedule_id: string;
  profile_id: string;
  message: string;
  is_leader: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useScheduleChat(scheduleId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["schedule-chat", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return [];

      const { data, error } = await supabase
        .from("schedule_chats")
        .select("*, profiles(full_name, avatar_url)")
        .eq("schedule_id", scheduleId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as unknown as ScheduleChatMessage[];
    },
    enabled: !!scheduleId,
  });

  useEffect(() => {
    if (!scheduleId) return;

    const subscription = supabase
      .channel(`chat_${scheduleId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "schedule_chats", filter: `schedule_id=eq.${scheduleId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["schedule-chat", scheduleId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [scheduleId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (messageText: string) => {
      if (!profile?.church_id) throw new Error("Igreja não encontrada");

      // Simple check to see if user is leader maybe from context, but we will pass it from UI if needed.
      // For now, if we are in admin panel, is_leader = true. In portal, is_leader = false.
      // We can infer is_leader by checking if they are a department_leader, but to avoid overhead, let's allow passing it or default to false.
      const is_leader = window.location.pathname.includes("/app/"); 
      
      const { data, error } = await supabase
        .from("schedule_chats")
        .insert({
          church_id: profile.church_id,
          schedule_id: scheduleId,
          profile_id: profile.id,
          message: messageText,
          is_leader,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: (err) => {
      toast.error("Erro ao enviar mensagem");
      console.error(err);
    }
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
  };
}
