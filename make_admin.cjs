const admin = require('firebase-admin');
try {
  admin.initializeApp({ projectId: "alerta-criminal-c1612" });
  const db = admin.firestore();
  
  async function run() {
    const email = "viciowins@gmail.com";
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) {
      console.log('No user found.');
      return;
    }
    
    for (const doc of snapshot.docs) {
      console.log(`Updating user ${doc.id}`);
      await doc.ref.update({ role: 'guard' });
      console.log('Updated role to guard');
    }
  }
  
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
} catch (e) {
  console.error("Failed", e);
}
