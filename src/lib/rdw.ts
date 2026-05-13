export interface RDWResult {
  apkVervaldatum: string;
  eersteToelating: string;
  aantalEigenaren: number;
  isGestolen: boolean;
  succes: boolean;
}

export async function checkRDW(kenteken: string): Promise<RDWResult> {
  const defaultResult: RDWResult = {
    apkVervaldatum: "",
    eersteToelating: "",
    aantalEigenaren: 0,
    isGestolen: false,
    succes: false,
  };

  try {
    const kentekenStr = kenteken.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!kentekenStr) return defaultResult;

    const [voertuigRes, gestolenRes] = await Promise.all([
      fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${kentekenStr}`),
      fetch(`https://opendata.rdw.nl/resource/a34c-vvps.json?kenteken=${kentekenStr}`)
    ]);

    if (!voertuigRes.ok || !gestolenRes.ok) {
      return defaultResult;
    }

    const voertuigData = await voertuigRes.json();
    const gestolenData = await gestolenRes.json();

    if (!voertuigData || voertuigData.length === 0) {
      return defaultResult;
    }

    const auto = voertuigData[0];
    
    // Check if the car is stored in the stolen vehicles database
    let isGestolen = false;
    if (gestolenData && gestolenData.length > 0) {
      // In the RDW stolen vehicles database, if a record exists for a license plate,
      // and it specifies it's stolen, we set it true. (Usually just existing means it's registered as stolen/missing).
      const status = gestolenData[0].verificatieTijdstip; // Any field to verify existence
      if (status || gestolenData.length > 0) {
        isGestolen = true;
      }
    }

    // Aantal eigenaren berekenen (zakelijk + prive)
    const prive = parseInt(auto.aantal_eigenaren_prive) || 0;
    const zakelijk = parseInt(auto.aantal_eigenaren_zakelijk) || 0;
    const eigenaren = prive + zakelijk;

    return {
      apkVervaldatum: auto.vervaldatum_apk || "",
      eersteToelating: auto.datum_eerste_toelating || "",
      aantalEigenaren: eigenaren,
      isGestolen: isGestolen,
      succes: true
    };
  } catch (error) {
    console.error("Fout tijdens RDW open data ophalen:", error);
    return defaultResult;
  }
}
