import { analyseerdeTekst } from './src/lib/ai';

async function test() {
  const result = await analyseerdeTekst({
    titel: 'Test',
    prijs: 1000,
    kilometerstand: 100000,
    bouwjaar: 2010,
    dagenOnline: 1,
    verkoper: 'Test',
    beschrijving: 'Dit is een test'
  }, []);
  console.log(result);
}

test();
