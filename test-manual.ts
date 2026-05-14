import fetch from 'node-fetch';

async function test() {
  const res = await fetch("http://localhost:3000/api/analyseer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://www.marktplaats.nl/v/auto-s/volkswagen/m2398861096-volkswagen-golf-1-2-tsi-63kw-5d-2013-zwart", userId: "test" })
  });
  console.log(await res.json());
}
test();
