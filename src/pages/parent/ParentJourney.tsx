import { useState } from "react";
import { motion } from "framer-motion";
import { useParentChildren, useParentChildCheckIns } from "@/hooks/useParentData";
import { useChildEvaluations } from "@/hooks/useChildrenMinistry";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const LEVELS = [
  {
    minCheckins: 0,  maxCheckins: 2,
    name: "Sementinha 🌱",
    color: "from-emerald-300 to-green-400",
    icon: "/kids/portal-kids-icon-children-v2.png",
    desc: "Está começando sua aventura!",
  },
  {
    minCheckins: 3,  maxCheckins: 6,
    name: "Explorador ⭐",
    color: "from-sky-300 to-blue-500",
    icon: "/kids/portal-kids-nav-classes-v2.png",
    desc: "Já está explorando o mundo Kids!",
  },
  {
    minCheckins: 7,  maxCheckins: 11,
    name: "Herói 🦸",
    color: "from-violet-400 to-purple-600",
    icon: "/kids/portal-kids-icon-ticket-v2.png",
    desc: "Um verdadeiro herói da fé!",
  },
  {
    minCheckins: 12, maxCheckins: 19,
    name: "Campeão 🏆",
    color: "from-amber-400 to-yellow-500",
    icon: "/kids/portal-kids-nav-journey-v2.png",
    desc: "Campeão de presença e dedicação!",
  },
  {
    minCheckins: 20, maxCheckins: 999,
    name: "Lenda ✨",
    color: "from-rose-400 to-pink-600",
    icon: "/kids/portal-kids-nav-profile-v2.png",
    desc: "Uma lenda viva do Portal Kids!",
  },
];

const BADGES = [
  { id: "first",   label: "1ª Presença",  icon: "/kids/portal-kids-icon-ticket-v2.png",   req: (n: number) => n >= 1  },
  { id: "three",   label: "3 Presenças",  icon: "/kids/portal-kids-nav-classes-v2.png",   req: (n: number) => n >= 3  },
  { id: "five",    label: "5 Presenças",  icon: "/kids/portal-kids-icon-calendar-v2.png", req: (n: number) => n >= 5  },
  { id: "ten",     label: "10 Presenças", icon: "/kids/portal-kids-nav-journey-v2.png",   req: (n: number) => n >= 10 },
  { id: "fifteen", label: "15 Presenças", icon: "/kids/portal-kids-nav-rewards-v2.png",   req: (n: number) => n >= 15 },
  { id: "twenty",  label: "20 Presenças", icon: "/kids/portal-kids-nav-profile-v2.png",   req: (n: number) => n >= 20 },
];

function getLevel(count: number) {
  return LEVELS.slice().reverse().find(l => count >= l.minCheckins) || LEVELS[0];
}

function getNextLevel(count: number) {
  return LEVELS.find(l => count < l.minCheckins);
}

