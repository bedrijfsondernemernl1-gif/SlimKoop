
export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  readTime: string;
  createdAt: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
}

export const BLOGS: Blog[] = [
  {
    id: '1',
    slug: 'tweedehands-auto-kopen-10-tips',
    title: 'Tweedehands auto kopen: 10 tips om niet opgelicht te worden',
    excerpt: 'Een tweedehands auto kopen kan spannend zijn, maar ook risicovol. Met deze 10 essentiële tips voorkom je miskopen en oplichting.',
    metaTitle: 'Tweedehands Auto Kopen: 10 Tips Tegen Oplichting | OccasionScan',
    metaDescription: 'Wil je een tweedehands auto kopen zonder zorgen? Lees onze 10 tips om oplichting te voorkomen, van kilometerstand fraude tot verborgen gebreken.',
    featuredImage: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=1200',
    category: 'Koopadvies',
    readTime: '8 min',
    createdAt: '2026-05-17',
    author: 'OccasionScan Expert Team',
    content: `
      <h2>De droom van een nieuwe auto kan snel een nachtmerrie worden</h2>
      <p>Het kopen van een tweedehands auto is voor veel Nederlanders de slimste manier om een kwalitatief goede auto te rijden zonder de hoofdprijs van een nieuw exemplaar te betalen. Echter, de occassionmarkt is ook een plek waar minder eerlijke verkopers proberen hun slag te slaan. Van teruggedraaide kilometertellers tot verborgen schade; de risico's zijn reëel.</p>

      <p>Bij <strong>OccasionScan</strong> zien we dagelijks duizenden advertenties voorbijkomen. We hebben onze expertise gebundeld in deze 10 gouden regels voor iedereen die op zoek is naar een betrouwbare tweedehands auto.</p>

      <h3>1. Vertrouw op je onderbuikgevoel, maar check de feiten</h3>
      <p>Lijkt de deal te mooi om waar te zijn? Dan is dat meestal ook zo. Een Audi A3 uit 2020 met slechts 20.000 op de teller voor de helft van de marktprijs? Grote kans dat er iets niet klopt. Gebruik een tool als de <a href="/analyseer">OccasionScan analyse</a> om direct te zien of de prijs marktconform is.</p>

      <h3>2. Controleer altijd de NAP-logisch status</h3>
      <p>Kilometerstandfraude is nog steeds een groot probleem. Sinds 2014 is het terugdraaien van tellerstanden strafbaar, maar via de import uit het buitenland glippen er nog steeds veel sjoemelauto's doorheen. Controleer of de auto een 'logisch' oordeel heeft bij de RDW.</p>

      <h3>3. Bekijk de onderhoudshistorie grondig</h3>
      <p>Een auto die elke 10.000 kilometer bij de dealer is geweest, is goud waard. Vraag altijd naar het originele onderhoudsboekje of digitale onderhoudshistorie. Ontbreken er pagina's of zijn de stempels van vage garages? Wees dan alert.</p>

      <div class="bg-accent-green/10 border border-accent-green/20 p-6 rounded-2xl my-8">
        <h4 class="text-white font-bold mb-2">PRO TIP: Analyseer de advertentie direct</h4>
        <p class="text-sm mb-4">Plak de link van de advertentie in onze analysetool en krijg direct inzicht in de betrouwbaarheid en prijs. Voorkom een miskoop binnen 30 seconden.</p>
        <a href="/analyseer" class="inline-block bg-accent-green !text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Analyseer nu gratis</a>
      </div>

      <h3>4. Let op kleurverschillen tussen panelen</h3>
      <p>Loop met daglicht om de auto heen. Zie je een subtiel kleurverschil tussen de deur en het zijpaneel? Dit kan wijzen op herstelde schade. Een magneetje kan helpen om te controleren of er plamuur is gebruikt bij metalen carrosseriedelen.</p>

      <h3>5. Check de banden (alle vier!)</h3>
      <p>Zijn de voorbanden meer gesleten dan de achterbanden? Dat is normaal bij voorwielaandrijving. Maar is één band aan de binnenkant veel meer gesleten dan aan de buitenkant? Dan is de uitlijning niet goed, wat kan wijzen op een aanrijding in het verleden.</p>

      <h3>6. Test alle elektronica</h3>
      <p>Airco, ramen, ruitenwissers, infotainment; test alles. Een kapotte airco repareren kan zomaar €800 kosten. Laat je niet afschepen met "die moet alleen even bijgevuld worden". Als dat zo was, had de verkoper het wel gedaan.</p>

      <h3>7. De koude start</h3>
      <p>Vraag de verkoper specifiek om de auto niet warm te draaien voordat je komt. Veel motorproblemen of bijgeluiden zijn alleen hoorbaar bij een koude start. Rook uit de uitlaat (blauw of dik wit) is bij een koude start vaak een slecht teken.</p>

      <h3>8. Maak een uitgebreide proefrit</h3>
      <p>Rijd niet alleen een rondje om de kerk. Ga de snelweg op, rijd over drempels en maak eens een noodstop (als het veilig is). Hoor je gekke geluiden? Trilt het stuur bij 100 km/u? Dit zijn cruciale momenten om de conditie van de auto te ervaren.</p>

      <h3>9. Controleer de chassisnummers</h3>
      <p>Komt het chassisnummer in de auto overeen met de papieren? Check ook of het nummer er 'origineel' uitziet en niet is overgeponst. Dit is de beste manier om te voorkomen dat je een gestolen auto koopt.</p>

      <h3>10. Wil je het zeker weten? Analyseer je auto met OccasionScan</h3>
      <p>Waarom zou je gokken met duizenden euro's? Onze AI-gestuurde analyse bekijkt de advertentie, vergelijkt marktprijzen en checkt de historie voor je. Het geeft je de munitie die je nodig hebt voor de onderhandeling.</p>

      <div class="mt-12 p-8 bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-[2.5rem] text-center">
        <h3 class="text-2xl font-bold text-white mb-4">Geen zin in verborgen gebreken?</h3>
        <p class="text-gray-400 mb-8 max-w-2xl mx-auto">Laat onze algoritmes de auto checken voordat je de verkoper belt. Bespaar tijd, geld en een hoop ellende.</p>
        <a href="/analyseer" class="inline-flex items-center gap-2 bg-accent-green !text-black px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(0,200,83,0.4)] transition-all">
          Start gratis analyse
        </a>
      </div>
    `
  },
  {
    id: '2',
    slug: 'rode-vlaggen-marktplaats-autos',
    title: "Rode vlaggen bij Marktplaats auto's: hier moet je op letten",
    excerpt: 'Marktplaats is dé plek voor een goede occasion, maar ook een mijnenveld voor onervaren kopers. Herken de signalen van een louche advertentie.',
    metaTitle: "Marktplaats Auto Rode Vlaggen: Herken Oplichting | OccasionScan",
    metaDescription: "Pas op voor deze rode vlaggen bij het kopen van een auto op Marktplaats. Van vage verkopers tot dubieuze foto's. Wij leggen uit waar je op moet letten.",
    featuredImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200',
    category: 'Marktplaats Tips',
    readTime: '7 min',
    createdAt: '2026-05-17',
    author: 'OccasionScan Expert Team',
    content: `
      <h2>De jungle van Marktplaats doorstaan</h2>
      <p>Iedereen die wel eens op Marktplaats naar een auto heeft gezocht, weet dat het aanbod enorm is. Helaas is de kwaliteit van de advertenties (en de verkopers) erg wisselend. Waar de ene verkoper elk krasje eerlijk vermeldt, probeert de ander een total-loss auto als 'zo goed als nieuw' te verkopen.</p>
 
      <p>Bij <strong>OccasionScan</strong> hebben we miljoenen advertenties geanalyseerd. Hier zijn de absolute rode vlaggen die je direct zouden moeten doen twijfelen.</p>

      <h3>1. De 'Zondag-Foto's'</h3>
      <p>Wanneer de foto's van de auto genomen zijn in de regen, in het donker, of als de auto duidelijk net nat is gespoten met een tuinslang, wees dan op je hoede. Water op de lak maskeert krassen en doffe plekken. Een eerlijke verkoper maakt foto's op een zonnige dag (of in ieder geval droog) van een schone auto.</p>

      <h3>2. "Handelaar" met een particulier account</h3>
      <p>Zie je een auto die wordt aangeboden door 'Ibrahim', maar heeft hij op dit moment nog 15 andere auto's te koop staan? Dan heb je te maken met een handelaar die zich voordoet als particulier. Waarom doen ze dit? Om de wettelijke garantieplichten van een bedrijf te ontlopen. Dit is een grote rode vlag voor je consumentenrechten.</p>

      <h3>3. "Motor en bak 100%"</h3>
      <p>Het klinkt geruststellend, maar ervaren kopers weten: dit is vaak een standaardtekstje bij auto's die eigenlijk aan het einde van hun latijn zijn. Het suggereert dat de rest van de auto minder dan 100% is. Een goede advertentie omschrijft specifiek onderhoud in plaats van deze loze kreten.</p>

      <div class="bg-accent-green/10 border border-accent-green/20 p-6 rounded-2xl my-8">
        <h4 class="text-white font-bold mb-2">Check de OccasionScan Score</h4>
        <p class="text-sm mb-4">Onze AI herkent dit soort 'verkooptaal' en straft het af in de betrouwbaarheidsscore. Weet wat er echt staat.</p>
        <a href="/analyseer" class="inline-block bg-accent-green !text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Analyseer advertentie</a>
      </div>

      <h3>4. Geen kenteken zichtbaar</h3>
      <p>Als het kenteken op de foto's is afgeplakt of weggepoetst, vraag je dan af: wat heeft deze verkoper te verbergen? Zonder kenteken kun je geen RDW-check doen en de historie niet natrekken. Een transparante verkoper laat het kenteken gewoon zien.</p>

      <h3>5. Directe druk: "Gaat weg wegens emigratie"</h3>
      <p>Verhalen over haast, emigratie, of 'voor de snelle beslisser' zijn vaak bedoeld om jou als koper onder druk te zetten zodat je minder kritisch kijkt. Neem altijd je tijd. Als de auto vandaag wordt verkocht aan iemand anders omdat jij kritische vragen stelt, dan was het niet de juiste auto voor jou.</p>

      <h3>6. Te weinig informatie over onderhoud</h3>
      <p>"Onderhoudsboekjes aanwezig" is niet hetzelfde als "volledig ingevuld en afgestempeld". Vraag specifiek wanneer de laatste grote beurt is geweest en of de distributieriem al is vervangen (indien van toepassing voor dat model). Kan de verkoper hier geen antwoord op geven? Loop dan weg.</p>

      <h3>7. Wil je het zeker weten? Analyseer je auto met OccasionScan</h3>
      <p>Onze tool scant niet alleen de tekst, maar koppelt de gegevens ook aan historische data van vergelijkbare modellen. We zien patronen die een menselijk oog vaak mist. Bescherm jezelf tegen Marktplaats-cowboys.</p>

      <div class="mt-12 p-8 bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-[2.5rem] text-center">
        <h3 class="text-2xl font-bold text-white mb-4">Twijfel je over een advertentie?</h3>
        <p class="text-gray-400 mb-8 max-w-2xl mx-auto">Plak de link en binnen enkele seconden weet je of het een buitenkansje of een miskoop is.</p>
        <a href="/analyseer" class="inline-flex items-center gap-2 bg-accent-green !text-black px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_300px_rgba(0,200,83,0.4)] transition-all">
          Analyseer nu
        </a>
      </div>
    `
  },
  {
    id: '3',
    slug: 'onderhandelen-tweedehands-auto-script',
    title: "Onderhandelen bij een tweedehands auto: het complete script",
    excerpt: 'Veel mensen vinden onderhandelen eng. Met dit script en deze tips sta je sterker in je schoenen en bespaar je honderden euro’s.',
    metaTitle: "Onderhandelen Tweedehands Auto: Script & Tips | OccasionScan",
    metaDescription: "Wil je de beste prijs voor je occasion? Gebruik ons praktische onderhandelingsscript en tips om honderden euro's te besparen bij je volgende auto-aankoop.",
    featuredImage: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1200',
    category: 'Onderhandeling',
    readTime: '9 min',
    createdAt: '2026-05-17',
    author: 'OccasionScan Expert Team',
    content: `
      <h2>Onderhandelen is geen strijd, het is een spel</h2>
      <p>In Nederland zijn we vaak een beetje bescheiden als het om geld gaat. Maar bij de aankoop van een auto is het volstrekt normaal om te onderhandelen over de prijs. De vraagprijs is namelijk bijna altijd een 'biedprijs' waar enige marge in zit voor de onderhandeling.</p>
 
      <p>Het geheim van een goede onderhandeling is <strong>voorbereiding</strong>. Hoe meer je weet over de auto en de markt, hoe sterker je staat. En dat is precies waar <a href="/analyseer">OccasionScan</a> je bij helpt.</p>

      <h3>De Gouden Regel: Ken de marktprijs</h3>
      <p>Voordat je de verkoper ontmoet, moet je weten wat vergelijkbare auto's kosten. Is de vraagprijs al scherp? Dan hoef je minder korting te verwachten. Is de prijs te hoog? Dan heb je een sterk argument.</p>

      <div class="bg-accent-green/10 border border-accent-green/20 p-6 rounded-2xl my-8">
        <h4 class="text-white font-bold mb-2">Munitie voor je onderhandeling</h4>
        <p class="text-sm mb-4">Onze analyse geeft je een 'Fair Value' prijs. Gebruik dit rapport letterlijk tijdens je gesprek met de verkoper om je bod te onderbouwen.</p>
        <a href="/analyseer" class="inline-block bg-accent-green !text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Krijg marktprijs inzicht</a>
      </div>

      <h3>Het script voor de bezichtiging</h3>
      <p><strong>De start:</strong> Begin niet direct over de prijs. Stel eerst vragen over de historie. "Heeft u de facturen van de laatste beurt?" of "Waarom doet u de auto weg?".</p>

      <p><strong>De confrontatie:</strong> Na de proefrit en controle noem je de verbeterpunten. "Ik zie dat de voorbanden binnen 5.000 KM vervangen moeten worden, dat gaat me zeker €300 kosten. Ook hoor ik een klein rammeltje bij het sturen."</p>

      <p><strong>Het bod:</strong> Noem een concreet bedrag onder je maximale budget. "Gezien de staat van de banden en het aankomende onderhoud, zou ik een bod willen doen van €X."</p>

      <h3>Wat als de verkoper 'nee' zegt?</h3>
      <p>Geen probleem. Dat hoort bij het spel. Vraag: "Wat zou voor u dan een acceptabel bedrag zijn?". Als het gat te groot blijft, wees dan bereid om weg te lopen. Vaak belt de verkoper je de volgende dag alsnog op met een beter voorstel.</p>

      <h3>3 Psychologische trucs</h3>
      <ul>
        <li><strong>De kracht van stilte:</strong> Nadat je een bod hebt gedaan, zeg je niets meer. Laat de verkoper de stilte verbreken. Diegene die als eerste praat, verliest vaak.</li>
        <li><strong>Het 'ronde' getal vermijden:</strong> Bied niet €5000, maar €4850 of €4925. Dat suggereert dat je een hele precieze berekening hebt gemaakt en minder ruimte hebt voor verdere marge.</li>
        <li><strong>Contanten noemen:</strong> "Ik kan vandaag nog het geld overmaken en de auto meenemen." Snelheid is goud waard voor een verkoper.</li>
      </ul>

      <h3>Wil je het zeker weten? Analyseer je auto met OccasionScan</h3>
      <p>Onze marktanalyse is the ultieme voorbereiding. Het laat je zien hoe lang de auto al te koop staat (hoe langer hij staat, hoe meer haast de verkoper heeft) en wat de prijstrend is. Dat is pas echt slim onderhandelen.</p>

      <div class="mt-12 p-8 bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-[2.5rem] text-center">
        <h3 class="text-2xl font-bold text-white mb-4">Klaar om te besparen?</h3>
        <p class="text-gray-400 mb-8 max-w-2xl mx-auto">Ga niet onvoorbereid naar je proefrit. Onze data geeft je het zelfvertrouwen om de beste deal te sluiten.</p>
        <a href="/analyseer" class="inline-flex items-center gap-2 bg-accent-green !text-black px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(0,200,83,0.4)] transition-all">
          Analyseer je droomauto
        </a>
      </div>
    `
  },
  {
    id: '4',
    slug: 'rdw-check-uitleg-kenteken',
    title: "RDW check: wat kun je allemaal opzoeken met een kenteken?",
    excerpt: 'Een kenteken is meer dan een plaatje metaal. Het is de sleutel tot de hele geschiedenis van een auto. Zo haal je alles uit een RDW-check.',
    metaTitle: "RDW Check Kenteken: Alles over voertuiggegevens | OccasionScan",
    metaDescription: "Wat vertelt een kenteken je over een auto? Van eigenaren tot terugroepacties en APK historie. Ontdek hoe je de gratis RDW data optimaal gebruikt.",
    featuredImage: 'https://i.ibb.co/bMfFc68D/Gemini-Generated-Image-fxjhcofxjhcofxjh.png',
    category: 'Auto Check',
    readTime: '6 min',
    createdAt: '2026-05-17',
    author: 'OccasionScan Expert Team',
    content: `
      <h2>De schat aan informatie achter het kenteken</h2>
      <p>In Nederland hebben we geluk. De RDW (Rijksdienst voor het Wegverkeer) houdt een enorme hoeveelheid data bij over elk voertuig op de weg. Veel van deze data is openbaar toegankelijk voor iedereen. Maar weet je ook waar je naar moet kijken?</p>

      <p>Bij <strong>OccasionScan</strong> gebruiken we deze RDW-data als basis voor onze diepgaande analyses. Hier is een overzicht van de belangrijkste gegevens die je kunt vinden.</p>

      <h3>APK-historie en verloopdatum</h3>
      <p>Is de auto recent door de keuring gekomen? Zijn er reparatiepunten geweest bij de laatste APK? Een auto die al bijna moet worden gekeurd, kan een verborgen kostenpost zijn. Een verse APK geeft meer rust, maar let op: een APK is een veiligheidskeuring, geen garantie op een goede technische staat.</p>

      <h3>Aantal eigenaren</h3>
      <p>Heeft de auto in de afgelopen 3 jaar 5 verschillende eigenaren gehad? Dat is een enorme rode vlag. Waarom wilde iedereen zo snel weer van de auto af? Een auto die 10 jaar bij dezelfde eigenaar is geweest, is vaak een veel betere gok.</p>

      <div class="bg-accent-green/10 border border-accent-green/20 p-6 rounded-2xl my-8">
        <h4 class="text-white font-bold mb-2">Automatische RDW-Check</h4>
        <p class="text-sm mb-4">Onze tool haalt alle RDW-data automatisch op en combineert dit met advertentiegegevens voor een compleet plaatje.</p>
        <a href="/analyseer" class="inline-block bg-accent-green !text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Voer kenteken check uit</a>
      </div>

      <h3>Terugroepacties</h3>
      <p>Ernstiger dan je denkt: staan er nog openstaande terugroepacties op de auto? Soms gaat het om kritieke zaken zoals remmen of airbags. Als de huidige eigenaar dit niet heeft laten fixen, zegt dat veel over het algemene onderhoudsniveau van de auto.</p>

      <h3>Historische Tellerstanden</h3>
      <p>Zoals eerder genoemd is de NAP-status (Nationale Auto Pas) cruciaal. De RDW registreert bij elk garagebezoek de stand. Een 'onlogisch' oordeel betekent bijna altijd ellende. Koop nooit een auto met een onlogische tellerstand, tenzij je precies weet wat er aan de hand is.</p>

      <h3>Technische Specificaties</h3>
      <p>Wat is het echte trekgewicht? Wat is de CO2-uitstoot? Klopt het vermogen dat de verkoper opgeeft? Verkopers op Marktplaats 'liegen' soms een beetje over het aantal PK's of de zuinigheid. De RDW-data vertelt je de waarheid.</p>

      <h3>Wil je het zeker weten? Analyseer je auto met OccasionScan</h3>
      <p>Data lezen is één ding, data interpreteren is een tweede. OccasionScan analyseert de verbanden tussen alle gegevens en geeft je een begrijpelijk advies. Zo hoef je zelf geen expert te zijn om als een expert te kopen.</p>

      <div class="mt-12 p-8 bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-[2.5rem] text-center">
        <h3 class="text-2xl font-bold text-white mb-4">Eerst checken, dan kopen</h3>
        <p class="text-gray-400 mb-8 max-w-2xl mx-auto">Krijg binnen 30 seconden een volledig overzicht van alle relevante voertuiggegevens en marktwaarde.</p>
        <a href="/analyseer" class="inline-flex items-center gap-2 bg-accent-green !text-black px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(0,200,83,0.4)] transition-all">
          Gratis Analyseer Rapport
        </a>
      </div>
    `
  },
  {
    id: '5',
    slug: 'kilometerstand-fraude-herkennen',
    title: "Kilometerstand fraude herkennen: zo prik je erdoorheen",
    excerpt: 'Sjoemelen met de tellerstand is helaas nog steeds dagelijkse kost, vooral bij importauto’s. Leer hoe je de signalen herkent.',
    metaTitle: "Kilometerstand Fraude Herkennen: Tips & Tricks | OccasionScan",
    metaDescription: "Hoe weet je of de kilometerstand van een tweedehands auto klopt? Ontdek de fysieke en digitale signalen van tellerfraude en voorkom een dure miskoop.",
    featuredImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200',
    category: 'Fraude Detectie',
    readTime: '7 min',
    createdAt: '2026-05-17',
    author: 'OccasionScan Expert Team',
    content: `
      <h2>De teller liegt vaker dan je denkt</h2>
      <p>Je hebt een prachtige BMW 3-serie uit Duitsland gevonden met slechts 80.000 KM op de teller. De prijs is goed, de auto glimt. Maar wist je dat naar schatting 1 op de 5 importauto's een teruggedraaide teller heeft? De winst voor de sjoemelaar kan duizenden euro's per auto zijn.</p>
 
      <p>Bij <strong>OccasionScan</strong> focussen we op transparantie. Tellerfraude is een van de moeilijkste dingen om te zien, maar met deze tips sta je 1-0 voor.</p>

      <h3>1. Slijtage aan het interieur</h3>
      <p>Kijk naar de punten die je aanraakt. Een stuur dat helemaal glad en glimmend is, een versnellingspook waar de letters vanaf zijn gesleten, of een bestuurdersstoel met een kapotte wang? Dat past niet bij een auto met 50.000 KM. Als het interieur eruitziet alsof er 2 ton mee gereden is, dan is dat waarschijnlijk ook zo.</p>

      <h3>2. De staat van de pedalen</h3>
      <p>De rubberen covers op het koppelingspedaal en de rem zijn een goede indicator. Zijn deze helemaal schuin afgesleten of zitten er zelfs gaten in? Dan heeft de auto veel stadsverkeer gezien. Vergelijk de slijtage met de opgegeven kilometerstand.</p>

      <div class="bg-accent-green/10 border border-accent-green/20 p-6 rounded-2xl my-8">
        <h4 class="text-white font-bold mb-2">Check de kilometer-historie</h4>
        <p class="text-sm mb-4">Gebruik OccasionScan om te zien of de kilometerstand logisch aansluit bij de leeftijd en eerdere advertenties van dit voertuig.</p>
        <a href="/analyseer" class="inline-block bg-accent-green !text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform">Start tellercheck</a>
      </div>

      <h3>3. Service stickers onder de motorkap</h3>
      <p>Soms vergeet een sjoemelaar de bonnetjes of stickers onder de motorkap weg te halen. Kijk naar de sticker van het laatste olie-verversen of de distributieriem. Staat daar een hogere kilometerstand op dan op het dashboard? Dan heb je de dader te pakken.</p>

      <h3>4. Steeninslag op de voorkant</h3>
      <p>Veel steeninslag op de motorkap en voorbumper duidt op veel snelwegkilometers. Als een auto 'slechts' 30.000 KM heeft gelopen maar de voorkant zit vol witte pitjes, wees dan achterdochtig.</p>

      <h3>5. De bandencodes (DOT)</h3>
      <p>Banden hebben een productiedatum. Als je een auto koopt uit 2021 met 10.000 KM, horen daar de originele banden uit 2021 onder te zitten met veel profiel. Zitten er splinternieuwe banden onder? Waarom? Of zitten er juist stokoude banden onder? Check of het verhaal logisch is.</p>

      <h3>6. Gebruik de digitale voetprint</h3>
      <p>Auto's van tegenwoordig slaan de kilometerstand op meerdere plekken op: in de sleutel, in de module van de versnellingsbak, en in de multimedia-unit. Een gespecialiseerde garage kan deze uitlezen. Onze software bij OccasionScan zoekt ook naar eerdere verkopen van dezelfde auto op het internet om tellerfraude op te sporen.</p>

      <h3>Wil je het zeker weten? Analyseer je auto met OccasionScan</h3>
      <p>We voeren een uitgebreide kruiscontrole uit op basis van alle beschikbare publieke en private data. We geven een waarschuwingssignaal als de data niet consistent is. Bescherm jezelf tegen deze vorm van diefstal.</p>

      <div class="mt-12 p-8 bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-[2.5rem] text-center">
        <h3 class="text-2xl font-bold text-white mb-4">Gok niet met je geld</h3>
        <p class="text-gray-400 mb-8 max-w-2xl mx-auto">Tellerstandfraude kost consumenten jaarlijks miljoenen. Laat onze AI voor je controleren of het klopt.</p>
        <a href="/analyseer" class="inline-flex items-center gap-2 bg-accent-green !text-black px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(0,200,83,0.4)] transition-all">
          Analyseer je occasion
        </a>
      </div>
    `
  }
];
