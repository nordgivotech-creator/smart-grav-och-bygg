// Genererar alla HTML-sidor i /public och kopierar den statiska sajten till /docs (GitHub Pages).
// Kör: node build.js
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const PUB = path.join(__dirname, 'public');
const DOCS = path.join(__dirname, 'docs');

const PHONE = '073-358 21 29', TEL = '+46733582129';
const FB = 'https://www.facebook.com/murare.snickare', IG = 'https://www.instagram.com/elyas.gholami651';

const SERVICES = [
  { slug: 'snickeri', name: 'Snickeri', form: 'Snickeri / Näjari', tx: 'tx-wood',
    short: 'Dörrar, lister, trall, inredning och specialsnickerier – precision som håller.',
    intro: 'Bra snickeri syns i detaljerna: en dörr som går lätt, lister som sluter tätt och en trall som ser lika fin ut om många år. Vi utför snickeriarbeten med noggrannhet, från små justeringar till större projekt.',
    does: ['Montering av dörrar, lister och foder', 'Trall, altaner och uteplatser i trä', 'Inredning och specialsnickerier efter mått', 'Mindre om- och tillbyggnader', 'Åtgärder och anpassningar i befintliga rum'],
    know: ['Beskriv mått och önskat utseende så blir offerten tydligare.', 'Skicka gärna med bilder när vi hör av oss – det gör att vi kan bedöma arbetet snabbare.', 'Vi kan kombinera snickeri med måleri så att allt blir klart i ett svep.'],
    faq: [['Kan ni komma och titta på jobbet?', 'Ja, vid behov bokar vi ett platsbesök för att mäta och se förutsättningarna innan vi lämnar offert.'], ['Kan ni ta hand om både snickeri och målning?', 'Ja. Att samla arbetet hos ett team ger färre kontaktpersoner och en smidigare tidplan.']] },
  { slug: 'maleri', name: 'Måleri', form: 'Måleri', tx: 'tx-paint',
    short: 'Invändig och utvändig målning med hög kvalitet, rena kanter och noggrant förarbete.',
    intro: 'Resultatet av en målning avgörs av förarbetet. Vi lägger tid på att spackla, slipa och skydda – så att den färdiga ytan blir jämn, ren och håller över tid. Vi målar både invändigt och utvändigt.',
    does: ['Invändig målning av väggar, tak och snickerier', 'Utvändig målning av hus, knutar och detaljer', 'Spackling, slipning och förberedelse av ytor', 'Målning av dörrar, fönster och lister', 'Skydd av golv och möbler under arbetet'],
    know: ['Berätta ungefärlig yta (kvm) och antal rum så kan vi ge en bättre uppskattning.', 'Har du en färgkod eller ett önskat utseende? Skriv det i formuläret.', 'Måleri kan med fördel kombineras med fasadarbete eller tapetsering.'],
    faq: [['Målar ni både inne och ute?', 'Ja, vi utför både invändig och utvändig målning.'], ['Hjälper ni till med färgval?', 'Vi ger gärna råd om kulörer och kvaliteter, men beslutet är förstås ditt.']] },
  { slug: 'fasad', name: 'Fasad', form: 'Fasad', tx: 'tx-fasad',
    short: 'Fasadrenovering, putsning och målning som ger huset nytt liv och skyddar mot väder.',
    intro: 'Fasaden är husets ansikte och dess skydd mot väder och vind. Vi renoverar, putsar och målar fasader så att huset både ser fräscht ut och är väl skyddat.',
    does: ['Fasadrenovering och uppfräschning', 'Putsning och lagning av fasadytor', 'Utvändig målning av fasad', 'Förarbete: rengöring och iordningställande av underlag', 'Detaljer som knutar, socklar och foder'],
    know: ['Bilder på fasaden och uppgift om material (trä, puts, tegel) hjälper oss att bedöma arbetet.', 'Fasadarbete görs bäst under den varmare delen av året – hör av dig i god tid.', 'Vi kan kombinera fasad med mur- eller målningsarbeten.'],
    faq: [['När på året kan man göra fasadarbete?', 'Det beror på material och väder. Hör av dig så planerar vi tillsammans.'], ['Kan ni laga sprickor i puts?', 'Ja, lagning och putsning ingår bland våra tjänster. Vi bedömer omfattningen vid offert.']] },
  { slug: 'stenlaggning', name: 'Stenläggning', form: 'Stenarbete / Stenläggning', tx: 'tx-stone',
    short: 'Uppfarter, uteplatser, trappor, murar och dekorativa lösningar i sten.',
    intro: 'En väl lagd stenyta är hållbar och ser bra ut i decennier – men det kräver rätt underarbete och noggrann läggning. Vi lägger sten för både funktion och utseende.',
    does: ['Stenläggning av uppfarter och uteplatser', 'Trappor och avsatser i sten', 'Murar och dekorativa stenlösningar', 'Gångar och trädgårdsytor', 'Underarbete och markförberedelse tillsammans med vårt grävarbete'],
    know: ['Ange ungefärlig yta och om marken behöver grävas eller förberedas.', 'Berätta gärna vilken typ av sten eller vilket utseende du tänker dig.', 'Stenläggning kombineras ofta med gräv- och markarbete – vi kan ta hela kedjan.'],
    faq: [['Ingår markarbetet?', 'Vi kan utföra både gräv- och markarbete samt själva läggningen, så att du slipper samordna flera företag.'], ['Kan ni bygga trappor och murar i sten?', 'Ja, trappor, murar och dekorativa lösningar är en del av vårt stenarbete.']] },
  { slug: 'murning', name: 'Murning', form: 'Murning / Byggnation', tx: 'tx-brick',
    short: 'Murverk, tegel och putsning – alla typer av byggarbeten i sten.',
    intro: 'Murverk kräver både precision och erfarenhet. Vi utför murning, tegelarbeten och putsning med stort fokus på rakhet, täthet och finish.',
    does: ['Murverk och tegelarbeten', 'Putsning och ytbehandling', 'Murar, pelare och dekorativa detaljer', 'Reparation och komplettering av befintligt murverk', 'Byggarbeten i sten, från små insatser till större projekt'],
    know: ['Skicka mått och en beskrivning av vad som ska murat – bilder är ett plus.', 'Vi kan kombinera murning med fasadarbete och putsning.', 'Hör av dig tidigt om du har en tidsgräns – murningsarbeten behöver planeras.'],
    faq: [['Gör ni reparationer av gammalt murverk?', 'Ja, vi bedömer skicket och föreslår rätt åtgärd i offerten.'], ['Utför ni även putsning?', 'Ja, murning och putsning hör ofta ihop och vi utför båda.']] },
  { slug: 'kakel-tapet', name: 'Kakel & Tapet', form: 'Kakel & Tapet', tx: 'tx-tile',
    short: 'Badrum, kök och väggar med exakt läggning, täta fogar och snygga detaljer.',
    intro: 'Kakel och tapet är det som syns mest – därför är små avvikelser lätta att se. Vi lägger kakel och sätter tapet med fokus på exakthet, raka linjer och ett rent slutresultat.',
    does: ['Kakelsättning i kök och på väggar', 'Läggning av klinker och golvplattor', 'Tapetsering av rum och fondväggar', 'Fogning och detaljarbeten', 'Förberedelse av väggar och underlag'],
    know: ['Är det ett våtrum? Skriv det i formuläret så vi kan planera rätt.', 'Har du redan valt kakel eller tapet? Berätta gärna vilken typ och storlek.', 'Vi kan kombinera med måleri och snickeri för ett helt färdigt rum.'],
    faq: [['Kan ni både lägga kakel och sätta tapet?', 'Ja, båda ingår bland våra tjänster.'], ['Behöver jag köpa material själv?', 'Det avgör vi tillsammans i offerten – berätta gärna dina önskemål.']] },
  { slug: 'gravning', name: 'Gräv & mark', form: 'Grävning & Markarbete', tx: 'tx-dig',
    short: 'Grundarbeten och markförberedelser – en stabil start för allt som ska byggas.',
    intro: 'Allt bra byggande börjar med marken. Vi hjälper till med gräv- och markarbeten som skapar en stabil och korrekt grund för mur, sten, uteplatser och andra projekt.',
    does: ['Grävning och markförberedelse', 'Grundarbeten inför mur och byggnation', 'Förberedelse av ytor för stenläggning', 'Avjämning och iordningställande av tomt', 'Samordning med våra mur- och stenarbeten'],
    know: ['Beskriv ytan och vad den ska användas till så kan vi bedöma behovet.', 'Tänk på åtkomst: kan maskiner ta sig fram till arbetsplatsen?', 'Gräv- och markarbete kombineras ofta med stenläggning eller murning.'],
    faq: [['Kan ni göra både grävning och själva bygget?', 'Ja, det är en styrka att kunna ta hela kedjan från mark till färdigt resultat.'], ['Hur lång tid tar markarbetet?', 'Det beror på ytan och förutsättningarna. Vi ger en tidsuppskattning i offerten.']] }
];

