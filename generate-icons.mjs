import sharp from 'sharp';
import fs from 'fs';

const input = 'public/escudo-logo.png';

async function generate() {
  await sharp(input).resize(192, 192).toFile('public/pwa-192x192.png');
  await sharp(input).resize(512, 512).toFile('public/pwa-512x512.png');
  await sharp(input).resize(180, 180).toFile('public/apple-touch-icon-new.png');
  await sharp(input).resize(32, 32).toFile('public/favicon-32x32.png');
  // For OG image, WhatsApp recommends 1200x630 or 1:1, let's use 1024x1024 as it is, just copy it to a new name.
  fs.copyFileSync(input, 'public/og-image-shield.png');
  console.log('Icons generated successfully.');
}

generate().catch(console.error);
