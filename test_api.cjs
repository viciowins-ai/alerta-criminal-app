const admin = require('firebase-admin');
const fs = require('fs');

async function run() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
  admin.initializeApp({ projectId: config.projectId });
  
  const customToken = await admin.auth().createCustomToken('test-uid');
  console.log("Custom token:", customToken);
  // Custom tokens can't be used to verifyIdToken directly, we'd need to exchange it for an ID token via Google Identity API.
  // Instead, let's just write to Firestore directly using Admin SDK to verify it works.
  
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
