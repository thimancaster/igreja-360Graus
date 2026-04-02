import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, LogIn, LogOut, User, Calendar, MapPin, AlertTriangle } from "lucide-react";
import { useParentChildren, useParentChildCheckIns } from "@/hooks/useParentData";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ParentHistory() {
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  const { data: children, isLoading: loadingChildren } = useParentChildren();
  const { data: checkIns, isLoading: loadingCheckIns } = useParentChildCheckIns(selectedChildId || undefined);

  if (loadingChildren) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 space-y-6 pt-4 px-4 pb-28 min-h-screen"
    >
      <div className="flex items-center gap-3">
        <img src="/kids/icon_paintbrush.png" alt="History" className="w-14 h-14 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]" />
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-none bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Histórico Kids 📜</h1>
          <p className="text-sm font-medium text-gray-700 mt-1">
            Confira as aventuras e presenças
          </p>
        </div>
      </div>

      {/* Child selector */}
      <div className="glass-card-kids p-4 pt-6 bg-white/60">
          <Label className="text-sm font-medium mb-2 block">Selecionar Filho</Label>
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Escolha uma criança 👧" />
            </SelectTrigger>
            <SelectContent>
              {children?.map((child: any) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.full_name} - {child.classroom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>

      {selectedChildId && (
        <>
          {loadingCheckIns ? (
            <div className="flex h-32 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : checkIns && checkIns.length > 0 ? (
            <div className="space-y-3">
              <h2 className="font-extrabold flex items-center gap-2 text-[#1a1a1a] text-lg mb-4">
                <Clock className="h-5 w-5 text-blue-500" />
                Últimas Presenças
              </h2>
              {checkIns.map((checkIn: any, index: number) => (
                <motion.div
                  key={checkIn.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="glass-card-kids p-5 bg-white/75 hover:scale-[1.01] transition-all border border-white/50 shadow-xl">
                      <div className="flex items-start justify-between gap-3">
                        {/* Left side - Date and event */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(checkIn.event_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {checkIn.event_name}
                            </Badge>
                          </div>
                          
                          {checkIn.classroom && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {checkIn.classroom}
                            </div>
                          )}
                        </div>

                        {/* Right side - Status */}
                        <div className="text-right space-y-1">
                          {checkIn.checked_out_at ? (
                            <Badge variant="secondary" className="gap-1">
                              <LogOut className="h-3 w-3" />
                              Saiu
                            </Badge>
                          ) : (
                            <Badge className="gap-1 bg-green-600">
                              <MapPin className="h-3 w-3" />
                              Presente
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Times */}
                      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <LogIn className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Entrada</p>
                            <p className="font-medium">
                              {format(new Date(checkIn.checked_in_at), "HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        {checkIn.checked_out_at && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <LogOut className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Saída</p>
                              <p className="font-medium">
                                {format(new Date(checkIn.checked_out_at), "HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        )}

                        {checkIn.pickup_person_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Retirado por</p>
                              <p className="font-medium truncate max-w-[120px]">
                                {checkIn.pickup_person_name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Override warning */}
                      {checkIn.pickup_method === "LEADER_OVERRIDE" && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            Retirada de emergência autorizada por líder
                          </span>
                        </div>
                      )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card-kids px-6 py-12 flex flex-col items-center justify-center text-center bg-white/60">
                <div className="w-16 h-16 rounded-full bg-slate-100 shadow-inner flex items-center justify-center mb-4">
                   <Clock className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-extrabold text-[#1a1a1a] text-lg">Nenhum histórico</p>
                <p className="text-sm text-gray-600 font-medium mt-1">Os registros de presença aparecerão aqui</p>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
