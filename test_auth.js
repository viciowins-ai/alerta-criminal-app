import fs from 'fs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function run() {
  try {
    const customToken = await admin.auth().createCustomToken('viciowins@gmail.com'); // this should be uid, wait. The user's UID is what we need.
    const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
    const apiKey = config.apiKey;
    
    // exchange custom token for ID token
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true
      })
    });
    
    const data = await res.json();
    if (!data.idToken) {
        console.error("Failed to get ID token:", data);
        return;
    }
    const idToken = data.idToken;
    
    // now call the endpoint
    const response = await fetch('http://localhost:3000/api/push/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        title: 'test', body: 'test', htmlContent: 'test html'
      })
    });
    console.log("Status:", response.status);
    console.log("Body:", await response.text());
  } catch(e) {
    console.error(e);
  }
}
run();
