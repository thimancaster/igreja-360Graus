import { motion } from "framer-motion";
import { 
  FileSpreadsheet, 
  Link2, 
  PieChart, 
  Users, 
  Bell,
  Calendar,
  QrCode,
  Baby,
  ClipboardList,
  MessageSquare,
  CreditCard,
  Shield,
  Download,
  Repeat,
  Layers,
  HandHeart
} from "lucide-react";
import { MotionCard, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    category: "Financeiro",
    icon: FileSpreadsheet,
    title: "Gestão Financeira",
    description: "Controle total de receitas, despesas, dízimos e ofertas com importação inteligente de planilhas.",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    category: "Financeiro",
    icon: Link2,
    title: "Integração Google Sheets",
    description: "Sincronize automaticamente com suas planilhas existentes. Mapeamento automático de colunas.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    category: "Financeiro",
    icon: PieChart,
    title: "Dashboards Interativos",
    description: "Visualize receitas, despesas e fluxo de caixa com gráficos modernos e relatórios em tempo real.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    category: "Membros",
    icon: Users,
    title: "Gestão de Membros",
    description: "Cadastro completo, histórico de participação, permissões e níveis de acesso personalizados.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    category: "Membros",
    icon: HandHeart,
    title: "Cartão de Membro",
    description: "Carteirinha digital com QR code para identificação rápida e controle de acesso.",
    gradient: "from-cyan-500 to-teal-500",
  },
  {
    category: "Eventos",
    icon: Calendar,
    title: "Criação de Eventos",
    description: "Crie eventos completos com descrição, data, local, capacidade e configurações avançadas.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    category: "Eventos",
    icon: QrCode,
    title: "Check-in por QR Code",
    description: "Registro de presença rápido via QR Code. Controle de entrada e saída de participantes.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    category: "Eventos",
    icon: CreditCard,
    title: "Eventos Pagos & PIX",
    description: "Venda de ingressos com pagamento via PIX, cartão de crédito e débido via MercadoPago.",
    gradient: "from-lime-500 to-emerald-500",
  },
  {
    category: "Ministry",
    icon: Baby,
    title: "Ministério Infantil",
    description: "Gestão de crianças e adolescentes com autorização dos pais, check-in Seguro e relatórios.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    category: "Ministry",
    icon: ClipboardList,
    title: "Escalas de Voluntários",
    description: "Crie e gerencie escalas de voluntários para ministérios. Envio automático de notificações.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    category: "Ministry",
    icon: MessageSquare,
    title: "Comunicados",
    description: "Envie notificações e comunicados para toda a igreja ou grupos específicos via push.",
    gradient: "from-red-500 to-orange-500",
  },
  {
    category: "Geral",
    icon: Download,
    title: "Relatórios Exportáveis",
    description: "Exporte relatórios em PDF e Excel para apresentações e prestação de contas ao conselho.",
    gradient: "from-slate-500 to-zinc-500",
  },
  {
    category: "Geral",
    icon: Bell,
    title: "Alertas Inteligentes",
    description: "Receba notificações de contas a vencer, pagamentos atrasados, metas e lembretes importantes.",
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    category: "Geral",
    icon: Shield,
    title: "Segurança Total",
    description: "Dados criptografados, backup automático e permissões granulares. Sua informação protegida.",
    gradient: "from-slate-600 to-gray-500",
  },
];

export const FeaturesSection = () => {
  const categories = [
    { key: "Financeiro", label: "Financeiro", color: "text-emerald-400" },
    { key: "Membros", label: "Membros", color: "text-orange-400" },
    { key: "Eventos", label: "Eventos", color: "text-violet-400" },
    { key: "Ministry", label: "Ministério", color: "text-cyan-400" },
    { key: "Geral", label: "Geral", color: "text-slate-400" },
  ];

  const groupedFeatures = categories.map(cat => ({
    ...cat,
    features: features.filter(f => f.category === cat.key)
  }));

  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/15 to-background" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="text-xs md:text-sm font-medium text-primary uppercase tracking-wider">Recursos</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-3 md:mt-4 mb-4 md:mb-6">
            Tudo que sua igreja{" "}
            <span className="gradient-text">precisa</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Uma plataforma completa que unifica finanças, membros, eventos eministérios em um só lugar.
          </p>
        </motion.div>

        {groupedFeatures.map((group) => (
          <div key={group.key} className="mb-12 last:mb-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-6"
            >
              <h3 className={`text-lg font-semibold ${group.color}`}>{group.label}</h3>
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </motion.div>
            
            <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {group.features.map((feature, index) => (
                <StaggerItem key={feature.title}>
                  <MotionCard
                    hoverLift
                    glowOnHover
                    className="glass-card p-4 md:p-5 h-full border border-border/50 hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className={`w-10 h-10 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-5 h-5 md:w-5 md:h-5 text-white" />
                    </div>
                    <h3 className="text-sm md:text-base font-semibold mb-1.5">{feature.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </MotionCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        ))}
      </div>
    </section>
  );
};
