import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const LANDING_PROMPTS = {
  hero: "Elegant church management dashboard, glassmorphism UI, blue and gold color scheme, financial metrics, members, events. Modern minimalist interface, soft lighting, blurred background of modern church, 16:9, 4k, photorealistic, professional lighting",
  
  problem: "Frustrated man surrounded by papers, disorganized spreadsheets, administrative chaos, stressed expression, dramatic lighting, photographic style, cinematic",
  
  solution: "Smiling female pastor using tablet, team behind her happy, modern church office, clean technology, glassmorphism UI, warm natural lighting, professional photography",
  
  features: "Elegant icons: invoice, calendar, people, heart, security, flat minimal design style, gold and blue colors, white background, vector illustration",
  
  pricing: "Three premium pricing cards, church management software, blue and gold gradient background, professional, modern UI, 3d render",
  
  howItWorks: "Step 1-2-3 icons: signup, configure, grow, minimal elegant design, circle icons with numbers, church theme, gold and blue, vector",
  
  testimonials: "Professional headshot Brazilian pastor, 40s, smiling, church background, warm lighting, portrait photography, corporate style",
  
  cta: "Grand church interior, warm golden light through stained glass, empty pews, inspiring, cinematic, 4k, awe-inspiring"
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY não configurada');
  process.exit(1);
}

async function generateImage(prompt) {
  console.log(`📡 Gerando...`);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE']
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Erro ${response.status}:`, error);
    return null;
  }

  const data = await response.json();
  
  if (data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
    return data.candidates[0].content.parts[0].inlineData.data;
  }
  
  console.error('❌ Sem imagem. Response:', JSON.stringify(data, null, 2));
  return null;
}

const outputDir = join(process.cwd(), 'public', 'images', 'landing');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Gerando imagens para Landing Page...\n');

for (const [name, prompt] of Object.entries(LANDING_PROMPTS)) {
  console.log(`📌 ${name}:`);
  
  const base64 = await generateImage(prompt);
  
  if (base64) {
    const buffer = Buffer.from(base64, 'base64');
    const filepath = join(outputDir, `${name}.png`);
    writeFileSync(filepath, buffer);
    console.log(`   ✅ Salvo: ${name}.png`);
  } else {
    console.log(`   ❌ Falhou`);
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
}

console.log('\n✨ Concluído!');