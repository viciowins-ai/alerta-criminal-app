const fs = require('fs');
let data = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));

data.tutorial.groupsTitle = "👥 How do Private Groups (Neighbor Networks) work?";
data.tutorial.groupsDesc = "Create or join Private Networks with your neighbors or family. When reporting an incident, you can choose if it will be <strong>Public</strong> (visible to everyone in the app) or <strong>Private</strong> (restricted only to your group members). Private alerts appear on the map with a padlock icon (🔒).";

fs.writeFileSync('src/i18n/locales/en.json', JSON.stringify(data, null, 2));
