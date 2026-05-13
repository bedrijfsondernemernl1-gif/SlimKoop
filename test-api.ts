import dotenv from "dotenv";
dotenv.config({ path: ".env.example" });

(async () => {
    try {
        const url = "http://localhost:3000/api/analyze";
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: "https://www.marktplaats.nl/v/auto-s/volkswagen/m2398861096-volkswagen-golf-1-2-tsi-63kw-5d-2013-zwart" })
        });
        const data = await res.json();
        console.log("Analyze res:", data);

        if (data.rapportId) {
            // poll
            for (let i=0; i<30; i++) {
                await new Promise(r => setTimeout(r, 2000));
                const rr = await fetch(`http://localhost:3000/api/rapporten/${data.rapportId}?isBetaald=true`);
                const rdata = await rr.json();
                console.log("Poll status:", rdata.status);
                if (rdata.status === 'fout') {
                    console.log("Error details:", rdata.error);
                    break;
                }
                if (rdata.status === 'compleet') {
                    console.log("Success!");
                    break;
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
})();
