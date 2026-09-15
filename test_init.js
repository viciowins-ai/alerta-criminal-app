import fs from 'fs';
import admin from 'firebase-admin';

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("SUCCESS!");
} catch (e) {
  console.error("FAIL:", e);
}
