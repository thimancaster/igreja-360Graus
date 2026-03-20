import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Radio, ExternalLink, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, isFuture, differenceInHours, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] || null;
}

export default function PortalLiveService() {
  const { profile } = useAuth();

  const { data: church, isLoading: churchLoading } = useQuery({
    queryKey: ["portal-church-live", profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return null;
      const { data, error } = await supabase
        .from("churches")
        .select("name, youtube_live_url")
        .eq("id", profile.church_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.church_id,
  });

  // Fetch next service event
  const { data: nextEvent } = useQuery({
    queryKey: ["portal-next-service", profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return null;
      const { data } = await supabase
        .from("ministry_events")
        .select("title, start_datetime, location")
        .eq("church_id", profile.church_id)
        .eq("event_type", "culto")
        .gte("start_datetime", new Date().toISOString())
        .order("start_datetime", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.church_id,
  });

  if (churchLoading) {
    return (
      <div className="space-y-4 p-4 max-w-2xl mx-auto">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const youtubeUrl = church?.youtube_live_url;
  const videoId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;

  const getCountdown = () => {
    if (!nextEvent) return null;
    const eventDate = new Date(nextEvent.start_datetime);
    if (isPast(eventDate)) return null;
    const hours = differenceInHours(eventDate, new Date());
    if (hours > 48) {
      return format(eventDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    }
    const mins = differenceInMinutes(eventDate, new Date()) % 60;
    return `Em ${hours}h ${mins}min`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 space-y-5 p-4 max-w-2xl mx-auto w-full pb-24 lg:pb-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-destructive/20 to-primary/20 flex items-center justify-center">
            <Radio className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Culto ao Vivo</h1>
            <p className="text-sm text-muted-foreground">{church?.name || "Igreja"}</p>
          </div>
        </div>
      </motion.div>

      {/* Video Embed */}
      {videoId ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative overflow-hidden rounded-2xl shadow-lg aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="Culto ao Vivo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-12 text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <Play className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground text-sm">
                O link do culto ao vivo ainda não foi configurado.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Open in YouTube */}
      {youtubeUrl && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
            <Button className="w-full rounded-xl gap-2 h-12 text-base active:scale-[0.97] transition-transform">
              <ExternalLink className="h-5 w-5" />
              Abrir no YouTube
            </Button>
          </a>
        </motion.div>
      )}

      {/* Next Event */}
      {nextEvent && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{nextEvent.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {getCountdown()}
                  {nextEvent.location && ` • ${nextEvent.location}`}
                </p>
              </div>
              <Badge className="shrink-0 bg-primary/10 text-primary border-0 text-xs">
                Próximo
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
