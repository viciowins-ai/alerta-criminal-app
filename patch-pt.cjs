const fs = require('fs');
let data = JSON.parse(fs.readFileSync('src/i18n/locales/pt.json', 'utf8'));

data.tutorial.groupsTitle = "👥 Como funcionam os Grupos Privados (Redes de Vizinhos)?";
data.tutorial.groupsDesc = "Crie ou participe de Redes Privadas com seus vizinhos ou familiares. Ao relatar uma ocorrência, você pode escolher se ela será <strong>Pública</strong> (visível para todos no aplicativo) ou <strong>Privada</strong> (restrita apenas aos membros do seu grupo). Alertas privados aparecem no mapa com um ícone de cadeado (🔒).";

fs.writeFileSync('src/i18n/locales/pt.json', JSON.stringify(data, null, 2));
