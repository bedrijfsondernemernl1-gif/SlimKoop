import PDFDocument from 'pdfkit';
import { Response } from 'express';

export function generateReportPDF(data: any, res: Response) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 45, right: 45 },
    bufferPages: true
  });

  // Pipe the PDF directly to Express Response
  doc.pipe(res);

  // Colors
  const darkBlue = '#0A111F';
  const green = '#10B981';
  const amber = '#F59E0B';
  const red = '#EF4444';
  const grayLight = '#F3F4F6';
  const grayDark = '#4B5563';
  const textDark = '#1F2937';

  // --- PAGE 1: HEADER & OVERZICHT ---
  // Draw top banner
  doc.rect(0, 0, 595.28, 90)
     .fill(darkBlue);

  // Header Title
  doc.fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .fontSize(22)
     .text('OCCASIONSCAN', 45, 25, { characterSpacing: 1 });

  doc.fillColor(green)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('VOLLEDIG AUTOMARKT- & INSPECTIERAPPORT', 45, 52, { characterSpacing: 2 });

  // Date and Plate on the right banner
  doc.fillColor('#9CA3AF')
     .font('Helvetica')
     .fontSize(9)
     .text(`KENTEKEN: ${(data.rdw?.kenteken || 'Onbekend').toUpperCase()}`, 400, 30, { align: 'right', width: 150 })
     .text(`DATUM: ${new Date().toLocaleDateString('nl-NL')}`, 400, 48, { align: 'right', width: 150 });

  // Reset text color below banner
  doc.fillColor(textDark);

  // Position cursor below green banner
  let y = 115;

  // Title block of car
  doc.font('Helvetica-Bold')
     .fontSize(18)
     .text(data.autoNaam || 'Tweedehands Voertuig', 45, y)
     .font('Helvetica')
     .fontSize(12)
     .fillColor(grayDark)
     .text(`Vraagprijs: € ${(data.vraagprijs || 0).toLocaleString('nl-NL')} | Bouwjaar: ${data.bouwjaar || 'Onbekend'} | Tellerstand: ${data.kilometerstand > 0 ? `${data.kilometerstand.toLocaleString('nl-NL')} km` : 'Niet vermeld'}`, 45, y + 24);

  y += 55;

  // Draw two column card: left column basic specs, right column Score
  // Drawing Left specs box
  doc.rect(45, y, 240, 110)
     .fill(grayLight);
  doc.fillColor(textDark)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('VOERTUIG GEGEVENS', 55, y + 12)
     .font('Helvetica')
     .fontSize(9)
     .fillColor(textDark)
     .text(`Merk: ${data.rdw?.merk || 'Onbekend'}`, 55, y + 32)
     .text(`Type: ${data.rdw?.handelsbenaming || 'Onbekend'}`, 55, y + 47)
     .text(`Brandstof: ${data.brandstof || 'Onbekend'}`, 55, y + 62)
     .text(`Transmissie: ${data.transmissie || 'Onbekend'}`, 55, y + 77)
     .text(`Bouwjaar: ${data.bouwjaar || 'Onbekend'}`, 55, y + 92);

  // Right card for OCCASIONSCAN SCORE
  doc.rect(310, y, 240, 110)
     .fill(darkBlue);
  doc.fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('OCCASIONSCAN SCORE', 310, y + 16, { align: 'center', width: 240 });

  doc.fillColor(green)
     .font('Helvetica-Bold')
     .fontSize(36)
     .text(`${data.dealScore || 0}`, 310, y + 32, { align: 'center', width: 240 });

  const verdictText = (data.verdict || 'onbekend').toUpperCase();
  const verdictColor = data.verdict === 'koopje' || data.verdict === 'redelijk' ? green : (data.verdict === 'voorzichtig' ? amber : red);

  doc.fillColor(verdictColor)
     .font('Helvetica-Bold')
     .fontSize(11)
     .text(`OORDEEL: ${verdictText}`, 310, y + 76, { align: 'center', width: 240 });

  y += 130;

  // --- SECTION: POSITIEVE PUNTEN ---
  doc.fillColor(textDark)
     .font('Helvetica-Bold')
     .fontSize(12)
     .text('POSITIEVE PUNTEN', 45, y);
  doc.moveTo(45, y + 16).lineTo(550, y + 16).strokeColor('#E5E7EB').stroke();
  
  y += 24;
  
  const positief = data.positievePunten || [];
  if (positief.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(grayDark).text('Geen specifieke positieve punten geanalyseerd.', 45, y);
    y += 18;
  } else {
    positief.forEach((bullet: string) => {
      doc.circle(50, y + 5, 3).fill(green);
      doc.fillColor(textDark)
         .font('Helvetica')
         .fontSize(9)
         .text(bullet, 60, y, { width: 490 });
      y += Math.max(20, doc.heightOfString(bullet, { width: 490 }) + 8);
    });
  }

  y += 15;

  // --- SECTION: AANDACHTSPUNTEN & RISICO'S ---
  doc.fillColor(textDark)
     .font('Helvetica-Bold')
     .fontSize(12)
     .text('CRITICITEIT EN GEZONDHEIDSRISICO\'S', 45, y);
  doc.moveTo(45, y + 16).lineTo(550, y + 16).strokeColor('#E5E7EB').stroke();
  
  y += 24;

  const aandacht = data.aandachtspunten || [];
  if (aandacht.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(grayDark).text('Geen specifieke aandachtspunten geanalyseerd.', 45, y);
    y += 18;
  } else {
    aandacht.forEach((bullet: string) => {
      doc.circle(50, y + 5, 3).fill(amber);
      doc.fillColor(textDark)
         .font('Helvetica')
         .fontSize(9)
         .text(bullet, 60, y, { width: 490 });
      y += Math.max(20, doc.heightOfString(bullet, { width: 490 }) + 8);
    });
  }

  // Check if we need a page break before Red Flags
  const flags = data.rodeVlaggen || [];
  if (y > 600 && flags.length > 0) {
    doc.addPage();
    y = 50;
  } else {
    y += 15;
  }

  // --- SECTION: RODE VLAGGEN ---
  if (flags.length > 0) {
    doc.fillColor(red)
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('SIGNIFICANTE RODE VLAGGEN (LET OP!)', 45, y);
    doc.moveTo(45, y + 16).lineTo(550, y + 16).strokeColor('#FEE2E2').stroke();
    
    y += 24;

    flags.forEach((flag: any) => {
      const flagBoxHeight = Math.max(45, doc.heightOfString(`${flag.titel}: ${flag.uitleg}`, { width: 480 }) + 15);
      
      doc.rect(45, y, 505, flagBoxHeight)
         .fill('#FEF2F2');
      doc.rect(45, y, 4, flagBoxHeight)
         .fill(red);

      doc.fillColor(red)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text((flag.ernst || 'HOOG').toUpperCase(), 60, y + 8)
         .fillColor(textDark)
         .font('Helvetica-Bold')
         .text(flag.titel, 110, y + 8)
         .font('Helvetica')
         .fontSize(9)
         .text(flag.uitleg, 60, y + 22, { width: 480 });
      
      y += flagBoxHeight + 12;
    });
  }

  // --- PAGE BREAK: TECHNICAL SPECS & NEGOTIATION ---
  doc.addPage();
  y = 40;

  // Header for Page 2
  doc.rect(0, 0, 595.28, 45)
     .fill(darkBlue);
  doc.fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .fontSize(11)
     .text('AI ONDERHANDELINGSGEGEVENS & TIPS', 45, 17, { characterSpacing: 1 });

  y = 65;

  // --- SECTION: NEGOTIATING SCRIPTS ---
  doc.fillColor(textDark)
     .font('Helvetica-Bold')
     .fontSize(12)
     .text('ONDERHANDELINGSSCRIPTS EN AI-VOORSTEL', 45, y);
  doc.moveTo(45, y + 16).lineTo(550, y + 16).strokeColor('#E5E7EB').stroke();
  
  y += 24;

  const openingsBodValue = data.openingsBod || Math.round((data.vraagprijs || 0) * 0.9);
  doc.strokeColor(green).lineWidth(1.5).rect(45, y, 505, 45).stroke();
  doc.fillColor(green)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('AANBEVOLEN OPENINGSBOD', 60, y + 10)
     .fontSize(14)
     .text(`€ ${openingsBodValue.toLocaleString('nl-NL')}`, 60, y + 22);

  y += 60;

  // Render openingsbod, tegenbod, and weglopen scripts
  const scriptGroup = data.onderhandelingsScript || {};
  const isObject = typeof scriptGroup === 'object' && scriptGroup !== null;

  // openingsbod
  doc.fillColor(textDark)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('1. OPENINGSBOD SCRIPT', 45, y);
  y += 15;
  const openingsbodText = isObject ? (scriptGroup.openingsbod || "Beste verkoper, ik stel graag een openingsbod voor...") : (scriptGroup || "Beste verkoper...");
  doc.fillColor(grayDark)
     .font('Helvetica')
     .fontSize(9)
     .text(openingsbodText, 45, y, { width: 505 });
  y += doc.heightOfString(openingsbodText, { width: 505 }) + 15;

  // tegenbod
  if (isObject && scriptGroup.tegenbod) {
    if (y > 650) {
      doc.addPage();
      y = 50;
    }
    doc.fillColor(textDark)
       .font('Helvetica-Bold')
       .fontSize(10)
       .text('2. TEGENBOD SCRIPT', 45, y);
    y += 15;
    const tegenbodText = scriptGroup.tegenbod;
    doc.fillColor(grayDark)
       .font('Helvetica')
       .fontSize(9)
       .text(tegenbodText, 45, y, { width: 505 });
    y += doc.heightOfString(tegenbodText, { width: 505 }) + 15;
  }

  // weglopen
  if (isObject && scriptGroup.weglopen) {
    if (y > 650) {
      doc.addPage();
      y = 50;
    }
    doc.fillColor(textDark)
       .font('Helvetica-Bold')
       .fontSize(10)
       .text('3. WEGLOPEN SCRIPT (FOMO)', 45, y);
    y += 15;
    const weglopenText = scriptGroup.weglopen;
    doc.fillColor(grayDark)
       .font('Helvetica')
       .fontSize(9)
       .text(weglopenText, 45, y, { width: 505 });
    y += doc.heightOfString(weglopenText, { width: 505 }) + 20;
  }

  // Tips section
  const tips = data.onderhandelingsTips || [];
  if (tips.length > 0) {
    if (y > 650) {
      doc.addPage();
      y = 50;
    }
    doc.fillColor(textDark)
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('ONDERHANDELING TIPS', 45, y);
    doc.moveTo(45, y + 16).lineTo(550, y + 16).strokeColor('#E5E7EB').stroke();
    
    y += 24;

    tips.forEach((tip: string) => {
      doc.circle(50, y + 5, 2.5).fill(textDark);
      doc.fillColor(textDark)
         .font('Helvetica')
         .fontSize(9)
         .text(tip, 60, y, { width: 490 });
      y += Math.max(18, doc.heightOfString(tip, { width: 490 }) + 6);
    });
  }

  // Draw footer message on all pages implicitly
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.fillColor(grayDark)
       .font('Helvetica')
       .fontSize(7)
       .text('OccasionScan B.V. • Automatisch gegenereerd oordeel op basis van RDW- & AI-advertentieanalyse. Geen juridische rechten aan ontleenbaar.', 45, 805, { align: 'center', width: 505 });
  }

  doc.end();
}