const HEAD_FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">';
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function layout({ file, title, desc, body, active = '', schema = '' }) {
  const nav = (href, label, key) => `<a href="${href}"${active === key ? ' class="on"' : ''}>${label}</a>`;
  const html = `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#ece8df">
<meta property="og:image" content="hero-bg.jpg">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:locale" content="sv_SE">
<link rel="icon" href="favicon.png" type="image/png">
${HEAD_FONTS}
<link rel="stylesheet" href="styles.css">${schema}
</head>
<body>
<div class="util mono"><div class="wrap"><span>Skövde med omnejd · Kostnadsfri offert</span><span>Ring oss: <a href="tel:${TEL}">${PHONE}</a></span></div></div>
<header class="bar"><div class="wrap">
  <a href="index.html" class="logo" aria-label="Smart Gräv och Bygg – startsida"><img class="brandimg" src="logo.png" alt="" width="67" height="62">Smart Gräv &amp; Bygg</a>
  <button class="burger" id="burger" aria-expanded="false" aria-controls="menu">Meny</button>
  <nav class="menu" id="menu" aria-label="Huvudmeny">
    ${nav('index.html', 'Hem', 'hem')}
    <div class="dd"><a href="tjanster.html"${active === 'tjanster' ? ' class="on"' : ''}>Tjänster</a><div class="sub">${SERVICES.map(s => `<a href="${s.slug}.html">${s.name}</a>`).join('')}</div></div>
    ${nav('sa-jobbar-vi.html', 'Så jobbar vi', 'process')}
    ${nav('om-oss.html', 'Om oss', 'om')}
    ${nav('kontakt.html', 'Kontakt', 'kontakt')}
    <a href="offert.html" class="btn acc">Begär offert ${ARROW}</a>
  </nav>
</div></header>
<main>
${body}
</main>
<footer><div class="wrap">
  <div class="fgrid">
    <div><a href="index.html" class="logo"><img class="brandimg" src="logo.png" alt="Smart Gräv och Bygg" width="119" height="110"></a><p style="max-width:32ch">Din lokala byggpartner i Skövde. Kvalitet, noggrannhet och pålitlighet.</p></div>
    <div><h4>Tjänster</h4><ul>${SERVICES.map(s => `<li><a href="${s.slug}.html">${s.name}</a></li>`).join('')}</ul></div>
    <div><h4>Företaget</h4><ul><li><a href="om-oss.html">Om oss</a></li><li><a href="sa-jobbar-vi.html">Så jobbar vi</a></li><li><a href="kontakt.html">Kontakt</a></li><li><a href="offert.html">Begär offert</a></li></ul></div>
    <div><h4>Kontakt</h4><ul><li><a href="tel:${TEL}">${PHONE}</a></li><li>Skövde med omnejd</li><li><a href="${FB}" target="_blank" rel="noopener">Facebook</a></li><li><a href="${IG}" target="_blank" rel="noopener">Instagram</a></li></ul></div>
  </div>
  <div class="fbot mono"><span>© <span id="yr">${new Date().getFullYear()}</span> Smart Gräv och Bygg</span><span>Skövde</span></div>
</div></footer>
<div class="callbar"><a href="tel:${TEL}" class="btn acc">Ring ${PHONE}</a><a href="offert.html" class="btn">Offert</a></div>
<script src="app.js"></script>
</body>
</html>`;
  fs.writeFileSync(path.join(PUB, file), html);
}

