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
    
    // Helper function to parse and format dates safely (handles YYYYMMDD and YYYY-MM-DD formats)
    const parseRDWDate = (dateStr: any): string => {
      if (!dateStr) return "onbekend";
      const s = dateStr.toString().trim();
      if (s.length >= 8 && /^\d+$/.test(s.substring(0, 8))) {
        return `${s.substring(6, 8)}-${s.substring(4, 6)}-${s.substring(0, 4)}`;
      }
      if (s.includes('-')) {
        const parts = s.split('T')[0].split('-');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      return s;
    };
    
    // Formatteren van vervaldatum_apk naar DD-MM-YYYY
    const apkVervaldatum = parseRDWDate(voertuig.vervaldatum_apk);

    // Formatteren van datum_eerste_toelating naar DD-MM-YYYY
    const eersteToelating = parseRDWDate(voertuig.datum_eerste_toelating);

    // Formatteren van datum_tenaamstelling naar DD-MM-YYYY
    const laatsteTenaamstelling = parseRDWDate(voertuig.datum_tenaamstelling);
    
    let brandstofDetails: any = {
      co2Uitstoot: 'onbekend',
      brandstofVerbruik: 'onbekend',
      nettoVermogenKw: 'onbekend'
    };
    try {
      const bRes = await fetch(
        `https://opendata.rdw.nl/resource/82kq-u2jg.json?kenteken=${schoonKenteken}`
      );
      const bData = await bRes.json();
      if (bData && bData.length > 0) {
        const bInfo = bData[0];
        brandstofDetails = {
          co2Uitstoot: bInfo.co2_uitstoot_gecombineerd || bInfo.co2_uitstoot_gewogen_gecombineerd || 'onbekend',
          brandstofVerbruik: bInfo.brandstofverbruik_gecombineerd || bInfo.brandstofverbruik_gecombineerd_berekend || 'onbekend',
          nettoVermogenKw: bInfo.netto_maximum_vermogen || 'onbekend'
        };
      }
    } catch (e) {
      console.error('[RDW] Fout bij ophalen brandstofgegevens:', e);
    }
    
    return {
      kenteken: schoonKenteken,
      apkVervaldatum,
      eersteToelating,
      tellerstandoordeel: voertuig.tellerstandoordeel || 'onbekend',
      catalogusprijs: voertuig.catalogusprijs ? `€ ${Number(voertuig.catalogusprijs).toLocaleString('nl-NL')}` : 'onbekend',
      datumTenaamstelling: laatsteTenaamstelling,
      wamVerzekerd: voertuig.wam_verzekerd || 'onbekend',
      handelsbenaming: voertuig.handelsbenaming || voertuig.merk || 'onbekend',
      merk: voertuig.merk || 'onbekend',
      co2Uitstoot: brandstofDetails.co2Uitstoot,
      brandstofVerbruik: brandstofDetails.brandstofVerbruik,
      nettoVermogenKw: brandstofDetails.nettoVermogenKw,
      succes: true
    };
  } catch (fout) {
    console.error('[RDW] Fout bij ophalen gegevens:', fout);
    return { succes: false };
  }
}
