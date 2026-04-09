const LANDING_PROMPTS = {
  hero: {
    prompt: "Elegante dashboard de gestão eclesiástica em estilo glassmorphism, cores azul e dourado, métricas financeiras, membros, eventos. Interface moderna minimalist, iluminação suave, fundo desfocado de templo cristão moderno, 16:9, 4k, photorealistic, professional lighting"
  },
  problem: {
    prompt: "Homem frustrado cercado de papéis, planilhas desorganizadas, caos administrativo, expressão stressed, iluminação dramática, estilo photographique, cinematic"
  },
  solution: {
    prompt: "Mulher pastor sorrindo usando tablet, equipe atrás dela happy, escritório moderno de igreja, tecnologia clean, glassmorphism UI, warm natural lighting, professional photography"
  },
  features: {
    prompt: "Ícones elegant de gestão: nota fiscal, calendário, pessoas, coração, segurança, em estilo flat design minimal, cores dourado e azul, white background, vector illustration"
  },
  pricing: {
    prompt: "Three premium cards pricing table, church management software, gradient background azul e dourado, professional, modern UI, 3d render"
  },
  howItWorks: {
    prompt: "Step 1-2-3 icons: signup, configure, grow, minimal elegant design, circle icons with numbers, church theme, gold and blue, vector"
  },
  testimonials: {
    prompt: "Professional headshot pastor brasileiro, 40s, smiling, church background, warm lighting, portrait photography, corporate style"
  },
  cta: {
    prompt: "Grand church interior, warm golden light through stained glass, empty pews, inspiring, cinematic, 4k, awe"
  }
} as const;

export type LandingSection = keyof typeof LANDING_PROMPTS;

export const getLandingPrompt = (section: LandingSection): string => {
  return LANDING_PROMPTS[section].prompt;
};

export const LANDING_IMAGES = {
  hero: '/images/landing/hero.png',
  problem: '/images/landing/problem.png',
  solution: '/images/landing/solution.png',
  features: '/images/landing/features.png',
  pricing: '/images/landing/pricing.png',
  howItWorks: '/images/landing/howItWorks.png',
  testimonials: '/images/landing/testimonials.png',
  cta: '/images/landing/cta.png',
} as const;