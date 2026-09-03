import sharp from 'sharp';
import fs from 'fs';

const input = 'public/escudo-logo.png';
const bg = '#0f172a'; // slate-900

async function generate() {
  try {
    const trimmedLogo = await sharp(input).trim().toBuffer();

    // PWA transparent icons
    await sharp(trimmedLogo)
      .resize(512, 512, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} })
      .toFile('public/pwa-512x512.png');
      
    await sharp(trimmedLogo)
      .resize(192, 192, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} })
      .toFile('public/pwa-192x192.png');

    // Apple Touch Icon (Solid background)
    await sharp({ create: { width: 180, height: 180, channels: 4, background: bg } })
      .composite([{ 
         input: await sharp(trimmedLogo).resize(150, 150, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} }).toBuffer() 
       }])
      .toFile('public/apple-touch-icon-new.png');

    // WhatsApp friendly OG image (JPEG, under 300KB)
    await sharp(trimmedLogo)
      .resize(800, 800, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
      .jpeg({ quality: 80 })
      .toFile('public/og-image.jpg');

    // Favicon
    await sharp(trimmedLogo)
      .resize(32, 32)
      .png()
      .toFile('public/favicon.ico');

    console.log('All icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generate();
