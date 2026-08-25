import sharp from 'sharp';

async function generate() {
  const logoPath = './public/escudo-logo.png';
  
  const bgBuffer = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } }
  }).png().toBuffer();

  const escudo = await sharp(logoPath).resize(480, 480, { fit: 'contain' }).png().toBuffer();

  // Composite first to get the final 512x512 image
  const compositedBuffer = await sharp(bgBuffer).composite([{ input: escudo, gravity: 'center' }]).png().toBuffer();

  // Now resize from the fully composited 512x512 image
  await sharp(compositedBuffer).toFile('./public/icon-512-v2.png');
  await sharp(compositedBuffer).toFile('./public/icon-maskable-512-v2.png');
  await sharp(compositedBuffer).resize(192, 192).toFile('./public/icon-192-v2.png');
  await sharp(compositedBuffer).resize(192, 192).toFile('./public/icon-maskable-192-v2.png');
  await sharp(compositedBuffer).resize(180, 180).toFile('./public/apple-touch-icon-v2.png');
  await sharp(compositedBuffer).resize(256, 256).toFile('./public/favicon.png');

  console.log('Icons generated successfully!');
}

generate().catch(console.error);