const ctaBand = (h = 'Redo att <span class="it">börja?</span>') => `<section class="cta"><div class="wrap"><h2>${h}</h2><div class="actions" style="margin:0"><a href="offert.html" class="btn">Begär offert ${ARROW}</a><a href="tel:${TEL}" class="btn line">Ring ${PHONE}</a></div></div></section>`;
const faqHtml = items => `<div class="faq">${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
const pageHead = (crumbs, h1, lead) => `<section class="ph"><div class="wrap"><p class="crumbs mono">${crumbs}</p><h1>${h1}</h1><p class="lead">${lead}</p></div></section>`;

/* ---------------- Hem ---------------- */
layout({
  file: 'index.html', active: 'hem',
  title: 'Smart Gräv och Bygg i Skövde – Måleri, Mur, Snickeri & Stenarbete',
  desc: 'Din lokala byggpartner i Skövde. Snickeri, måleri, fasad, stenläggning, murning, kakel, tapet och grävning. Begär en kostnadsfri offert idag.',
  schema: `\n<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', name: 'Smart Gräv och Bygg', description: 'Byggservice i Skövde: snickeri, måleri, fasad, mur, kakel, tapet, stenläggning och grävning.', telephone: TEL, areaServed: 'Skövde', address: { '@type': 'PostalAddress', addressLocality: 'Skövde', addressCountry: 'SE' }, sameAs: [FB, IG] })}</script>`,
  body: `
<section class="hero hero-bg"><div class="wrap">
  <div class="hero-text">
    <p class="eyebrow mono">Din lokala byggpartner i Skövde</p>
    <h1>Vi bygger dina <span class="it">idéer.</span></h1>
    <p class="lead">Snickeri, måleri, mur, sten och grävning – utfört med hantverkarens stolthet och en tydlig offert från start.</p>
    <ul class="checks"><li>Kostnadsfri offert – utan förpliktelser</li><li>Ett team för hela projektet</li><li>Lokalt i Skövde med omnejd</li></ul>
    <div class="actions"><a href="offert.html" class="btn acc">Begär offert ${ARROW}</a><a href="tel:${TEL}" class="btn line">Ring ${PHONE}</a></div>
    <div class="minis" aria-label="Våra arbetsområden"><a href="murning.html" class="tx-brick"><span>Mur</span></a><a href="maleri.html" class="tx-paint"><span>Måleri</span></a><a href="kakel-tapet.html" class="tx-tile"><span>Kakel</span></a><a href="snickeri.html" class="tx-wood"><span>Snickeri</span></a><a href="stenlaggning.html" class="tx-stone"><span>Sten</span></a></div>
  </div>
</div></section>

<section class="alt"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow mono">Tjänster</p><h2>Allt under <span class="it">ett</span> tak</h2></div><p>Välj det du behöver hjälp med – eller kombinera. Ett team, en kontaktperson.</p></div>
  <div class="cards">${SERVICES.map(s => `<a class="card" href="${s.slug}.html"><div class="tex ${s.tx}"></div><div class="body"><h3>${s.name}</h3><p>${s.short}</p><span class="more">Läs mer</span></div></a>`).join('')}
    <a class="card" href="offert.html" style="background:var(--ink);color:var(--paper)"><div class="body" style="justify-content:center"><h3 style="color:var(--acc)">Annat projekt?</h3><p style="color:#c0bcaf">Beskriv vad du behöver så hjälper vi dig – eller säger ärligt om det inte är något för oss.</p><span class="more" style="color:var(--paper)">Begär offert</span></div></a>
  </div>
</div></section>

<section class="dark"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow mono">Därför Smart Gräv och Bygg</p><h2>Hantverk du <span class="it">kan</span> lita på</h2></div><p>Ett lokalt företag som bryr sig om detaljerna – för det är där skillnaden syns.</p></div>
  <div class="feat">
    <div><span class="n mono">01</span><h3>Kvalitet</h3><p>Rätt material, rätt metod och en finish vi själva vill skriva under på.</p></div>
    <div><span class="n mono">02</span><h3>Noggrannhet</h3><p>Rakt, tätt och rent – från förarbete till städning efteråt.</p></div>
    <div><span class="n mono">03</span><h3>Pålitlighet</h3><p>Vi håller det vi lovar: tider, pris och kommunikation.</p></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow mono">Så går det till</p><h2>Från idé till <span class="it">färdigt</span></h2></div><a class="tl" href="sa-jobbar-vi.html">Läs mer om vårt arbetssätt</a></div>
  <div class="steps">
    <div class="step"><h3>Hör av dig</h3><p>Beskriv projektet i formuläret eller ring oss.</p></div>
    <div class="step"><h3>Vi återkommer</h3><p>Vi går igenom behovet och bokar vid behov ett platsbesök.</p></div>
    <div class="step"><h3>Tydlig offert</h3><p>Arbete, material och tidplan – så du vet vad som gäller.</p></div>
    <div class="step"><h3>Vi bygger</h3><p>Noggrant utfört, och en ren, fin yta efteråt.</p></div>
  </div>
</div></section>

<section class="alt"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow mono">Vanliga frågor</p><h2>Bra att <span class="it">veta</span></h2></div></div>
  ${faqHtml([
    ['Är offerten kostnadsfri?', 'Ja, du får en offert utan förpliktelser. Hör av dig så berättar vi hur det går till.'],
    ['Vilka områden jobbar ni i?', 'Vi är baserade i Skövde och arbetar med omnejd. Skriv var projektet ligger så säger vi om vi kan hjälpa till.'],
    ['Kan ni ta hela projektet?', 'Ja. Vi kombinerar snickeri, måleri, mur, sten, kakel och grävning – så att du slipper samordna flera företag.'],
    ['Hur snabbt får jag svar?', 'Vi återkommer så snart vi kan. Är det brådskande, ring oss direkt på ' + PHONE + '.']
  ])}
</div></section>
${ctaBand()}`
});

