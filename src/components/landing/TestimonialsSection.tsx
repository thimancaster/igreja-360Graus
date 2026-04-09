import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { MotionCard, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Pastor João Silva",
    role: "Igreja Batista Central - São Paulo",
    avatar: "",
    content: "O Igreja360 transformou completamente nossa gestão. Antes gastávamos horas com planilhas, agora tudo está automatizado. O check-in de eventos via QRCode é incredible!",
    rating: 5,
    church: "450 membros",
  },
  {
    name: "Maria Santos",
    role: "Tesoureira - Comunidade Cristã",
    avatar: "",
    content: "A integração com Google Sheets mudou minha vida. Não precisei mudar minha forma de trabalhar, apenas conectei e pronto. Relatórios automáticos toda semana!",
    rating: 5,
    church: "120 membros",
  },
  {
    name: "Pr. Carlos Oliveira",
    role: "Pastor Executivo - Igreja Metodista Renovada",
    avatar: "",
    content: "Finalmente consigo apresentar relatórios claros para o conselho. A visualização por ministérios e o controle de dízimos me ajuda nas decisões estratégicas.",
    rating: 5,
    church: "280 membros",
  },
  {
    name: "Ana Paula",
    role: "Coordenadora - Ministério Infantil",
    avatar: "",
    content: "O módulo de ministério infantil é fantastic. Pais amam o check-in seguro das crianças e recebo autorizações digitais. Muito mais prático!",
    rating: 5,
    church: "85 crianças",
  },
  {
    name: "Roberto Alves",
    role: "Líder de Louvor",
    avatar: "",
    content: "As escalas de voluntários facilitaram demais nossa vida. Todo mundo recebe a notificação no dia certo e nunca mais esquecemos de alguém.",
    rating: 5,
    church: "35 voluntários",
  },
  {
    name: "Pr. Paulo Mendes",
    role: "Pastor Principal",
    avatar: "",
    content: "Começamos com o plano gratuito e em 3 meses migramos para o Pro. O suporte é excelente e a plataforma só melhora. Recomendo para todas as igrejas.",
    rating: 5,
    church: "520 membros",
  },
];

export const TestimonialsSection = () => {
  return (
    <section id="depoimentos" className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="text-xs md:text-sm font-medium text-primary uppercase tracking-wider">Depoimentos</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-3 md:mt-4 mb-4 md:mb-6">
            O que dizem{" "}
            <span className="gradient-text">nossos usuários</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Igrejas de todo o Brasil estão transformando sua gestão com o Igreja360.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <StaggerItem key={testimonial.name}>
              <MotionCard
                hoverLift
                className="glass-card p-5 md:p-6 h-full border border-border/50 relative overflow-hidden"
              >
                {/* Quote Icon */}
                <div className="absolute top-3 right-3 md:top-4 md:right-4 opacity-10">
                  <Quote className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                </div>

                {/* Rating */}
                <div className="flex gap-0.5 md:gap-1 mb-3 md:mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 md:mb-5 relative z-10">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-11 h-11 md:w-12 md:h-12 ring-2 ring-primary/20">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-xs md:text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.church}</p>
                  </div>
                </div>
              </MotionCard>
            </StaggerItem>
          ))}
        </div>
      </div>
    </section>
  );
};
