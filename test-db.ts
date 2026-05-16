import admin from "firebase-admin";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
admin.initializeApp({
  projectId: firebaseConfig.projectId,
  credential: admin.credential.applicationDefault()
});
const db = admin.firestore();
db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });

async function run() {
  const users = await db.collection("gebruikers").get();
  users.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
}
run();