/* ---------------- Tjänster ---------------- */
layout({
  file: 'tjanster.html', active: 'tjanster',
  title: 'Våra tjänster – Snickeri, måleri, mur, sten & grävning | Smart Gräv och Bygg',
  desc: 'Se alla tjänster hos Smart Gräv och Bygg i Skövde: snickeri, måleri, fasad, stenläggning, murning, kakel & tapet samt grävning.',
  body: `${pageHead('<a href="index.html">Hem</a> / Tjänster', 'Våra <span class="it">tjänster</span>', 'Sju områden, ett team. Välj en tjänst för att läsa mer, eller begär offert direkt.')}
<section><div class="wrap"><div class="cards">${SERVICES.map(s => `<a class="card" href="${s.slug}.html"><div class="tex ${s.tx}"></div><div class="body"><h3>${s.name}</h3><p>${s.short}</p><span class="more">Läs mer</span></div></a>`).join('')}</div></div></section>
${ctaBand('Osäker på <span class="it">vad</span> du behöver?')}`
});

/* ---------------- Tjänstesidor ---------------- */
for (const s of SERVICES) {
  const others = SERVICES.filter(x => x.slug !== s.slug);
  layout({
    file: `${s.slug}.html`, active: 'tjanster',
    title: `${s.name} i Skövde – Smart Gräv och Bygg`,
    desc: `${s.name} i Skövde med omnejd. ${s.short} Begär kostnadsfri offert.`,
    body: `${pageHead(`<a href="index.html">Hem</a> / <a href="tjanster.html">Tjänster</a> / ${s.name}`, `${s.name} <span class="it">i Skövde</span>`, s.short)}
<section><div class="wrap two">
  <div class="prose">
    <div class="tex-big ${s.tx}" role="img" aria-label="${s.name}"></div>
    <h2>Om tjänsten</h2><p>${s.intro}</p>
    <h2>Det här hjälper vi med</h2><ul class="list">${s.does.map(d => `<li>${d}</li>`).join('')}</ul>
    <h2>Bra att veta</h2><ul class="list">${s.know.map(d => `<li>${d}</li>`).join('')}</ul>
    <h2>Vanliga frågor</h2>${faqHtml(s.faq)}
  </div>
  <aside class="aside"><h3>Få offert på ${s.name.toLowerCase()}</h3><p>Berätta vad du vill ha gjort så återkommer vi med en tydlig offert.</p>
    <a href="offert.html?tjanst=${encodeURIComponent(s.form)}" class="btn acc">Begär offert ${ARROW}</a>
    <a class="tel" href="tel:${TEL}">${PHONE}</a></aside>
</div></section>
<section class="alt"><div class="wrap"><div class="sec-head"><h2>Fler <span class="it">tjänster</span></h2></div>
  <div class="related">${others.map(o => `<a href="${o.slug}.html">${o.name} <span>→</span></a>`).join('')}</div></div></section>
${ctaBand()}`
  });
}

