(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SERVICES = ['Snickeri / Näjari', 'Måleri', 'Fasad', 'Stenarbete / Stenläggning', 'Murning / Byggnation', 'Kakel & Tapet', 'Grävning & Markarbete', 'Annat / Vet ej'];
  $('#yr').textContent = new Date().getFullYear();

  // Meny + dölj topbar vid scroll ner
  const bar = $('#bar'), menu = $('#menu'), burger = $('#burger'); let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY; bar.classList.toggle('hide', y > lastY && y > 300 && !menu.classList.contains('open')); lastY = y;
  }, { passive: true });
  burger.addEventListener('click', () => { const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); burger.textContent = o ? 'Stäng' : 'Meny'; });
  menu.addEventListener('click', e => { if (e.target.closest('a')) { menu.classList.remove('open'); burger.textContent = 'Meny'; } });

  // Reveal
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.rv').forEach(el => io.observe(el));

  // Processlinje: framsteg kopplat till scroll
  const track = $('#track'), sts = $$('.st');
  const upd = () => {
    const r = track.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * .8 - r.top) / (r.height + vh * .3)));
    track.style.setProperty('--p', p.toFixed(3));
    sts.forEach((s, i) => s.classList.toggle('on', p > i / sts.length + .02));
  };
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();

  // Egen markör + materialförhandsvisning på tjänsterna
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine) {
    const cur = $('#cursor'), peek = $('#peek'), lbl = $('#peekLbl'); let tx = 0, ty = 0, cx = 0, cy = 0, px = 0, py = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('vis'); }, { passive: true });
    (function loop() {
      cx += (tx - cx) * .25; cy += (ty - cy) * .25; px += (tx - px) * .12; py += (ty - py) * .12;
      cur.style.transform = `translate(${cx - cur.offsetWidth / 2}px,${cy - cur.offsetHeight / 2}px)`;
      peek.style.left = px + 'px'; peek.style.top = py + 'px'; requestAnimationFrame(loop);
    })();
    $$('a,button,.row,label').forEach(el => { el.addEventListener('pointerenter', () => cur.classList.add('big')); el.addEventListener('pointerleave', () => cur.classList.remove('big')); });
    $$('.row').forEach(r => {
      r.addEventListener('pointerenter', () => { peek.className = 'peek on ' + r.dataset.tx; peek.style.transform = 'translate(40px,-50%) scale(1) rotate(3deg)'; lbl.textContent = r.querySelector('h3').textContent; });
      r.addEventListener('pointerleave', () => { peek.classList.remove('on'); peek.style.transform = ''; });
    });
    // magnetiska knappar
    $$('.btn').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px,${(e.clientY - r.top - r.height / 2) * .22}px)`; });
      b.addEventListener('pointerleave', () => b.style.transform = '');
    });
  }

  // Tjänst-rad → förifyll formuläret
  const chips = $('#chips');
  SERVICES.forEach((s, i) => chips.insertAdjacentHTML('beforeend', `<span><input type="radio" name="service" id="s${i}" value="${s}"><label for="s${i}">${s}</label></span>`));
  $$('[data-service]').forEach(a => a.addEventListener('click', () => { const r = $$('input', chips).find(i => i.value === a.dataset.service); if (r) r.checked = true; }));

  // Stegvis formulär
  const form = $('#form'), next = $('#next'), back = $('#back'), formerr = $('#formerr'); let step = 1;
  const setErr = (id, msg) => { const f = $('#f-' + id); if (!f) return; f.classList.toggle('err', !!msg); const m = $('.emsg', f); if (m) m.textContent = msg || ''; };
  const val = () => ({
    service: (form.querySelector('input[name=service]:checked') || {}).value || '', name: form.name.value, phone: form.phone.value, email: form.email.value,
    city: form.city.value, timing: form.timing.value, message: form.message.value, website: form.website.value, consent: $('#consent').checked
  });
  function check(s) {
    const d = val(), e = {};
    if (s === 1 && !d.service) e.service = 'Välj typ av arbete.';
    if (s === 2 && d.message.trim().length < 10) e.message = 'Beskriv kort vad du behöver hjälp med.';
    if (s === 3) {
      if (d.name.trim().length < 2) e.name = 'Ange ditt namn.';
      if (!/^[+\d][\d\s\-()]{6,}$/.test(d.phone.trim())) e.phone = 'Ange ett giltigt telefonnummer.';
      if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Ogiltig e-postadress.';
      if (!d.consent) e.consent = 'Godkänn för att vi ska kunna svara.';
    }
    ['service', 'message', 'name', 'phone', 'email', 'consent'].forEach(k => setErr(k, e[k]));
    return !Object.keys(e).length;
  }
  function show(n) {
    step = n; $$('.pane').forEach(p => p.classList.toggle('on', +p.dataset.pane === n));
    $$('#steps i').forEach((i, k) => i.classList.toggle('on', k < n)); $('#stepLbl').textContent = `Steg ${n} av 3`;
    back.hidden = n === 1; next.firstChild.textContent = n === 3 ? 'Skicka förfrågan ' : 'Nästa '; formerr.textContent = '';
  }
  back.addEventListener('click', () => show(step - 1));
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); next.click(); } });
  next.addEventListener('click', async () => {
    if (!check(step)) return;
    if (step < 3) return show(step + 1);
    next.disabled = true; const old = next.firstChild.textContent; next.firstChild.textContent = 'Skickar… ';
    try {
      const r = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(val()) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { form.classList.add('done'); form.reset(); return; }
      if (j.fields) { const order = { service: 1, message: 2 }; const k = Object.keys(j.fields)[0]; show(order[k] || 3); Object.entries(j.fields).forEach(([f, m]) => setErr(f, m)); }
      formerr.textContent = j.error || 'Något gick fel. Försök igen eller ring oss.';
    } catch { formerr.textContent = 'Kunde inte nå servern. Försök igen eller ring 073-358 21 29.'; }
    next.disabled = false; next.firstChild.textContent = old;
  });

  // Statiskt läge (t.ex. GitHub Pages): ingen server => visa kontaktuppgifter i stället för formuläret
  fetch('healthz', { cache: 'no-store' }).then(r => r.text().then(t => { if (!r.ok || t.trim() !== 'ok') throw 0; })).catch(() => {
    form.innerHTML = '<h3>Ring oss <span class="it">direkt</span></h3><p style="margin-bottom:1.4rem;max-width:36ch">Vi tar emot förfrågningar per telefon. Berätta vad du vill bygga så återkommer vi med en tydlig offert.</p><a class="btn acc" href="tel:+46733582129">Ring 073-358 21 29</a>';
  });
})();
