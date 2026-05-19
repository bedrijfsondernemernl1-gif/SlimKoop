const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Revert imports 
const importAdmin = `import admin from "firebase-admin";\nimport { getFirestore } from "firebase-admin/firestore";`;
const initAdmin = `// Initialize Firebase Admin\nif (!admin.apps.length) {\n  admin.initializeApp({\n    projectId: firebaseConfig.projectId\n  });\n}\n\nconst adminDb = getFirestore(firebaseConfig.firestoreDatabaseId);`;

const newImports = `import { initializeApp } from "firebase/app";\nimport { getAuth, signInWithEmailAndPassword } from "firebase/auth";\nimport { getFirestore, collection, doc, setDoc, getDoc, addDoc, updateDoc, query, where, getDocs, serverTimestamp, increment } from "firebase/firestore";`;
const newInit = `const firebaseApp = initializeApp(firebaseConfig);\nconst auth = getAuth(firebaseApp);\nconst adminDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);\n\n// Sign in server bot\nsignInWithEmailAndPassword(auth, "admin_server_bot@occasionscan.nl", "ServerSuperPassword123!")\n  .catch((err) => console.error("[SERVER] Failed to login Server Bot:", err));`;

content = content.replace(importAdmin, newImports);
content = content.replace(initAdmin, newInit);

// 2. Replace DB operations
// userRef.set({ ... }, { merge: true }) -> await setDoc(userRef, { ... }, { merge: true })
content = content.replace(/await userRef\.set\(([\s\S]*?)\);/g, 'await setDoc(userRef, $1);');

// userRef.update({ ... }) -> await updateDoc(userRef, { ... })
content = content.replace(/await userRef\.update\(([\s\S]*?)\);/g, 'await updateDoc(userRef, $1);');

// rapportRef.update({ ... }) -> await updateDoc(rapportRef, { ... })
content = content.replace(/await rapportRef\.update\(([\s\S]*?)\);/g, 'await updateDoc(rapportRef, $1);');

// userRef.get() -> await getDoc(userRef)
content = content.replace(/await userRef\.get\(\)/g, 'await getDoc(userRef)');

// userSnap.exists -> userSnap.exists()
content = content.replace(/userSnap\.exists(?!\()/g, 'userSnap.exists()');

// docSnap.exists -> docSnap.exists()
content = content.replace(/docSnap\.exists(?!\()/g, 'docSnap.exists()');

// adminDb.collection("gebruikers").doc(userId) -> doc(adminDb, "gebruikers", userId)
content = content.replace(/adminDb\.collection\("gebruikers"\)\.doc\((.*?)\)/g, 'doc(adminDb, "gebruikers", $1)');
content = content.replace(/adminDb\.collection\('rapporten'\)\.doc\((.*?)\)/g, "doc(adminDb, 'rapporten', $1)");

// adminDb.collection('rapporten').add({ -> addDoc(collection(adminDb, 'rapporten'), {
content = content.replace(/adminDb\.collection\('rapporten'\)\.add\(/g, "addDoc(collection(adminDb, 'rapporten'), ");
content = content.replace(/adminDb\.collection\('analyses'\)\.add\(/g, "addDoc(collection(adminDb, 'analyses'), ");

// const usersSnapshot = await adminDb.collection('gebruikers').where('stripeCustomerId', '==', customerId).get();
const queryReplace = `const q = query(collection(adminDb, 'gebruikers'), where('stripeCustomerId', '==', customerId));\n            const usersSnapshot = await getDocs(q);`;
content = content.replace(/const usersSnapshot = await adminDb\.collection\('gebruikers'\)\.where\('stripeCustomerId', '==', customerId\)\.get\(\);/g, queryReplace);

// const querySnapshot = await adminDb.collection('rapporten').where(...).orderBy(...).limit(1).get()
// This one is multi-line in the code:
//       const querySnapshot = await adminDb.collection('rapporten')
//         .where('url', '==', url)
//         .where('status', '==', 'compleet')
//         .orderBy('createdAt', 'desc')
//         .limit(1)
//         .get();
content = content.replace(/const querySnapshot = await adminDb\.collection\('rapporten'\)\s*\n\s*\.where\('url', '==', url\)\s*\n\s*\.where\('status', '==', 'compleet'\)\s*\n\s*\.orderBy\('createdAt', 'desc'\)\s*\n\s*\.limit\(1\)\s*\n\s*\.get\(\);/g, 
`const qReport = query(collection(adminDb, 'rapporten'), where('url', '==', url), where('status', '==', 'compleet'));\n      // using memory sort to avoid requiring composite index for now\n      const querySnapshot = await getDocs(qReport);`);


// admin.firestore.FieldValue.serverTimestamp() -> serverTimestamp()
content = content.replace(/admin\.firestore\.FieldValue\.serverTimestamp\(\)/g, "serverTimestamp()");

// admin.firestore.FieldValue.increment(1) -> increment(1)
content = content.replace(/admin\.firestore\.FieldValue\.increment\((.*?)\)/g, "increment($1)");

fs.writeFileSync('server.ts', content);
console.log('Done');