/* ---------------- Så jobbar vi ---------------- */
layout({
  file: 'sa-jobbar-vi.html', active: 'process',
  title: 'Så jobbar vi – från förfrågan till färdigt resultat | Smart Gräv och Bygg',
  desc: 'Så går det till när du anlitar Smart Gräv och Bygg: förfrågan, platsbesök, tydlig offert och noggrant utfört arbete.',
  body: `${pageHead('<a href="index.html">Hem</a> / Så jobbar vi', 'Så <span class="it">jobbar</span> vi', 'Ett enkelt och tydligt arbetssätt – så att du vet vad som händer och när.')}
<section><div class="wrap"><div class="steps big">
  <div class="step"><h3>Hör av dig</h3><p>Fyll i offertformuläret eller ring oss.</p><p>Berätta vad du vill ha gjort, var projektet ligger och när du helst vill börja. Ju mer information, desto bättre kan vi hjälpa dig.</p></div>
  <div class="step"><h3>Vi återkommer</h3><p>Vi kontaktar dig för att gå igenom behovet.</p><p>Vi ställer de frågor som behövs och bokar vid behov ett platsbesök för att se förutsättningarna och ta mått.</p></div>
  <div class="step"><h3>Tydlig offert</h3><p>Du får veta vad som ingår och vad det kostar.</p><p>Offerten beskriver arbetet, material och tidplan, så att du kan fatta ett tryggt beslut.</p></div>
  <div class="step"><h3>Vi bygger</h3><p>Arbetet utförs noggrant och enligt överenskommelse.</p><p>Du har en tydlig kontaktperson under hela projektet och vi lämnar arbetsplatsen ren och fin.</p></div>
</div></div></section>
<section class="dark"><div class="wrap"><div class="sec-head"><div><p class="eyebrow mono">Offerten</p><h2>Det här ska en bra <span class="it">offert</span> ha</h2></div></div>
  <div class="feat"><div><span class="n mono">A</span><h3>Tydligt arbete</h3><p>Vad som ska göras – och vad som inte ingår.</p></div><div><span class="n mono">B</span><h3>Pris och material</h3><p>Så att du kan jämföra och veta vad du betalar för.</p></div><div><span class="n mono">C</span><h3>Tidplan</h3><p>När arbetet startar och ungefär när det är klart.</p></div></div>
</div></section>
<section><div class="wrap"><div class="sec-head"><div><p class="eyebrow mono">Frågor</p><h2>Vanliga <span class="it">frågor</span></h2></div></div>
${faqHtml([
    ['Kostar det något att få en offert?', 'Nej, offerten är kostnadsfri och utan förpliktelser.'],
    ['Måste ni komma på platsbesök?', 'Inte alltid. För mindre jobb kan en beskrivning och bilder räcka, men för större projekt bokar vi ofta ett besök.'],
    ['Kan jag få hjälp med flera typer av arbete samtidigt?', 'Ja. Vi utför snickeri, måleri, mur, sten, kakel och gräv – ofta i samma projekt.'],
    ['Hur når jag er snabbast?', 'Ring ' + PHONE + ' om det är brådskande, annars fyller du i offertformuläret.']
  ])}
</div></section>
${ctaBand()}`
});

