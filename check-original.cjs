const sharp = require('sharp');

async function check() {
  const metadata = await sharp('public/escudo-logo.png').metadata();
  console.log('escudo-logo metadata:', metadata.width, metadata.height);
  
  const trimmed = await sharp('public/escudo-logo.png').trim().toBuffer({ resolveWithObject: true });
  console.log('Trimmed size:', trimmed.info.width, trimmed.info.height);
}

check();
