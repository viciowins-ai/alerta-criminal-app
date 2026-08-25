const sharp = require('sharp');

async function check() {
  const metadata = await sharp('public/icon-512.png').metadata();
  console.log('icon-512 metadata:', metadata.width, metadata.height);
  
  const trimmed = await sharp('public/icon-512.png').trim().toBuffer({ resolveWithObject: true });
  console.log('Trimmed size:', trimmed.info.width, trimmed.info.height);
}

check();
