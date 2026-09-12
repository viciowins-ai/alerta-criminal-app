const admin = require('firebase-admin');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
admin.initializeApp({ projectId: config.projectId });
const db = admin.firestore();

async function run() {
  try {
    const q = db.collection('comments').where('itemId', '==', 'dummy').orderBy('createdAt', 'asc');
    await q.get();
    console.log("Success!");
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