/* ---------------- Om oss ---------------- */
layout({
  file: 'om-oss.html', active: 'om',
  title: 'Om oss – Smart Gräv och Bygg i Skövde',
  desc: 'Smart Gräv och Bygg är ett lokalt byggföretag i Skövde med fokus på kvalitet, noggrannhet och pålitlighet.',
  body: `${pageHead('<a href="index.html">Hem</a> / Om oss', 'Om <span class="it">oss</span>', 'Ett lokalt byggföretag i Skövde som bryr sig om detaljerna.')}
<section><div class="wrap two">
  <div class="prose">
    <h2>Hantverk i Skövde</h2>
    <p>Smart Gräv och Bygg är ett lokalt byggföretag i Skövde. Vi arbetar med snickeri, måleri, fasad, mur, sten, kakel, tapet och gräv- och markarbete – både inomhus och utomhus.</p>
    <p>Vårt mål är enkelt: att ge dig ett resultat du är nöjd med, med ett arbetssätt där du alltid vet vad som gäller. Vi lägger tid på förarbetet, arbetar noggrant och håller det vi lovar.</p>
    <h2>Våra värderingar</h2>
    <ul class="list"><li><strong>Kvalitet</strong> – rätt material, rätt metod och en finish vi står för.</li><li><strong>Noggrannhet</strong> – rakt, tätt och rent i varje detalj.</li><li><strong>Pålitlighet</strong> – tider, pris och kommunikation som håller.</li></ul>
    <h2>Ett team för hela projektet</h2>
    <p>Eftersom vi kan många delar av byggprocessen kan du ha en enda kontaktperson för hela projektet – från markarbete och mur till målning och kakel. Det sparar tid och minskar risken för missförstånd.</p>
  </div>
  <aside class="aside"><h3>Prata med oss</h3><p>Berätta om ditt projekt – vi lyssnar och ger ärlig feedback.</p><a href="offert.html" class="btn acc">Begär offert ${ARROW}</a><a class="tel" href="tel:${TEL}">${PHONE}</a></aside>
</div></section>
<section class="alt"><div class="wrap"><div class="sec-head"><h2>Det här <span class="it">gör</span> vi</h2><a class="tl" href="tjanster.html">Se alla tjänster</a></div>
<div class="related">${SERVICES.map(o => `<a href="${o.slug}.html">${o.name} <span>→</span></a>`).join('')}</div></div></section>
${ctaBand()}`
});

