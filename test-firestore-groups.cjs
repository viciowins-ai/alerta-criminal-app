const admin = require('firebase-admin');
try {
  const serviceAccount = require('./firebase-applet-config.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Admin OK");
} catch(e) {
  console.log(e.message);
}
