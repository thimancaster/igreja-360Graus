import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Users, Library, Activity, GraduationCap, ShieldCheck } from "lucide-react";
import { useParentChildren, useClassroomStaff } from "@/hooks/useParentData";

function ClassroomStaffDisplay({ classroom }: { classroom: string }) {
  const { data: staff, isLoading } = useClassroomStaff(classroom);

  if (isLoading) return <div className="text-[10px] text-gray-400">Consultando equipe...</div>;
  if (!staff || staff.length === 0) return <div className="text-[10px] text-gray-500 font-medium italic">Aguardando equipe aparecer ⛪</div>;

  return (
    <div className="mt-2 space-y-1">
      {staff.map((s: any) => (
        <div key={s.id} className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100/50">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span className="truncate">{s.role === 'primary' ? 'Líder' : 'Tio(a)'}: {s.staff?.full_name}</span>
        </div>
      ))}
    </div>
  );
}

export default function ParentClasses() {
  const { data: children, isLoading } = useParentChildren();

  const CLASSES_INFO = [
    { title: "Maternal", ageRange: "0 a 2 anos", icon: "🍼", color: "from-pink-400 to-rose-500", desc: "Cuidado e amor num ambiente seguro." },
    { title: "Jardim", ageRange: "3 a 5 anos", icon: "🧩", color: "from-cyan-400 to-blue-500", desc: "Aprendizado através de brincadeiras e histórias." },
    { title: "Primários", ageRange: "6 a 8 anos", icon: "🎨", color: "from-amber-400 to-orange-500", desc: "Lúdico e criativo com foco na amizade." },
    { title: "Juniores", ageRange: "9 a 12 anos", icon: "📖", color: "from-emerald-400 to-green-500", desc: "Estudos mais práticos e dinâmicas pré-teens." },
  ];

  if (isLoading) {
    return <div className="p-4">Carregando turmas...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-4 px-4 pb-28 min-h-screen">
      <div className="flex items-center gap-3">
        <img src="/kids/icon_bible.png" alt="Bible" className="w-12 h-12 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" />
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight leading-none bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Nossas Turmas 🏫</h1>
          <p className="text-gray-700 font-medium text-sm mt-0.5">Conheça as divisões por idade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CLASSES_INFO.map((cls, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card-kids p-5 bg-white/60 hover:scale-[1.02] transition-transform"
          >
            <div className="text-4xl mb-3 drop-shadow-sm">{cls.icon}</div>
            <h3 className="font-extrabold text-xl text-[#1a1a1a] leading-tight">{cls.title}</h3>
            <Badge className={`bg-gradient-to-r ${cls.color} text-white font-bold border-0 mt-2 mb-3 drop-shadow-sm`}>
              {cls.ageRange}
            </Badge>
            <p className="text-sm font-medium text-gray-700 leading-snug">{cls.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="font-extrabold text-2xl text-[#1a1a1a] flex items-center gap-2">
           <GraduationCap className="h-6 w-6 text-blue-500" />
           Meus Filhos Inscritos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children && children.length > 0 ? (
            children.map((child: any) => (
              <div key={child.id} className="glass-card-kids bg-white/70 p-4 flex flex-col justify-between h-full border border-white/50 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-[#1a1a1a] text-lg leading-tight">{child.full_name}</h3>
                    <p className="text-blue-600 font-extrabold text-sm flex items-center gap-1 mt-1">
                      <Library className="w-4 h-4" /> {child.classroom}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 shadow-inner border border-white/60 overflow-hidden">
                    <img src="/kids/kids_avatar.png" alt="Avatar" className="w-10 h-10 object-contain rounded-full" />
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/30">
                  <p className="text-[10px] font-black text-[#1a1a1a]/40 uppercase tracking-widest mb-1 mx-1">Equipe Hoje</p>
                  <ClassroomStaffDisplay classroom={child.classroom} />
                </div>
              </div>
            ))
          ) : (
             <div className="text-center p-10 bg-white/50 rounded-[2rem] text-gray-600 text-sm font-medium border border-white/40 shadow-inner col-span-full">
               Você ainda não possui filhos cadastrados para ver as turmas atribuídas.
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
