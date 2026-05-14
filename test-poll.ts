import fetch from 'node-fetch';
async function test() {
  const res = await fetch("http://localhost:3000/api/rapport/1xmENfquLHtx6t7BlxJy?isBetaald=false");
  console.log(JSON.stringify(await res.json(), null, 2));
}
test();
