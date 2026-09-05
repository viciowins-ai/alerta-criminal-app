import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "alerta-criminal-c1612",
  appId: "1:629866475626:web:b6b2df3777f22643701a13",
  apiKey: "AIzaSyAYQMViKdD9_veiPCk0GTiqr26mvnxsQlg",
  authDomain: "alerta-criminal-c1612.firebaseapp.com",
  firestoreDatabaseId: "(default)"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testRead() {
    try {
        await getDocs(collection(db, 'emergencyAlerts'));
        console.log("Success reading emergencyAlerts");
    } catch(e) {
        console.log("Error reading emergencyAlerts:", e.message);
    }
    
    try {
        await getDocs(collection(db, 'groups'));
        console.log("Success reading groups");
    } catch(e) {
        console.log("Error reading groups:", e.message);
    }
    process.exit(0);
}
testRead();
