const admin = require('firebase-admin');
const fs = require('fs');

async function run() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
  admin.initializeApp({ projectId: config.projectId });
  const db = admin.firestore();
  await db.collection('comments').add({
    itemId: 'test-item',
    itemType: 'post',
    content: 'Teste direto no banco',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log("Written to DB via Admin!");
}
run().catch(console.error);
