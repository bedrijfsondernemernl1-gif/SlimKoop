import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json" with { type: 'json' };

admin.initializeApp({
  projectId: firebaseConfig.projectId,
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
// wait, firestore in admin also needs databaseId. Let's see if admin.firestore() supports changing the db.
// Actually, firebase-admin has db() which doesn't support databaseId until later versions, or we can use the underling library.

import { Firestore } from '@google-cloud/firestore';

const cdb = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId
});

(async() => {
    try {
        const refs = await cdb.collection('rapporten').limit(1).get();
        console.log("Success!", refs.docs.length);
    } catch(e) {
        console.log("Error:", e);
    }
})();
