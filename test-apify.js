import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

(async () => {
    try {
        const url = 'https://www.marktplaats.nl/v/auto-s/volkswagen/m2398861096-volkswagen-golf-1-2-tsi-63kw-5d-2013-zwart';
        const input = {
            "startUrls": [
                {
                    "url": url
                }
            ],
            "olxDomain": "marktplaats.nl",
            "proxyConfiguration": {
                "useApifyProxy": true,
                "apifyProxyGroups": [
                    "RESIDENTIAL"
                ]
            }
        };
        const run = await client.actor("fIOmNS7QmlV8eaORz").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log("Found items:", items.length);
        console.log("First item:", items[0]);
    } catch (e) {
        console.error(e);
    }
})();
