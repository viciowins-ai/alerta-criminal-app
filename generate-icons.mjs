import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const logoPath = './public/escudo-logo.png';
  if (!fs.existsSync(logoPath)) {
    console.error('Logo not found at', logoPath);
    return;
  }

  const bgColor = '#0f172a'; // slate-950, same as app bg

  // Create a 512x512 background
  const bg512 = Buffer.from(
    `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
       <rect width="512" height="512" rx="100" fill="${bgColor}"/>
     </svg>`
  );

  const bgMaskable512 = Buffer.from(
    `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
       <rect width="512" height="512" fill="${bgColor}"/>
     </svg>`
  );

  // Resize escudo
  // Medium size inside a maskable icon needs to be smaller (around 60% of total area) to ensure it fits the safe zone.
  const escudo = await sharp(logoPath).resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b:0, alpha: 0 } }).toBuffer();

  // Create standard icons (rounded corners can be helpful or left to OS)
  await sharp(bgMaskable512)
    .composite([{ input: escudo, gravity: 'center' }])
    .resize(512, 512)
    .toFile('./public/icon-512-v2.png');

  await sharp(bgMaskable512)
    .composite([{ input: escudo, gravity: 'center' }])
    .resize(192, 192)
    .toFile('./public/icon-192-v2.png');

  // Create Maskable icons (no rounded corners for the SVG background)
  await sharp(bgMaskable512)
    .composite([{ input: escudo, gravity: 'center' }])
    .resize(512, 512)
    .toFile('./public/icon-maskable-512-v2.png');

  await sharp(bgMaskable512)
    .composite([{ input: escudo, gravity: 'center' }])
    .resize(192, 192)
    .toFile('./public/icon-maskable-192-v2.png');

  // Apple touch icon
  await sharp(bgMaskable512)
    .composite([{ input: escudo, gravity: 'center' }])
    .resize(180, 180)
    .toFile('./public/apple-touch-icon-v2.png');

  // Favicon (since standard uses favicon.ico, we can just copy 192png to favicon.png or similar, or just leave it)
  await sharp(bgMaskable512)
    .composite([{ input: escudo, gravity: 'center' }])
    .resize(64, 64)
    .toFile('./public/favicon.png');

  console.log('Icons generated successfully.');
}

generate().catch(console.error);
