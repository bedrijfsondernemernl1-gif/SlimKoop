import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const apiKey = firebaseConfig.apiKey;

async function createAdmin() {
  const email = "admin_server_bot@occasionscan.nl";
  const password = "ServerSuperPassword123!";
  
  // 1. Sign Up
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await res.json();
  console.log("Signup:", data);
}
createAdmin();
