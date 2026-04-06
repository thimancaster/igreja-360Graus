import { useParentChildCheckIns } from "@/hooks/useParentData";
import { Child } from "@/hooks/useChildrenMinistry";
import { motion } from "framer-motion";
import { Star, Trophy, Calendar, TrendingUp, ArrowLeft, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ParentEvolutionProps {
  child: Child;
  onBack: () => void;
}

export function ParentEvolution({ child, onBack }: ParentEvolutionProps) {
  const { data: history, isLoading } = useParentChildCheckIns(child.id);

  const chartData = history?.slice(0, 7).reverse().map(c => ({
    date: format(new Date(c.event_date), "dd/MM"),
    comportamento: c.behavior_score || 0,
    participacao: c.participation_score || 0,
  })) || [];

  const avgBehavior = history?.length ? (history.reduce((acc, c) => acc + (c.behavior_score || 0), 0) / history.length).toFixed(1) : "0.0";
  const attendanceCount = history?.filter(c => {
    const d = new Date(c.event_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length || 0;

  return (
    <div className="space-y-6 pt-2 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between px-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full bg-white/20 hover:bg-white/40">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="text-right">
           <h2 className="font-extrabold text-xl text-[#1a1a1a] tracking-tight uppercase">Jornada Kids</h2>
           <p className="text-xs font-bold text-gray-500 uppercase">{child.full_name}</p>
        </div>
      </div>

      {/* SUMMARY PILLS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card-kids p-4 bg-amber-500/10 border-amber-500/20 text-amber-700">
           <div className="flex items-center gap-2 mb-1">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              <span className="text-[10px] font-black uppercase">Comportamento</span>
           </div>
           <p className="text-3xl font-black">{avgBehavior}</p>
           <p className="text-[8px] font-extrabold opacity-70 uppercase">Média Geral</p>
        </div>
        <div className="glass-card-kids p-4 bg-sky-500/10 border-sky-500/20 text-sky-700">
           <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-5 w-5 text-sky-500" />
              <span className="text-[10px] font-black uppercase">Assiduidade</span>
           </div>
           <p className="text-3xl font-black">{attendanceCount}</p>
           <p className="text-[8px] font-extrabold opacity-70 uppercase">Aulas no Mês</p>
        </div>
      </div>

      {/* EVOLUTION CHART */}
      <Card variant="glass" className="rounded-[2.5rem] border-white/40 shadow-xl overflow-hidden bg-white/40 backdrop-blur-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-indigo-500 rounded-2xl text-white shadow-lg">
                <TrendingUp className="h-4 w-4" />
             </div>
             <div>
                <CardTitle className="text-lg font-black text-indigo-900 uppercase tracking-tighter">Gráfico de Evolução</CardTitle>
                <CardDescription className="text-[10px] font-bold text-indigo-500/60 uppercase">Últimas 7 Sessões</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="h-[200px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#64748B" />
              <YAxis domain={[0, 5]} hide />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="comportamento" stroke="#F59E0B" strokeWidth={4} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="participacao" stroke="#3B82F6" strokeWidth={4} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* FEEDBACK LIST */}
      <div className="space-y-3">
         <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
            <MessageCircle className="h-4 w-4" />
            Recados do Professor
         </h3>
         <div className="space-y-3">
            {history?.filter(c => c.session_notes).slice(0, 5).map(c => (
              <motion.div 
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-kids p-4 bg-white/70 border-white/50 shadow-sm relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Trophy className="h-10 w-10 text-amber-500" />
                 </div>
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-kids-portal uppercase opacity-60">
                       {format(new Date(c.event_date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </span>
                    <div className="flex gap-0.5">
                       {Array.from({ length: c.behavior_score || 0 }).map((_, i) => (
                         <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                       ))}
                    </div>
                 </div>
                 <p className="text-sm font-bold text-gray-700 leading-tight">"{c.session_notes}"</p>
                 <div className="mt-2 flex items-center gap-2">
                    <span className="text-[8px] font-black px-2 py-0.5 bg-sky-100 text-sky-600 rounded-full uppercase">Sala {c.classroom}</span>
                    <span className="text-[8px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full uppercase">{c.event_name}</span>
                 </div>
              </motion.div>
            ))}
            {!history?.some(c => c.session_notes) && (
              <div className="text-center py-10 opacity-40">
                 <p className="text-xs font-black uppercase">Nenhuma observação ainda</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
