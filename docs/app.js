(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const TEL = '+46733582129';

  // Mobilmeny
  const burger = $('#burger'), menu = $('#menu');
  if (burger) burger.addEventListener('click', () => {
    const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); burger.textContent = o ? 'Stäng' : 'Meny';
  });

  const form = $('#form');
  if (!form) return;

  // Förvälj tjänst via ?tjanst=
  try {
    const t = new URLSearchParams(location.search).get('tjanst');
    if (t) { const r = [...form.querySelectorAll('input[name=service]')].find(i => i.value === t); if (r) r.checked = true; }
  } catch {}

  // Finns en server som kan spara förfrågningar? Annars statiskt läge (t.ex. GitHub Pages).
  const hasServer = fetch('healthz', { cache: 'no-store' }).then(r => r.text().then(t => r.ok && t.trim() === 'ok')).catch(() => false);

  const setErr = (id, msg) => { const f = $('#f-' + id); if (!f) return; f.classList.toggle('err', !!msg); const m = $('.emsg', f); if (m) m.textContent = msg || ''; };
  const val = () => ({
    service: (form.querySelector('input[name=service]:checked') || {}).value || '', name: form.name.value.trim(), phone: form.phone.value.trim(),
    email: form.email.value.trim(), city: form.city.value.trim(), timing: form.timing.value, budget: form.budget.value,
    contactPref: form.contactPref.value, message: form.message.value.trim(), website: form.website.value, consent: $('#consent').checked
  });
  function validate(d) {
    const e = {};
    if (!d.service) e.service = 'Välj typ av arbete.';
    if (d.message.length < 10) e.message = 'Beskriv kort vad du behöver hjälp med.';
    if (d.name.length < 2) e.name = 'Ange ditt namn.';
    if (!/^[+\d][\d\s\-()]{6,}$/.test(d.phone)) e.phone = 'Ange ett giltigt telefonnummer.';
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Ogiltig e-postadress.';
    if (!d.consent) e.consent = 'Godkänn för att vi ska kunna svara.';
    ['service', 'message', 'name', 'phone', 'email', 'consent'].forEach(k => setErr(k, e[k]));
    return e;
  }
  const textOf = d => [
    'Hej! Jag vill begära offert från Smart Gräv och Bygg.', '',
    'Tjänst: ' + d.service, d.city && 'Ort: ' + d.city, d.timing && 'Start: ' + d.timing, d.budget && 'Budget: ' + d.budget, '',
    d.message, '', 'Namn: ' + d.name, 'Telefon: ' + d.phone, d.email && 'E-post: ' + d.email, d.contactPref && 'Kontakt via: ' + d.contactPref
  ].filter(x => x !== '' ? !!x : true).join('\n');

  const sent = $('#sent');
  const showStatic = d => {
    const txt = textOf(d);
    sent.innerHTML = '<h2>Nästan <span class="it">klart</span></h2><p style="margin-bottom:1.2rem;max-width:52ch">Skicka din förfrågan till oss med ett meddelande – texten är redan ifylld. Tryck på en av knapparna så öppnas din app.</p>' +
      '<div class="actions" style="margin:0 0 1.4rem"><a class="btn acc" target="_blank" rel="noopener" href="https://wa.me/' + TEL.replace('+', '') + '?text=' + encodeURIComponent(txt) + '">Skicka via WhatsApp</a>' +
      '<a class="btn" href="sms:' + TEL + '?&body=' + encodeURIComponent(txt) + '">Skicka via SMS</a>' +
      '<a class="btn line" href="tel:' + TEL + '">Ring oss</a></div>' +
      '<p class="mono" style="color:var(--mute)">Ditt meddelande lagras inte på den här webbplatsen.</p>';
    form.classList.add('done'); sent.focus();
  };

  form.addEventListener('submit', async e => {
    e.preventDefault(); $('#formerr').textContent = '';
    const data = val();
    if (Object.keys(validate(data)).length) { const f = $('.err', form); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const btn = $('#submit'), old = btn.innerHTML; btn.disabled = true; btn.textContent = 'Skickar…';
    if (!(await hasServer)) { btn.disabled = false; btn.innerHTML = old; return showStatic(data); }
    try {
      const r = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        sent.innerHTML = '<h2>Tack<span class="it">!</span></h2><p style="max-width:52ch">Din förfrågan är skickad. Vi återkommer så snart vi kan. Brådskande? Ring <a class="tl" href="tel:' + TEL + '">073-358 21 29</a>.</p>';
        form.classList.add('done'); form.reset(); sent.focus(); return;
      }
      if (j.fields) Object.entries(j.fields).forEach(([k, v]) => setErr(k, v));
      $('#formerr').textContent = j.error || 'Något gick fel. Försök igen eller ring oss.';
    } catch { $('#formerr').textContent = 'Kunde inte nå servern. Försök igen eller ring 073-358 21 29.'; }
    btn.disabled = false; btn.innerHTML = old;
  });
})();
