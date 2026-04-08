import { useState } from "react";
import { motion } from "framer-motion";
import { useParentChildren, useParentChildCheckIns } from "@/hooks/useParentData";
import { useChildEvaluations } from "@/hooks/useChildrenMinistry";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// ── Level definitions
const LEVELS = [
  { minCheckins: 0,  maxCheckins: 2,  name: "Sementinha 🌱",    color: "from-emerald-300 to-green-400",    icon: "/kids/icon_meus_filhos.png", desc: "Está começando sua aventura!" },
  { minCheckins: 3,  maxCheckins: 6,  name: "Explorador ⭐",    color: "from-sky-300 to-blue-500",         icon: "/kids/icon_bible.png", desc: "Já está explorando o mundo Kids!" },
  { minCheckins: 7,  maxCheckins: 11, name: "Herói 🦸",          color: "from-violet-400 to-purple-600",    icon: "/kids/icon_ticket.png", desc: "Um verdadeiro herói da fé!" },
  { minCheckins: 12, maxCheckins: 19, name: "Campeão 🏆",        color: "from-amber-400 to-yellow-500",     icon: "/kids/icon_trophy.png", desc: "Campeão de presença e dedicação!" },
  { minCheckins: 20, maxCheckins: 999, name: "Lenda ✨",          color: "from-rose-400 to-pink-600",        icon: "/kids/icon_calendar.png", desc: "Uma lenda viva do Portal Kids!" },
];

const BADGES = [
  { id: "first",    label: "1ª Presença",       icon: "/kids/icon_eventos.png", req: (n: number) => n >= 1  },
  { id: "three",    label: "3 Presenças",        icon: "/kids/icon_ticket.png", req: (n: number) => n >= 3  },
  { id: "five",     label: "5 Presenças",        icon: "/kids/icon_paintbrush.png",  req: (n: number) => n >= 5  },
  { id: "ten",      label: "10 Presenças",       icon: "/kids/icon_trophy.png", req: (n: number) => n >= 10 },
  { id: "fifteen",  label: "15 Presenças",       icon: "/kids/icon_bible.png", req: (n: number) => n >= 15 },
  { id: "twenty",   label: "20 Presenças",       icon: "/kids/kids_event.png", req: (n: number) => n >= 20 },
];

function getLevel(count: number) {
  return LEVELS.slice().reverse().find(l => count >= l.minCheckins) || LEVELS[0];
}

function getNextLevel(count: number) {
  return LEVELS.find(l => count < l.minCheckins);
}

