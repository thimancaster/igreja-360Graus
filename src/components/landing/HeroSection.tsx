import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Users, Shield, Calendar, Wallet, HandHeart } from "lucide-react";
import { TiltCard, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const floatingCards = [
  { icon: Wallet, label: "Receitas", value: "+23%", color: "text-success", bg: "bg-success/20" },
  { icon: Users, label: "Membros", value: "245", color: "text-primary", bg: "bg-primary/20" },
  { icon: Calendar, label: "Eventos", value: "12", color: "text-cyan-400", bg: "bg-cyan-400/20" },
];

export const HeroSection = () => {
  const stats = [
    { icon: Users, value: "50+", label: "Igrejas" },
    { icon: HandHeart, value: "5.000+", label: "Membros" },
    { icon: Calendar, value: "200+", label: "Eventos" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 md:pt-20 md:pb-0 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 mesh-gradient opacity-30" />
      <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px]" />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-secondary/15 rounded-full blur-[80px]" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <StaggerContainer className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <StaggerItem>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4 md:mb-6"
              >
                <Badge variant="outline" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm glass border-primary/30">
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 text-primary" />
                  <span className="gradient-text font-medium">Plataforma #1 do Brasil</span>
                </Badge>
                <Badge variant="outline" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm glass border-success/30">
                  <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 text-success" />
                  <span className="text-success font-medium">100% Seguro</span>
                </Badge>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 md:mb-6">
                Gestão completa para{" "}
                <span className="gradient-text">sua igreja</span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0">
                Transforme a gestão da sua igreja em uma experiência simples e eficiente. 
                Finanças, membros, eventos, escalas e muito mais em um só lugar.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start mb-8 md:mb-12">
                <Link to="/auth?register=true">
                  <Button size="lg" ripple animate className="w-full sm:w-auto text-sm md:text-base px-6 md:px-8 py-5 md:py-6 shadow-xl shadow-primary/25">
                    Começar Gratuitamente
                    <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </Link>
                <a href="#precos">
                  <Button variant="outline" size="lg" animate className="w-full sm:w-auto text-sm md:text-base px-6 md:px-8 py-5 md:py-6 glass border-border/50">
                    Ver Planos
                  </Button>
                </a>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="flex items-center justify-center lg:justify-start gap-6 md:gap-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1">
                      <stat.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                      <span className="text-xl md:text-2xl font-bold gradient-text">{stat.value}</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </StaggerItem>
          </div>

          {/* Right Content - Dashboard Mockup */}
          <StaggerItem>
            <TiltCard className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10" />
                <img
                  src="/mockups/dashboard-overview.png"
                  alt="Dashboard Igreja360"
                  className="w-full h-auto relative z-10"
                  onError={(e) => {
                    e.currentTarget.src = "/fallback-mockup.png";
                  }}
                />
                {/* Floating Elements */}
                {floatingCards.map((card, index) => (
                  <motion.div
                    key={card.label}
                    className={`absolute glass-card p-3 rounded-xl shadow-lg ${index === 0 ? '-top-4 -right-4' : index === 1 ? 'top-1/3 -left-6' : 'bottom-20 right-0'}`}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3 + index * 0.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${card.bg} flex items-center justify-center`}>
                        <card.icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className={`text-sm font-bold ${card.color}`}>{card.value}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TiltCard>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};
