import { motion } from "framer-motion";
import { FileSpreadsheet, Clock, Eye, Users, ArrowRight } from "lucide-react";
import { MotionCard, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { Button } from "@/components/ui/button";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Planilhas Desorganizadas",
    description: "Múltiplas planilhas sem integração, fórmulas quebradas e dados inconsistentes.",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    icon: Clock,
    title: "Tempo Perdido",
    description: "Horas gastas consolidando dados manualmente que poderiam ser investidas no ministério.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Eye,
    title: "Falta de Visibilidade",
    description: "Sem uma visão clara, é difícil tomar decisões estratégicas para a igreja.",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
  },
  {
    icon: Users,
    title: "Gestão Fragmentada",
    description: "Informações de membros, finanças e eventos em sistemas diferentes e desconectados.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

export const ProblemSection = () => {
  return (
    <section id="problema" className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="text-xs md:text-sm font-medium text-primary uppercase tracking-wider">Por Que Escolher</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-3 md:mt-4 mb-4 md:mb-6">
            Chega de.planilhas复杂as e gestão manual
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Deixe para trás os métodos antiquados. O Igreja360 resolve os principais desafios da gestão eclesiástica.
          </p>
        </motion.div>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {problems.map((problem, index) => (
            <StaggerItem key={problem.title}>
              <MotionCard
                hoverLift
                className="glass-card p-4 md:p-6 h-full border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${problem.bgColor} flex items-center justify-center mb-3 md:mb-5`}>
                  <problem.icon className={`w-5 h-5 md:w-7 md:h-7 ${problem.color}`} />
                </div>
                <h3 className="text-sm md:text-lg font-semibold mb-1.5 md:mb-3">{problem.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {problem.description}
                </p>
              </MotionCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-10 md:mt-14"
        >
          <a href="#solucao">
            <Button variant="outline" className="glass border-border/50">
              Ver como resolvemos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
};