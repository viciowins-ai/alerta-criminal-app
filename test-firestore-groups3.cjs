const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = require('./firebase-applet-config.json');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function test() {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, 'viciowins@gmail.com', '12345678'); 
    console.log("Signed in");
    await addDoc(collection(db, 'groups'), {
        name: "Test Group",
        inviteCode: "123456",
        createdBy: userCredential.user.uid,
        members: [userCredential.user.uid],
        createdAt: new Date()
      });
    console.log("Success");
  } catch (e) {
    console.log("Error:", e.message);
  }
}
test();
