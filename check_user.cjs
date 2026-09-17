const admin = require('firebase-admin');
admin.initializeApp();
async function run() {
  const db = admin.firestore();
  const users = await db.collection('users').where('email', '==', 'viciowins@gmail.com').get();
  users.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}
run();
