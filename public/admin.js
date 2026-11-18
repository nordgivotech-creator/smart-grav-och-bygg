(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LABEL = { ny: 'Ny', kontaktad: 'Kontaktad', offert: 'Offert skickad', vunnen: 'Vunnen', 'förlorad': 'Förlorad' };
  let data = [], statuses = [], filter = 'alla', query = '', selId = null, knownIds = null, timer = null;

  const api = async (url, opts = {}) => {
    const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json' } });
    if (r.status === 401) { showLogin(); throw new Error('401'); }
    return r.json();
  };
  const fmt = iso => new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
  const toast = msg => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3500); };

  function beep() {
    try {
      const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.setValueAtTime(.15, c.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .5); o.start(); o.stop(c.currentTime + .5);
    } catch {}
  }

  function showLogin() { clearInterval(timer); $('#app').hidden = true; $('#login').hidden = false; $('#pw').focus(); }
  function showApp() { $('#login').hidden = true; $('#app').hidden = false; load(); clearInterval(timer); timer = setInterval(load, 20000); }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault(); $('#loginErr').textContent = '';
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#pw').value }) });
      const j = await r.json();
      if (r.ok) { $('#pw').value = ''; showApp(); } else $('#loginErr').textContent = j.error || 'Inloggning misslyckades.';
    } catch { $('#loginErr').textContent = 'Kunde inte nå servern.'; }
  });
  $('#logout').addEventListener('click', async () => { await fetch('/api/admin/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); showLogin(); });

  async function load() {
    try {
      const j = await api('/api/admin/inquiries');
      data = j.inquiries; statuses = j.statuses;
      const ids = new Set(data.map(i => i.id));
      if (knownIds) {
        const fresh = data.filter(i => !knownIds.has(i.id));
        if (fresh.length) { beep(); toast(`${fresh.length} ny förfrågan: ${fresh[0].name}`); }
      }
      knownIds = ids;
      $('#live').classList.remove('off'); $('#live').textContent = '● Live';
      render();
    } catch (e) { if (e.message !== '401') { $('#live').classList.add('off'); $('#live').textContent = '● Offline'; } }
  }

  function render() {
    const nNew = data.filter(i => i.status === 'ny').length;
    document.title = (nNew ? `(${nNew}) ` : '') + 'Personalpanel – Smart Gräv och Bygg';
    const week = Date.now() - 7 * 864e5;
    $('#stats').innerHTML = [
      ['hot', nNew, 'Nya'], ['', data.filter(i => ['kontaktad', 'offert'].includes(i.status)).length, 'Pågående'],
      ['', data.filter(i => i.status === 'vunnen').length, 'Vunna'], ['', data.filter(i => new Date(i.createdAt) > week).length, 'Senaste 7 dagarna'], ['', data.length, 'Totalt']
    ].map(([c, n, l]) => `<div class="stat ${c}"><b>${n}</b><span>${l}</span></div>`).join('');

    const count = s => s === 'alla' ? data.length : data.filter(i => i.status === s).length;
    $('#tabs').innerHTML = ['alla', ...statuses].map(s => `<button class="tab ${filter === s ? 'on' : ''}" data-s="${s}">${s === 'alla' ? 'Alla' : LABEL[s]}<i>${count(s)}</i></button>`).join('');

    const q = query.toLowerCase();
    const rows = data.filter(i => (filter === 'alla' || i.status === filter) &&
      (!q || [i.name, i.phone, i.email, i.city, i.service, i.message, i.note].join(' ').toLowerCase().includes(q)));
    $('#list').innerHTML = rows.length ? rows.map(i => `
      <div class="item ${i.status === 'ny' ? 'isnew' : ''} ${i.id === selId ? 'sel' : ''}" data-id="${i.id}">
        <div class="r1"><b>${esc(i.name)}</b><span class="badge ${i.status}">${LABEL[i.status]}</span></div>
        <div class="meta">${esc(i.service)} · ${esc(i.city || 'Ort ej angiven')} · ${fmt(i.createdAt)}</div>
        <p>${esc(i.message)}</p>
      </div>`).join('') : '<div class="item" style="cursor:default;text-align:center;color:var(--muted)">Inga förfrågningar att visa.</div>';
    renderDetail(false);
  }

  function renderDetail(force) {
    const d = $('#detail'), i = data.find(x => x.id === selId);
    if (!i) { d.innerHTML = '<div class="empty">Välj en förfrågan för att se detaljer.</div>'; return; }
    // Skriv inte över pågående anteckning vid auto-uppdatering
    if (!force && d.dataset.id === i.id && d.contains(document.activeElement)) return;
    d.dataset.id = i.id;
    const tel = i.phone.replace(/[^\d+]/g, '');
    d.innerHTML = `
      <h2>${esc(i.name)}</h2><div class="sub">Inkom ${fmt(i.createdAt)}</div>
      <div class="quick">
        <a class="btn" href="tel:${esc(tel)}">Ring</a>
        ${i.email ? `<a class="btn ghost" href="mailto:${esc(i.email)}?subject=${encodeURIComponent('Din förfrågan hos Smart Gräv och Bygg')}">Maila</a>` : ''}
        <a class="btn ghost" href="sms:${esc(tel)}">SMS</a>
      </div>
      <dl class="kv">
        <dt>Tjänst</dt><dd>${esc(i.service)}</dd>
        <dt>Telefon</dt><dd>${esc(i.phone)}</dd>
        <dt>E-post</dt><dd>${esc(i.email || '–')}</dd>
        <dt>Ort / adress</dt><dd>${esc(i.city || '–')}</dd>
        <dt>Starttid</dt><dd>${esc(i.timing || '–')}</dd>
      </dl>
      <div class="msg">${esc(i.message)}</div>
      <label for="st">Status</label>
      <select id="st">${statuses.map(s => `<option value="${s}" ${s === i.status ? 'selected' : ''}>${LABEL[s]}</option>`).join('')}</select>
      <label for="nt">Intern anteckning</label>
      <textarea id="nt" placeholder="T.ex. platsbesök bokat torsdag 10:00…">${esc(i.note)}</textarea>
      <div class="row"><button class="btn" id="save">Spara</button><button class="btn danger" id="del">Ta bort</button></div>`;
  }

  $('#tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) { filter = b.dataset.s; render(); } });
  $('#q').addEventListener('input', e => { query = e.target.value; render(); });
  $('#list').addEventListener('click', e => { const it = e.target.closest('.item[data-id]'); if (it) { selId = it.dataset.id; render(); renderDetail(true); if (innerWidth < 900) $('#detail').scrollIntoView({ behavior: 'smooth' }); } });
  $('#detail').addEventListener('click', async e => {
    const i = data.find(x => x.id === selId); if (!i) return;
    if (e.target.id === 'save') {
      try {
        const upd = await api('/api/admin/inquiries/' + i.id, { method: 'PATCH', body: JSON.stringify({ status: $('#st').value, note: $('#nt').value }) });
        Object.assign(i, upd); toast('Sparat ✓'); render(); renderDetail(true);
      } catch {}
    }
    if (e.target.id === 'del' && confirm(`Ta bort förfrågan från ${i.name}? Det går inte att ångra.`)) {
      try { await api('/api/admin/inquiries/' + i.id, { method: 'DELETE' }); selId = null; knownIds.delete(i.id); await load(); renderDetail(true); toast('Borttagen'); } catch {}
    }
  });

  // Startkontroll: redan inloggad?
  fetch('/api/admin/me').then(r => r.ok ? showApp() : showLogin()).catch(showLogin);
})();
