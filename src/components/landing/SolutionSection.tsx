import { motion } from "framer-motion";
import { Users, Calendar, Wallet, Settings, BarChart3, CheckCircle, Clock } from "lucide-react";
import { TiltCard } from "@/components/ui/motion-primitives";
import { Badge } from "@/components/ui/badge";

const solutions = [
  {
    icon: Users,
    badge: "Membros",
    title: "Gestão Completa de Membros",
    description: "Cadastre todos os membros da sua igreja com informações detalhadas. Controle de participação, histórico de presença e permissões personalizadas para líderes e tesoureiros.",
    image: "/mockups/members-management.png",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Wallet,
    badge: "Finanças",
    title: "Controle Financeiro Inteligente",
    description: "Dízimos, ofertas e contribuições organizados em um só lugar. Importe planilhas do Google Sheets ou Excel e tenha dashboards em tempo real com visão clara das finanças.",
    image: "/mockups/financial-dashboard.png",
    color: "from-emerald-500 to-green-500",
  },
  {
    icon: Calendar,
    badge: "Eventos",
    title: "Eventos com Check-in QR",
    description: "Crie eventos, venda ingressos online e faça controle de presença via QR Code. Perfeito para congressos, retreats, cursos e encontros.",
    image: "/mockups/events-checkin.png",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Settings,
    badge: "Ministry",
    title: "Ministério Infantil & Escalas",
    description: "Gestão segura de crianças com autorização dos pais. Crie escalas de voluntários e envie notificações automaticamente para toda a equipe.",
    image: "/mockups/ministry-schedule.png",
    color: "from-cyan-500 to-teal-500",
  },
];

export const SolutionSection = () => {
  return (
    <section id="solucao" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">A Solução</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-6">
            Conheça o{" "}
            <span className="gradient-text">Igreja360</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa que unifica gestão de membros, finanças, eventos e ministérios em um só lugar.
          </p>
        </motion.div>

        <div className="space-y-32">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "lg:grid-flow-dense" : ""
              }`}
            >
              {/* Content */}
              <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                <Badge 
                  variant="outline" 
                  className={`mb-4 px-3 py-1 bg-gradient-to-r ${solution.color} bg-clip-text text-transparent border-primary/30`}
                >
                  <solution.icon className="w-4 h-4 mr-2 text-primary" />
                  {solution.badge}
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  {solution.title}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {solution.description}
                </p>
              </div>

              {/* Image */}
              <div className={index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}>
                <TiltCard className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${solution.color} opacity-20 rounded-2xl blur-xl group-hover:opacity-30 transition-opacity`} />
                  <div className="relative glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                    <img
                      src={solution.image}
                      alt={solution.title}
                      className="w-full h-auto"
                      onError={(e) => {
                        e.currentTarget.src = "/fallback-mockup.png";
                      }}
                    />
                  </div>
                </TiltCard>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
