import fs from 'fs';
import { removeBackground } from '@imgly/background-removal-node';
import path from 'path';

async function processImage(filename) {
  console.log(`Processing ${filename}...`);
  try {
    const filePath = `file://${path.resolve(`public/kids/${filename}`)}`;
    const blob = await removeBackground(filePath);
    const resultBuffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync(`public/kids/${filename}`, resultBuffer);
    console.log(`Saved transparent version of ${filename}`);
  } catch(e) {
    console.error(`Error processing ${filename}`, e);
  }
}

async function run() {
  const files = [
    'kids_event.png', 'icon_home.png', 'icon_eventos.png', 
    'icon_bible.png', 'icon_ticket.png', 'icon_trophy.png', 
    'icon_sair.png', 'icon_paintbrush.png', 'icon_meus_filhos.png', 
    'icon_calendar.png'
  ];
  for(const file of files) {
    if(fs.existsSync(`public/kids/${file}`)) {
      await processImage(file);
    } else {
      console.log(`File not found: ${file}`);
    }
  }
  console.log('All done!');
}
run();