export default function ParentRewards() {
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const { data: children, isLoading: loadingChildren } = useParentChildren();
  const { data: checkIns, isLoading: loadingCheckIns } = useParentChildCheckIns(selectedChildId || undefined);
  const { data: evaluations } = useChildEvaluations(selectedChildId || undefined);

  const checkinCount = checkIns?.length ?? 0;
  const evaluationPoints = evaluations?.reduce((acc, curr) => acc + (curr.points_earned || 0), 0) ?? 0;
  const totalPoints = (checkinCount * 10) + evaluationPoints; // 10 points per checkin + evaluation points

  const level = getLevel(checkinCount);
  const nextLevel = getNextLevel(checkinCount);
  const progressToNext = nextLevel
    ? Math.round(((checkinCount - level.minCheckins) / (nextLevel.minCheckins - level.minCheckins)) * 100)
    : 100;

  if (loadingChildren) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 space-y-6 pt-4 px-4 pb-32 min-h-screen"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <motion.img
          src="/kids/icon_trophy.png"
          alt="Recompensas"
          className="w-16 h-16 object-contain pop-out-character"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Recompensas Kids 🏆
          </h1>
          <p className="text-sm font-medium text-gray-700 mt-1">
            Conquistas e níveis do seu filho
          </p>
        </div>
      </div>

      {/* Child Selector */}
      <div className="glass-card-kids p-4 pt-6 bg-white/60">
        <Label className="text-sm font-medium mb-2 block">Selecionar Filho</Label>
        <Select value={selectedChildId} onValueChange={setSelectedChildId}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Escolha uma criança 👧" />
          </SelectTrigger>
          <SelectContent>
            {children?.map((child: any) => (
              <SelectItem key={child.id} value={child.id}>
                {child.full_name} — {child.classroom}
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
          ) : (
            <>
              {/* Level Card */}
              <motion.div
                className={`glass-card-kids p-8 relative overflow-visible flex flex-col`}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
              >
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <motion.img
                      src={level.icon}
                      alt={level.name}
                      className="w-24 h-24 object-contain pop-out-character drop-shadow-xl"
                      animate={{ rotate: [0, -5, 5, 0], y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Nível Atual</p>
                      <h2 className="text-4xl font-black text-[#1a1a1a] leading-tight mb-1">{level.name.split(' ')[0]} <span className={`bg-gradient-to-r text-transparent bg-clip-text ${level.color}`}>{level.name.split(' ')[1] || ''}</span></h2>
                      <p className="text-sm font-bold text-gray-700">{level.desc}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <p className="text-xs font-black text-emerald-600 bg-emerald-100/50 inline-block px-3 py-1 rounded-full border border-emerald-200">
                          {checkinCount} presença{checkinCount !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs font-black text-blue-600 bg-blue-100/50 inline-block px-3 py-1 rounded-full border border-blue-200">
                          {totalPoints} pontos totais ✨
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress to next level */}
                {nextLevel && (
                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                      <span className="flex items-center gap-1">Progresso para <img src={nextLevel.icon} alt="icon" className="w-4 h-4 inline-block drop-shadow-md" /> <span className={`bg-gradient-to-r text-transparent bg-clip-text ${nextLevel.color}`}>{nextLevel.name}</span></span>
                      <span className="text-[#1a1a1a]">{progressToNext}%</span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${nextLevel.color} rounded-full shadow-md`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNext}%` }}
                        transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs font-extrabold text-orange-500 mt-2 text-right">
                      Faltam {nextLevel.minCheckins - checkinCount} presença(s)
                    </p>
                  </div>
                )}

                {!nextLevel && (
                  <div className="mt-4 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-2xl px-4 py-3 text-center shadow-sm">
                    <p className="text-sm font-black text-amber-700">🎊 Nível máximo atingido! Você é incrível!</p>
                  </div>
                )}
              </motion.div>

              {/* Badges */}
              <div>
                <h3 className="font-extrabold text-lg text-[#1a1a1a] mb-3">Conquistas 🎖️</h3>
                <div className="grid grid-cols-3 gap-3">
                  {BADGES.map((badge, i) => {
                    const unlocked = badge.req(checkinCount);
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08, type: "spring", stiffness: 150 }}
                        className={`glass-card-kids p-4 flex flex-col items-center justify-center gap-2 text-center transition-all ${
                          unlocked
                            ? "bg-white/70 border-yellow-300"
                            : "bg-white/30 opacity-50 grayscale"
                        }`}
                      >
                        <motion.img
                          src={badge.icon}
                          alt={badge.label}
                          className={`w-12 h-12 object-contain pop-out-character ${unlocked ? 'drop-shadow-lg' : ''}`}
                          animate={unlocked ? { rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 3.5, delay: i * 0.3 }}
                        />
                        <p className={`text-[11px] font-extrabold leading-tight ${unlocked ? "text-gray-800" : "text-gray-400"}`}>
                          {badge.label}
                        </p>
                        {unlocked && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ✓ Conquistada
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!selectedChildId && (
        <div className="glass-card-kids px-6 py-12 flex flex-col items-center text-center bg-white/60">
          <motion.div
            className="text-6xl mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            🏆
          </motion.div>
          <p className="font-extrabold text-[#1a1a1a] text-xl">Selecione um filho</p>
          <p className="text-sm text-gray-600 font-medium mt-1">para ver as recompensas e conquistas</p>
        </div>
      )}
    </motion.div>
  );
}
