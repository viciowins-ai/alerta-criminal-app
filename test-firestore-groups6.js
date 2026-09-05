import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  projectId: "alerta-criminal-c1612",
  appId: "1:629866475626:web:b6b2df3777f22643701a13",
  apiKey: "AIzaSyAYQMViKdD9_veiPCk0GTiqr26mvnxsQlg",
  authDomain: "alerta-criminal-c1612.firebaseapp.com",
  firestoreDatabaseId: "(default)",
  storageBucket: "alerta-criminal-c1612.firebasestorage.app",
  messagingSenderId: "629866475626",
  measurementId: "G-ZFRN360Y6Y"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function addGroup() {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, 'viciowins@gmail.com', '12345678'); 
        
        await addDoc(collection(db, 'groups'), {
            name: "Test Group",
            inviteCode: "123456",
            createdBy: userCredential.user.uid,
            members: [userCredential.user.uid],
            createdAt: new Date()
        });
        console.log("Success");
        process.exit(0);
    } catch(e) {
        console.log("Error:", e.message);
        process.exit(1);
    }
}
addGroup();
