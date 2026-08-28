import sharp from 'sharp';
import fs from 'fs';

const input = 'public/escudo-logo.png';

async function generate() {
  // WhatsApp friendly OG image (JPEG, under 300KB)
  await sharp(input)
    .resize(800, 800, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .jpeg({ quality: 80 })
    .toFile('public/og-image.jpg');

  // Favicon for Google
  await sharp(input)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.ico');
    
  console.log('Fixed images generated successfully.');
}

generate().catch(console.error);
