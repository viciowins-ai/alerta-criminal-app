const sharp = require('sharp');

async function generate() {
  const bg = '#0f172a'; // slate-900
  
  try {
    // First, trim the original logo to remove any transparent padding
    const trimmedLogo = await sharp('public/escudo-logo.png')
      .trim()
      .toBuffer();

    // 1. Transparent icons for Splash Screen (Logo as big as possible)
    await sharp(trimmedLogo)
      .resize(512, 512, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} })
      .toFile('public/icon-512-v2.png');

    await sharp(trimmedLogo)
      .resize(192, 192, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} })
      .toFile('public/icon-192-v2.png');

    // 2. Maskable icons with solid background (Padded for adaptive icons)
    await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } })
      .composite([{ 
        input: await sharp(trimmedLogo).resize(380, 380, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} }).toBuffer() 
      }])
      .toFile('public/icon-maskable-512-v2.png');

    await sharp({ create: { width: 192, height: 192, channels: 4, background: bg } })
      .composite([{ 
        input: await sharp(trimmedLogo).resize(140, 140, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} }).toBuffer() 
      }])
      .toFile('public/icon-maskable-192-v2.png');

    // 3. Apple Touch Icon (Solid background, slightly padded)
    await sharp({ create: { width: 180, height: 180, channels: 4, background: bg } })
      .composite([{ 
        input: await sharp(trimmedLogo).resize(150, 150, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} }).toBuffer() 
      }])
      .toFile('public/apple-touch-icon-v2.png');

    console.log('Icons generated successfully');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generate();
