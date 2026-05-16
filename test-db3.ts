import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});
const db = admin.firestore();

async function run() {
  try {
    const users = await db.collection("gebruikers").get();
    console.log("Users:", users.size);
  } catch(e: any) {
    console.error("Error:", e.message);
  }
}
run();
