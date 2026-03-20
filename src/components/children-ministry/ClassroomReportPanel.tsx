import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CLASSROOMS } from "@/hooks/useChildrenMinistry";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export function ClassroomReportPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [classroom, setClassroom] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [eventName, setEventName] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["classroom-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classroom_reports")
        .select("*")
        .order("event_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const createReport = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.church_id) throw new Error("Igreja não encontrada");

      const { error } = await supabase.from("classroom_reports").insert({
        church_id: profile.church_id,
        classroom,
        title,
        content,
        teacher_name: teacherName || null,
        event_name: eventName || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classroom-reports"] });
      toast.success("Relatório criado com sucesso!");
      setDialogOpen(false);
      setClassroom(""); setTitle(""); setContent(""); setTeacherName(""); setEventName("");
    },
    onError: () => toast.error("Erro ao criar relatório"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios de Aula
          </h2>
          <p className="text-sm text-muted-foreground">Compartilhe com os pais o que as crianças aprenderam</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Relatório
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : reports && reports.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {reports.map((report: any, i: number) => (
            <motion.div key={report.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <Badge variant="outline" className="shrink-0 text-xs">{report.classroom}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(report.event_date), "dd/MM/yyyy", { locale: ptBR })}
                    {report.teacher_name && ` • ${report.teacher_name}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap line-clamp-4">{report.content}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="font-medium">Nenhum relatório ainda</p>
            <p className="text-sm text-muted-foreground">Crie relatórios para compartilhar com os pais</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Relatório de Aula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Turma *</Label>
                <Select value={classroom} onValueChange={setClassroom}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {CLASSROOMS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Evento</Label>
                <Input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Ex: EBD" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: A história de Noé" />
            </div>
            <div className="space-y-1.5">
              <Label>Professor(a)</Label>
              <Input value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="Nome do professor(a)" />
            </div>
            <div className="space-y-1.5">
              <Label>Conteúdo *</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Descreva o que foi trabalhado em aula..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createReport.mutate()} disabled={!classroom || !title || !content || createReport.isPending}>
              {createReport.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
