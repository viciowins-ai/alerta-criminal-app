const fs = require('fs');
let data = JSON.parse(fs.readFileSync('src/i18n/locales/es.json', 'utf8'));

data.tutorial.groupsTitle = "👥 ¿Cómo funcionan los Grupos Privados (Redes de Vecinos)?";
data.tutorial.groupsDesc = "Crea o únete a Redes Privadas con tus vecinos o familiares. Al reportar un incidente, puedes elegir si será <strong>Público</strong> (visible para todos en la aplicación) o <strong>Privado</strong> (restringido solo a los miembros de tu grupo). Las alertas privadas aparecen en el mapa con un icono de candado (🔒).";

fs.writeFileSync('src/i18n/locales/es.json', JSON.stringify(data, null, 2));