export default function ParentJourney() {
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const { data: children, isLoading: loadingChildren } = useParentChildren();
  const { data: checkIns, isLoading: loadingCheckIns } = useParentChildCheckIns(selectedChildId || undefined);
  const { data: evaluations } = useChildEvaluations(selectedChildId || undefined);

  const checkinCount = checkIns?.length ?? 0;
  const evaluationPoints = evaluations?.reduce((acc, curr) => acc + (curr.points_earned || 0), 0) ?? 0;
  const totalPoints = (checkinCount * 10) + evaluationPoints;

  const level = getLevel(checkinCount);
  const nextLevel = getNextLevel(checkinCount);
  const progressToNext = nextLevel
    ? Math.round(((checkinCount - level.minCheckins) / (nextLevel.minCheckins - level.minCheckins)) * 100)
    : 100;

  // Last 5 evaluations for behavior stars
  const recentEvals = [...(evaluations || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5);

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
          src="/kids/portal-kids-nav-journey-v2.png"
          alt="Minha Jornada"
          className="w-16 h-16 object-contain pop-out-character"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Minha Jornada 🌟
          </h1>
          <p className="text-sm font-medium text-gray-700 mt-1">
            Evolução, conquistas e recompensas
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
              {/* XP Hero Card */}
              <motion.div
                className="glass-card-kids p-8 relative overflow-visible flex flex-col"
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
                      <h2 className="text-4xl font-black text-[#1a1a1a] leading-tight mb-1">{level.name}</h2>
                      <p className="text-sm font-bold text-gray-700">{level.desc}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs font-black text-emerald-600 bg-emerald-100/50 inline-block px-3 py-1 rounded-full border border-emerald-200">
                          {checkinCount} presença{checkinCount !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs font-black text-blue-600 bg-blue-100/50 inline-block px-3 py-1 rounded-full border border-blue-200">
                          {totalPoints} pontos ✨
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liquid Glass XP Bar */}
                {nextLevel && (
                  <div className="mt-6 border-t border-white/30 pt-6">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                      <span className="flex items-center gap-1">
                        Progresso para{" "}
                        <img src={nextLevel.icon} alt="icon" className="w-4 h-4 inline-block drop-shadow-md" />
                        <span className={`bg-gradient-to-r text-transparent bg-clip-text ${nextLevel.color}`}>
                          {nextLevel.name}
                        </span>
                      </span>
                      <span className="text-[#1a1a1a]">{progressToNext}%</span>
                    </div>
                    <div className="xp-bar-liquid">
                      <motion.div
                        className="xp-bar-liquid-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNext}%` }}
                        transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
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

              {/* Behavior Stars (últimas avaliações) */}
              {recentEvals.length > 0 && (
                <div>
                  <h3 className="font-extrabold text-lg text-[#1a1a1a] mb-3">Estrelas de Comportamento ⭐</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {recentEvals.map((ev, i) => (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1, type: "spring" }}
                        className="glass-card-kids p-4 flex flex-col items-center min-w-[6rem] bg-white/60"
                      >
                        <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={`text-sm ${s <= (ev.behavior_score || 0) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                          ))}
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 text-center leading-tight">
                          {new Date(ev.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </p>
                        {ev.points_earned > 0 && (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full mt-1">
                            +{ev.points_earned}pts
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

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
                          unlocked ? "bg-white/70 border-yellow-300" : "bg-white/30 opacity-50 grayscale"
                        }`}
                      >
                        <motion.img
                          src={badge.icon}
                          alt={badge.label}
                          className={`w-12 h-12 object-contain pop-out-character ${unlocked ? "drop-shadow-lg" : ""}`}
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

              {/* Vitrine de Recompensas */}
              <motion.div
                className="glass-card-kids p-8 flex flex-col lg:flex-row items-center gap-6 bg-gradient-to-br from-amber-50/60 to-yellow-50/60 border-amber-200/60"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.img
                  src="/kids/portal-kids-nav-rewards-v2.png"
                  alt="Baú de Recompensas"
                  className="w-28 h-28 object-contain pop-out-character drop-shadow-2xl"
                  animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                />
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="font-black text-2xl text-[#1a1a1a] mb-1">Vitrine de Recompensas</h3>
                  <p className="text-sm font-bold text-gray-700 mb-3">
                    Continue acumulando pontos para desbloquear surpresas incríveis!
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    <span className="bg-amber-100 text-amber-700 font-black text-xs px-3 py-1.5 rounded-full border border-amber-200">
                      🌟 {totalPoints} pontos acumulados
                    </span>
                    <span className="bg-purple-100 text-purple-700 font-black text-xs px-3 py-1.5 rounded-full border border-purple-200">
                      🎯 Nível: {level.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </>
      )}

      {!selectedChildId && (
        <div className="glass-card-kids px-6 py-12 flex flex-col items-center text-center bg-white/60">
          <motion.img
            src="/kids/portal-kids-nav-rewards-v2.png"
            alt="Baú"
            className="w-24 h-24 object-contain pop-out-character mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
          <p className="font-extrabold text-[#1a1a1a] text-xl">Selecione um filho</p>
          <p className="text-sm text-gray-600 font-medium mt-1">para ver a jornada completa</p>
        </div>
      )}
    </motion.div>
  );
}
