import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeamAvailabilityCalendarProps {
  ministryId: string;
}

interface UnavailabilityRecord {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  volunteer: { full_name: string };
}

export function TeamAvailabilityCalendar({ ministryId }: TeamAvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const paddedDays = Array(startDayOfWeek).fill(null).concat(days);
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const startStr = format(monthStart, "yyyy-MM-dd");
  const endStr = format(monthEnd, "yyyy-MM-dd");

  const { data: unavailabilities, isLoading } = useQuery({
    queryKey: ["team-availability", ministryId, startStr, endStr],
    queryFn: async () => {
      if (!ministryId) return [];

      // Get all volunteers of this ministry
      const { data: volunteers } = await supabase
        .from("department_volunteers")
        .select("id")
        .eq("ministry_id", ministryId)
        .eq("status", "active");

      if (!volunteers || volunteers.length === 0) return [];

      const volIds = volunteers.map((v) => v.id);

      const { data, error } = await supabase
        .from("volunteer_availability")
        .select(`
          id,
          start_date,
          end_date,
          reason,
          volunteer:department_volunteers!inner(full_name)
        `)
        .in("volunteer_id", volIds)
        .lte("start_date", endStr)
        .gte("end_date", startStr)
        .order("start_date");

      if (error) throw error;
      return (data || []) as UnavailabilityRecord[];
    },
    enabled: !!ministryId,
  });

  // Build a map: dateStr -> list of unavailable volunteers
  const unavailableByDate = (unavailabilities || []).reduce(
    (acc, record) => {
      const start = parseISO(record.start_date);
      const end = parseISO(record.end_date);
      const rangeDays = eachDayOfInterval({ start, end });
      for (const d of rangeDays) {
        const key = format(d, "yyyy-MM-dd");
        if (!acc[key]) acc[key] = [];
        acc[key].push({ name: record.volunteer.full_name, reason: record.reason });
      }
      return acc;
    },
    {} as Record<string, { name: string; reason: string | null }[]>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalUnavailableDays = Object.keys(unavailableByDate).filter(
    (d) => d >= startStr && d <= endStr
  ).length;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarOff className="h-4 w-4" />
            Disponibilidade da Equipe
            {totalUnavailableDays > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalUnavailableDays} dias bloqueados
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3 capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </p>

          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="min-h-[52px]" />;
              }

              const dateKey = format(day, "yyyy-MM-dd");
              const blocked = unavailableByDate[dateKey] || [];
              const isCurrentDay = isToday(day);
              const hasBlocked = blocked.length > 0;

              return (
                <Tooltip key={dateKey} delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "min-h-[52px] p-1 border rounded-md transition-colors cursor-default",
                        isCurrentDay && "ring-2 ring-primary",
                        hasBlocked
                          ? "bg-destructive/10 border-destructive/30"
                          : "bg-background"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-medium block",
                          isCurrentDay && "text-primary font-bold",
                          hasBlocked && "text-destructive"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {hasBlocked && (
                        <div className="mt-0.5 space-y-0.5">
                          {blocked.slice(0, 2).map((b, i) => (
                            <div
                              key={i}
                              className="text-[10px] leading-tight text-destructive/80 truncate"
                            >
                              {b.name.split(" ")[0]}
                            </div>
                          ))}
                          {blocked.length > 2 && (
                            <div className="text-[10px] text-muted-foreground">
                              +{blocked.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {hasBlocked && (
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="font-medium text-xs mb-1">Indisponíveis:</p>
                      <ul className="space-y-0.5">
                        {blocked.map((b, i) => (
                          <li key={i} className="text-xs">
                            <span className="font-medium">{b.name}</span>
                            {b.reason && (
                              <span className="text-muted-foreground"> — {b.reason}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30" />
              <span>Voluntário indisponível</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-background border" />
              <span>Todos disponíveis</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
