import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const logoPath = './public/escudo-logo.png';
  const bgColor = '#0f172a';

  const bgBuffer = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
    }
  }).png().toBuffer();

  const escudo = await sharp(logoPath).resize(340, 340, { fit: 'contain', background: { r: 0, g: 0, b:0, alpha: 0 } }).png().toBuffer();

  const baseImage = () => sharp(bgBuffer).composite([{ input: escudo, gravity: 'center' }]);

  await baseImage().toFile('./public/icon-512-v2.png');
  await baseImage().resize(192, 192).toFile('./public/icon-192-v2.png');
  await baseImage().toFile('./public/icon-maskable-512-v2.png');
  await baseImage().resize(192, 192).toFile('./public/icon-maskable-192-v2.png');
  await baseImage().resize(180, 180).toFile('./public/apple-touch-icon-v2.png');
  await baseImage().resize(256, 256).toFile('./public/favicon.png');

  console.log('Icons generated successfully!');
}

generate().catch(console.error);