/* ---------------- Kontakt ---------------- */
layout({
  file: 'kontakt.html', active: 'kontakt',
  title: 'Kontakt – Smart Gräv och Bygg i Skövde',
  desc: 'Kontakta Smart Gräv och Bygg i Skövde. Ring 073-358 21 29 eller begär en kostnadsfri offert online.',
  body: `${pageHead('<a href="index.html">Hem</a> / Kontakt', '<span class="it">Hör</span> av dig', 'Ring oss eller skicka en offertförfrågan – vi återkommer så snart vi kan.')}
<section><div class="wrap two">
  <div>
    <a class="contact-big" href="tel:${TEL}">${PHONE}</a>
    <dl class="kv mono"><dt>Område</dt><dd>Skövde med omnejd</dd><dt>Facebook</dt><dd><a href="${FB}" target="_blank" rel="noopener">Elyas Måleri Murare ↗</a></dd><dt>Instagram</dt><dd><a href="${IG}" target="_blank" rel="noopener">@elyas.gholami651 ↗</a></dd><dt>Offert</dt><dd>Kostnadsfri</dd></dl>
  </div>
  <aside class="aside"><h3>Begär offert</h3><p>Det snabbaste sättet att komma igång. Beskriv ditt projekt så får du en tydlig offert.</p><a href="offert.html" class="btn acc">Till offertformuläret ${ARROW}</a></aside>
</div></section>
<section class="alt"><div class="wrap"><div class="facts">
  <div class="fact"><h3>Brådskande?</h3><p>Ring oss direkt på ${PHONE} så hjälper vi dig så fort vi kan.</p></div>
  <div class="fact"><h3>Större projekt</h3><p>Använd offertformuläret och beskriv så mycket du kan – mått, önskemål och tidplan.</p></div>
  <div class="fact"><h3>Följ oss</h3><p>Se våra uppdateringar på <a class="tl" href="${FB}" target="_blank" rel="noopener">Facebook</a> och <a class="tl" href="${IG}" target="_blank" rel="noopener">Instagram</a>.</p></div>
</div></div></section>`
});

