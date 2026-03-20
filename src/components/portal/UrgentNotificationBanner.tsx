import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, PhoneCall, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface UrgentNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  acknowledged_at: string | null;
}

export function UrgentNotificationBanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [urgentNotifications, setUrgentNotifications] = useState<UrgentNotification[]>([]);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const vibrationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch unacknowledged urgent notifications
  const fetchUrgent = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, created_at, acknowledged_at")
      .eq("user_id", user.id)
      .eq("type", "urgent")
      .is("acknowledged_at", null)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setUrgentNotifications(data as UrgentNotification[]);
    } else {
      setUrgentNotifications([]);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUrgent();
  }, [fetchUrgent]);

  // Real-time subscription for new urgent notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("urgent-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          if (newNotif.type === "urgent" && !newNotif.acknowledged_at) {
            setUrgentNotifications((prev) => [newNotif, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.type === "urgent" && updated.acknowledged_at) {
            setUrgentNotifications((prev) => prev.filter((n) => n.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Vibration loop when there are active urgent notifications
  useEffect(() => {
    if (urgentNotifications.length > 0 && "vibrate" in navigator) {
      // Vibrate pattern: vibrate 500ms, pause 300ms, vibrate 500ms, pause 1000ms
      const startVibration = () => {
        try {
          navigator.vibrate([500, 300, 500, 300, 500]);
        } catch {}
      };
      startVibration();
      vibrationRef.current = setInterval(startVibration, 2500);
    } else {
      if (vibrationRef.current) {
        clearInterval(vibrationRef.current);
        vibrationRef.current = null;
      }
      try { navigator.vibrate?.(0); } catch {}
    }

    return () => {
      if (vibrationRef.current) {
        clearInterval(vibrationRef.current);
        vibrationRef.current = null;
      }
      try { navigator.vibrate?.(0); } catch {}
    };
  }, [urgentNotifications.length]);

  const handleAcknowledge = async (notificationId: string) => {
    setAcknowledging(notificationId);
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ acknowledged_at: new Date().toISOString(), is_read: true } as any)
        .eq("id", notificationId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setUrgentNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    } catch {
      // Silent fail, user can retry
    } finally {
      setAcknowledging(null);
    }
  };

  if (urgentNotifications.length === 0) return null;

  return (
    <AnimatePresence>
      {urgentNotifications.map((notif) => (
        <motion.div
          key={notif.id}
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            boxShadow: [
              "0 0 0 0 rgba(220, 38, 38, 0)",
              "0 0 30px 8px rgba(220, 38, 38, 0.4)",
              "0 0 0 0 rgba(220, 38, 38, 0)",
            ],
          }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{
            duration: 0.4,
            boxShadow: { duration: 1.5, repeat: Infinity },
          }}
          className="relative overflow-hidden rounded-2xl border-2 border-destructive bg-destructive/10 backdrop-blur-sm"
        >
          {/* Pulsing red bar at top */}
          <motion.div
            className="h-1.5 bg-destructive"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />

          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className="h-10 w-10 shrink-0 rounded-full bg-destructive flex items-center justify-center"
              >
                <AlertTriangle className="h-5 w-5 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-destructive text-base leading-tight">
                  {notif.title}
                </h3>
                <p className="text-sm text-foreground mt-1 font-medium">
                  {notif.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notif.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <Button
              onClick={() => handleAcknowledge(notif.id)}
              disabled={acknowledging === notif.id}
              className="w-full gap-2 bg-destructive hover:bg-destructive/90 text-white font-bold text-base py-6 rounded-xl shadow-lg active:scale-[0.97] transition-transform"
            >
              {acknowledging === notif.id ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <PhoneCall className="h-5 w-5" />
              )}
              🏃 Estou a caminho!
            </Button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
