const admin = require('firebase-admin');

try {
  const serviceAccount = require('./service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Admin OK");
} catch(e) {
  // If we can't use admin, try checking if the collection exists
  console.log("No service account.");
}
