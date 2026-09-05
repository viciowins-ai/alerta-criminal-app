import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

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

async function addGroup() {
    try {
        await setDoc(doc(db, 'groups', 'test-doc'), {
            name: "Test Group",
            inviteCode: "123456",
            createdBy: "test_uid",
            members: ["test_uid"],
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