/* ---------------- Offert ---------------- */
const chips = SERVICES.map(s => s.form).concat('Annat / Vet ej').map((v, i) => `<span><input type="radio" name="service" id="s${i}" value="${esc(v)}"><label for="s${i}">${esc(v)}</label></span>`).join('');
layout({
  file: 'offert.html', active: 'offert',
  title: 'Begär offert – Smart Gräv och Bygg i Skövde',
  desc: 'Begär en kostnadsfri offert från Smart Gräv och Bygg i Skövde. Beskriv ditt projekt så återkommer vi.',
  body: `${pageHead('<a href="index.html">Hem</a> / Begär offert', 'Begär <span class="it">offert</span>', 'Fyll i formuläret så återkommer vi med en tydlig offert. Det tar ungefär två minuter.')}
<section><div class="wrap q-grid">
  <form class="q" id="form" novalidate>
    <fieldset><legend><span>01</span> Vad ska göras?</legend>
      <div class="field" id="f-service"><div class="chips">${chips}</div><span class="emsg"></span></div>
      <div class="field" id="f-message"><label for="message">Beskriv projektet *</label><textarea id="message" name="message" placeholder="Vad ska göras, ungefärlig storlek (kvm), önskemål och eventuella detaljer…"></textarea><span class="emsg"></span></div>
    </fieldset>
    <fieldset><legend><span>02</span> Plats &amp; tid</legend>
      <div class="g2">
        <div class="field"><label for="city">Ort / adress</label><input type="text" id="city" name="city" autocomplete="address-level2" placeholder="t.ex. Skövde"></div>
        <div class="field"><label for="timing">När vill du starta?</label><select id="timing" name="timing"><option value="">Välj…</option><option>Så snart som möjligt</option><option>Inom 1 månad</option><option>Inom 3 månader</option><option>Flexibelt / vet ej</option></select></div>
      </div>
      <div class="field"><label for="budget">Ungefärlig budget (valfritt)</label><select id="budget" name="budget"><option value="">Vill inte ange</option><option>Under 10 000 kr</option><option>10 000 – 50 000 kr</option><option>50 000 – 150 000 kr</option><option>Över 150 000 kr</option></select></div>
    </fieldset>
    <fieldset><legend><span>03</span> Dina uppgifter</legend>
      <div class="g2">
        <div class="field" id="f-name"><label for="name">Namn *</label><input type="text" id="name" name="name" autocomplete="name"><span class="emsg"></span></div>
        <div class="field" id="f-phone"><label for="phone">Telefon *</label><input type="tel" id="phone" name="phone" autocomplete="tel"><span class="emsg"></span></div>
      </div>
      <div class="g2">
        <div class="field" id="f-email"><label for="email">E-post (valfritt)</label><input type="email" id="email" name="email" autocomplete="email"><span class="emsg"></span></div>
        <div class="field"><label for="contactPref">Helst kontakt via</label><select id="contactPref" name="contactPref"><option value="">Spelar ingen roll</option><option>Telefonsamtal</option><option>SMS</option><option>E-post</option></select></div>
      </div>
      <div class="hp" aria-hidden="true"><label>Webbplats<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="field" id="f-consent"><div class="consent"><input type="checkbox" id="consent" name="consent"><label for="consent">Jag godkänner att Smart Gräv och Bygg lagrar och använder mina uppgifter för att kunna svara på min förfrågan. Uppgifterna används inte för något annat.</label></div><span class="emsg"></span></div>
    </fieldset>
    <button class="btn acc" type="submit" id="submit">Skicka förfrågan ${ARROW}</button>
    <p class="formerr" id="formerr" role="alert"></p>
    <div class="sent" id="sent" role="status" tabindex="-1"></div>
  </form>
  <div>
    <div class="side-card"><h3>Så går det till</h3><ol><li>Du skickar förfrågan.</li><li>Vi återkommer och går igenom behovet.</li><li>Du får en tydlig offert.</li></ol></div>
    <div class="side-card" style="background:var(--ink);color:var(--paper)"><h3 style="color:var(--acc)">Hellre ringa?</h3><p style="color:#c0bcaf;margin-bottom:1rem">Brådskande eller bara lättare att prata?</p><a class="btn acc" href="tel:${TEL}">${PHONE}</a></div>
  </div>
</div></section>`
});

/* ---------------- 404 ---------------- */
layout({ file: '404.html', title: 'Sidan hittades inte – Smart Gräv och Bygg', desc: 'Sidan kunde inte hittas.',
  body: `${pageHead('<a href="index.html">Hem</a> / 404', 'Sidan <span class="it">saknas</span>', 'Länken kan vara felaktig eller sidan flyttad.')}<section><div class="wrap"><div class="actions" style="margin:0"><a href="index.html" class="btn">Till startsidan</a><a href="offert.html" class="btn acc">Begär offert</a></div></div></section>` });

/* ---------------- Kopiera statisk sajt till docs/ ---------------- */
fs.rmSync(DOCS, { recursive: true, force: true });
fs.mkdirSync(DOCS, { recursive: true });
for (const f of fs.readdirSync(PUB)) {
  if (/^admin\./.test(f) || f === 'robots.txt') continue;
  fs.copyFileSync(path.join(PUB, f), path.join(DOCS, f));
}
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
console.log('Byggde', fs.readdirSync(PUB).filter(f => f.endsWith('.html') && !f.startsWith('admin')).length, 'sidor.');
