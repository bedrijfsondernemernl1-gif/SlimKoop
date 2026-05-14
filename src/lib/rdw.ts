export async function checkRDW(kenteken: string) {
  if (!kenteken) return null;
  
  // Kenteken opschonen voor de API call
  const schoonKenteken = kenteken
    .replace(/-/g, '')
    .replace(/\s/g, '')
    .toUpperCase();
  
  console.log(`[RDW] Kenteken voor opschonen: ${kenteken}`);
  console.log(`[RDW] Kenteken na opschonen: ${schoonKenteken}`);
  
  try {
    const response = await fetch(
      `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${schoonKenteken}`
    );
    const data = await response.json();
    
    console.log('[RDW] Volledige API response:', JSON.stringify(data, null, 2));
    
    if (!data || data.length === 0) {
      console.log(`[RDW] Geen gegevens gevonden voor kenteken: ${schoonKenteken}`);
      return null;
    }
    
    const voertuig = data[0];
    
    // Formatteren van vervaldatum_apk naar DD-MM-YYYY
    let apkVervaldatum = "onbekend";
    if (voertuig.vervaldatum_apk) {
      const v = voertuig.vervaldatum_apk.toString();
      if (v.length === 8) {
        apkVervaldatum = `${v.substring(6, 8)}-${v.substring(4, 6)}-${v.substring(0, 4)}`;
      }
    }

    // Formatteren van datum_eerste_toelating naar jaar
    let bouwjaar = "onbekend";
    if (voertuig.datum_eerste_toelating) {
      bouwjaar = voertuig.datum_eerste_toelating.toString().substring(0, 4);
    }
    
    return {
      kenteken: schoonKenteken,
      apkVervaldatum,
      eersteToelating: bouwjaar,
      aantalEigenaren: voertuig.aantal_eigenaren || 'onbekend',
      handelsbenaming: voertuig.handelsbenaming || voertuig.merk || 'onbekend',
      merk: voertuig.merk,
      isGestolen: voertuig.gestolen_indicator === 'Ja',
      succes: true
    };
  } catch (fout) {
    console.error('[RDW] Fout bij ophalen gegevens:', fout);
    return { succes: false };
  }
}
