import React, { useState, useRef, useEffect } from "react";
import { useScheduleChat } from "@/hooks/useScheduleChat";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ScheduleChatDrawer({ scheduleId }: { scheduleId: string }) {
  const { messages, isLoading, sendMessage, isSending } = useScheduleChat(scheduleId);
  const { profile } = useAuth();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await sendMessage(text);
      setText("");
    } catch (e) { 
      // Error is handled in hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[50vh] min-h-[400px] border border-white/10 rounded-2xl bg-black/5 dark:bg-white/5 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
            <MessageSquare className="w-8 h-8 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs">Tire dúvidas sobre sua escala com a liderança.</p>
          </div>
        ) : (
          messages?.map((msg) => {
            const isMe = msg.profile_id === profile?.id;
            return (
              <div 
                key={msg.id} 
                className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}
              >
                {!isMe && (
                  <Avatar className="w-6 h-6 mt-1">
                    <AvatarImage src={msg.profiles?.avatar_url || ""} />
                    <AvatarFallback className="text-[10px]">{msg.profiles?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div 
                  className={`max-w-[75%] p-3 rounded-2xl ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-white/10 dark:bg-black/20 rounded-tl-sm"}`}
                >
                  {!isMe && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-bold opacity-80">
                        {msg.profiles?.full_name || "Líder"}
                      </span>
                      {msg.is_leader && (
                        <span className="text-[9px] bg-primary/20 text-primary px-1 rounded-sm uppercase tracking-wider">
                          Team
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-tight">{msg.message}</p>
                  <p className={`text-[9px] mt-1 text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {format(new Date(msg.created_at), "HH:mm")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 bg-background/50 backdrop-blur-xl border-t border-white/10 flex items-center gap-2">
        <Input 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="rounded-full bg-white/10 border-white/10 focus-visible:ring-primary shadow-inner h-10"
        />
        <Button 
          type="submit"
          size="icon"
          className="rounded-full h-10 w-10 shrink-0"
          disabled={!text.trim() || isSending}
        >
           {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5 mt-0.5" />}
        </Button>
      </form>
    </div>
  );
}
