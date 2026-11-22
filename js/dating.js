/* NEXO Seznamka — skutečná seznamka nad Supabase (Tinder swipe + Grindr mřížka + realtime chat). */
(() => {
  'use strict';
  const I = window.ICONS;
  const cfg = window.NEXO_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);

  // Po potvrzení e-mailu (PKCE ?code=…) rovnou do seznamky

  const OPT = {
    looking: { date: 'Rande', friends: 'Přátelé', tonight: 'Dnes večer', chat: 'Chat', relationship: 'Vztah', networking: 'Networking' },
    position: { top: 'Aktivní (top)', vers_top: 'Spíš aktivní', versatile: 'Univerzál', vers_bottom: 'Spíš pasivní', bottom: 'Pasivní (bottom)', side: 'Side' },
    body_type: { slim: 'Štíhlá', average: 'Průměrná', athletic: 'Sportovní', muscular: 'Svalnatá', stocky: 'Statná', large: 'Plnější' },
    tribes: { bear: 'Bear', clean_cut: 'Clean-cut', daddy: 'Daddy', discreet: 'Diskrétní', geek: 'Geek', jock: 'Jock', leather: 'Leather', otter: 'Otter', poz: 'Poz', rugged: 'Rugged', sober: 'Sober', trans: 'Trans', twink: 'Twink', muscle: 'Muscle', chub: 'Chub', fem: 'Fem' },
    relationship: { single: 'Single', dating: 'Randím', partnered: 'Mám partnera', open: 'Otevřený vztah', married: 'Ženatý / partnerství', complicated: 'Je to složité' },
    meet_at: { my_place: 'U mě', your_place: 'U tebe', bar: 'Bar', cafe: 'Kavárna', restaurant: 'Restaurace', outdoors: 'Venku', event: 'Na akci' },
    nsfw: { never: 'Nikdy', not_first: 'Ne hned', yes: 'Ano' },
    hiv_status: { negative: 'Negativní', negative_prep: 'Negativní, na PrEP', positive: 'Pozitivní', positive_undetectable: 'Pozitivní, nedetekovatelný (U=U)', unknown: 'Nevím' },
    gender: { man: 'Muž', trans_man: 'Trans muž', nonbinary: 'Nebinární', genderqueer: 'Genderqueer', trans_woman: 'Trans žena', other: 'Jiné' },
    smoking: { no: 'Nekouřím', sometimes: 'Příležitostně', yes: 'Kouřím' },
  };
  const LOOKING = OPT.looking;
  const INTERESTS = ['Hudba', 'Party', 'Tanec', 'Fitness', 'Běh', 'Cyklistika', 'Lezení', 'Jóga', 'Plavání', 'Cestování', 'Příroda', 'Film', 'Seriály', 'Divadlo', 'Umění', 'Design', 'Móda', 'Fotografie', 'Knihy', 'Gaming', 'Technologie', 'Věda', 'Vaření', 'Káva', 'Pivo', 'Víno', 'Zvířata', 'Drag', 'Jazyky', 'Architektura'];
  const LANGS = ['Čeština', 'Slovenština', 'Angličtina', 'Němčina', 'Polština', 'Ukrajinština', 'Ruština', 'Francouzština', 'Španělština', 'Italština'];
  const FILTER_KEY = 'nexo-dating-filters';
  const emptyFilters = () => ({ online: false, has_photo: false, min_age: 18, max_age: 99, max_km: null, min_height: null, max_height: null, min_weight: null, max_weight: null,
    looking: [], positions: [], body_types: [], tribes: [], relationship: [], meet_at: [], nsfw: [], gender: [] });
  const loadFilters = () => { try { return { ...emptyFilters(), ...JSON.parse(localStorage.getItem(FILTER_KEY) || '{}') }; } catch { return emptyFilters(); } };
  const saveFilters = () => { try { localStorage.setItem(FILTER_KEY, JSON.stringify(st.filters)); } catch { /* bez úložiště */ } };
  const activeFilters = (f) => ['online', 'has_photo'].filter((k) => f[k]).length + (f.min_age > 18 || f.max_age < 99 ? 1 : 0)
    + ['max_km', 'min_height', 'max_height', 'min_weight', 'max_weight'].filter((k) => f[k] != null).length
    + ['looking', 'positions', 'body_types', 'tribes', 'relationship', 'meet_at', 'nsfw', 'gender'].reduce((a, k) => a + f[k].length, 0);
  const label = (cat, v) => OPT[cat]?.[v] || v;
  const TAPS = { hi: ['👋', 'Ahoj'], flame: ['🔥', 'Líbíš se mi'], wink: ['😉', 'Mrk'] };
  const REASONS = { fake: 'Falešný profil', spam: 'Spam / reklama', harassment: 'Obtěžování', underage: 'Pravděpodobně nezletilý', inappropriate: 'Nevhodný obsah', other: 'Jiné' };

  let sb = null;
  const st = {
    root: null, mounted: false, booted: false, session: null, me: null,
    view: 'grid', authMode: 'login', busy: false,
    grid: null, deck: null, convos: null, taps: [], people: {},
    filters: null,
    deckMode: null, coords: null, geo: 'unknown',
    chat: null, live: null, hb: null, unreadMsgs: 0,
  };

  /* ---------- Pomocné ---------- */
  const uid = () => st.session?.user?.id;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hue = (id) => [...String(id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const photoUrl = (path) => sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
  const fmtDist = (m) => (m == null ? '' : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`);
  const ageOf = (bd) => { const d = new Date(bd), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
  const ago = (ts) => {
    if (!ts) return '';
    const s = (Date.now() - new Date(ts)) / 1000;
    if (s < 300) return 'online';
    if (s < 3600) return `před ${Math.round(s / 60)} min`;
    if (s < 86400) return `před ${Math.round(s / 3600)} h`;
    return `před ${Math.round(s / 86400)} dny`;
  };
  const time = (ts) => new Date(ts).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const errText = (e) => {
    const m = e?.message || String(e);
    if (/Neplatný e-mail/i.test(m)) return 'Neplatný e-mail.';
    if (/Invalid login/i.test(m)) return 'Špatný e-mail nebo heslo.';
    if (/not confirmed/i.test(m)) return 'E-mail ještě není potvrzený — klikni na odkaz v e-mailu.';
    if (/already registered/i.test(m)) return 'Tento e-mail už je registrovaný. Zkus se přihlásit.';
    if (/rate limit/i.test(m)) return 'Příliš mnoho pokusů, zkus to za chvíli.';
    if (/Password should/i.test(m)) return 'Heslo musí mít aspoň 8 znaků.';
    return m;
  };

  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 3000);
  }
  function modal(html, cls = '') {
    const m = $('#modal');
    m.innerHTML = `<div class="modal-backdrop" data-act="close-modal"></div><div class="modal ${cls}" role="dialog" aria-modal="true"><button class="modal-x" data-act="close-modal" aria-label="Zavřít">${I('x')}</button>${html}</div>`;
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    $('#modal').classList.remove('open');
    $('#modal').innerHTML = '';
    document.body.style.overflow = '';
    st.chat = null;
  }

  function avatar(p, cls = '') {
    const ph = p.photos?.[0];
    if (ph) return `<div class="d-av ${cls}"><img src="${esc(photoUrl(ph))}" alt="" loading="lazy" /></div>`;
    const h = hue(p.id || p.other || 'x');
    return `<div class="d-av ${cls}" style="background:radial-gradient(circle at 50% 35%, hsl(${h} 65% 55%), hsl(${h + 30} 55% 22%) 60%, hsl(${h + 40} 40% 8%))"><span>${esc((p.display_name || '?')[0])}</span></div>`;
  }

  /* Zmenšení fotky + odstranění EXIF (včetně GPS) přes canvas */
  function processImage(file, max = 1280) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) return reject(new Error('Soubor není obrázek'));
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error('Nelze zpracovat obrázek'))), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Nelze načíst obrázek')); };
      img.src = url;
    });
  }
  async function uploadPhoto(file, sub = '') {
    const blob = await processImage(file);
    const path = `${uid()}/${sub}${crypto.randomUUID()}.jpg`;
    const { error } = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    return path;
  }

  /* ---------- Poloha a aktivita ---------- */
  function locate() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { st.geo = 'unsupported'; return resolve(null); }
      navigator.geolocation.getCurrentPosition(
        (pos) => { st.geo = 'ok'; st.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; resolve(st.coords); },
        () => { st.geo = 'denied'; resolve(null); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }
  async function heartbeat(withLocation = true) {
    if (!uid() || !st.me) return;
    const c = withLocation && st.geo !== 'denied' ? await locate() : st.coords;
    await sb.rpc('heartbeat', c ? { p_lat: c.lat, p_lng: c.lng } : {});
  }

  /* ---------- Realtime ---------- */
  function startLive() {
    if (st.live || !uid()) return;
    const me = uid();
    st.live = sb.channel('nexo-live-' + me)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient=eq.${me}` }, ({ new: m }) => onIncoming(m))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender=eq.${me}` }, ({ new: m }) => {
        if (st.chat && st.chat.other === m.recipient) {
          const x = st.chat.msgs.find((y) => y.id === m.id);
          if (x) { x.read_at = m.read_at; drawChatBody(); }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'taps', filter: `to_id=eq.${me}` }, async ({ new: t }) => {
        const p = await person(t.from_id);
        st.taps.unshift({ ...t, p });
        toast(`${TAPS[t.kind][0]} ${esc(p?.display_name || 'Někdo')} ti poslal tap`);
        if (st.view === 'chats') draw(); else drawBadge();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, async ({ new: m }) => {
        const other = m.user_a === me ? m.user_b : m.user_a;
        const p = await person(other);
        if (p && !$('.d-match')) matchModal(p);
        st.convos = null;
      })
      .subscribe();
    heartbeat();
    st.hb = setInterval(() => heartbeat(), 60000);
    loadConvos(false);
    loadTaps();
  }
  function stopLive() {
    if (st.live) sb.removeChannel(st.live);
    st.live = null;
    clearInterval(st.hb);
  }

  async function onIncoming(m) {
    if (st.chat && st.chat.other === m.sender) {
      st.chat.msgs.push(m);
      drawChatBody();
      sb.rpc('mark_read', { p_other: m.sender });
    } else {
      st.unreadMsgs++;
      const p = await person(m.sender);
      toast(`${I('chat')} ${esc(p?.display_name || 'Nová zpráva')}: ${esc(m.body ? m.body.slice(0, 60) : '📷 Fotka')}`);
      drawBadge();
    }
    st.convos = null;
    if (st.view === 'chats' && !st.chat) loadConvos();
  }

  async function person(id) {
    if (st.people[id]) return st.people[id];
    const { data } = await sb.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) { data.age = ageOf(data.birthdate); st.people[id] = { ...data, online: (Date.now() - new Date(data.last_active)) < 300000 }; }
    return st.people[id];
  }

  /* ---------- Načítání dat ---------- */
  async function loadGrid() {
    const { data, error } = await sb.rpc('nearby', { p_filters: st.filters, p_limit: 150 });
    if (error) { toast(esc(errText(error))); st.grid = []; } else st.grid = data;
    (st.grid || []).forEach((p) => (st.people[p.id] = p));
    if (st.view === 'grid') draw();
  }
  async function loadDeck() {
    const f = { ...st.filters, looking: st.deckMode ? [st.deckMode] : st.filters.looking };
    const { data, error } = await sb.rpc('nearby', { p_filters: f, p_limit: 40, p_exclude_swiped: true });
    if (error) { toast(esc(errText(error))); st.deck = []; } else st.deck = data;
    st.deck.forEach((p) => (st.people[p.id] = p));
    if (st.view === 'swipe') draw();
  }
  async function loadConvos(redraw = true) {
    const { data, error } = await sb.rpc('conversations');
    if (error) { toast(esc(errText(error))); st.convos = []; } else st.convos = data;
    st.unreadMsgs = st.convos.reduce((a, c) => a + (c.unread || 0), 0);
    if (redraw && st.view === 'chats') draw(); else drawBadge();
  }
  async function loadTaps() {
    const { data } = await sb.from('taps').select('*').eq('to_id', uid()).order('created_at', { ascending: false }).limit(30);
    st.taps = [];
    for (const t of data || []) st.taps.push({ ...t, p: await person(t.from_id) });
    st.taps = st.taps.filter((t) => t.p);
    drawBadge();
  }

  /* ---------- Vykreslení ---------- */
  function draw() {
    if (!st.mounted || !st.root) return;
    if (!window.supabase) { st.root.innerHTML = `<div class="empty glass">${I('x')}<h3>Seznamku se nepodařilo načíst</h3><p class="muted">Zkontroluj připojení a obnov stránku.</p></div>`; return; }
    if (!st.booted) { st.root.innerHTML = `<div class="d-loading"><span class="spin"></span></div>`; return; }
    if (!st.session) { st.root.innerHTML = authView(); return; }
    if (!st.me) { st.root.innerHTML = onboardingView(); return; }
    st.root.innerHTML = shell();
    if (st.view === 'swipe') bindDrag();
  }
  function drawBadge() {
    const n = st.unreadMsgs + st.taps.filter((t) => !t.seen).length;
    const b = $('#dBadge');
    if (b) { b.textContent = n; b.hidden = !n; }
  }

  function authView() {
    const signup = st.authMode === 'signup';
    return `<div class="d-auth">
      <div class="d-auth-card glass">
        <div class="logo">NEXO</div>
        <p class="eyebrow center" style="margin-top:8px">Seznamka</p>
        <h2 class="center">${signup ? 'Vytvoř si účet' : st.authMode === 'reset' ? 'Obnova hesla' : 'Přihlášení'}</h2>
        <form id="dAuth" class="d-form">
          <label class="field"><span>E-mail</span><input name="email" type="email" required autocomplete="email" /></label>
          ${st.authMode !== 'reset' ? `<label class="field"><span>Heslo</span><input name="password" type="password" required minlength="8" autocomplete="${signup ? 'new-password' : 'current-password'}" /></label>` : ''}
          ${signup ? `<label class="check"><input type="checkbox" name="adult" required /> Je mi 18 nebo více let</label>
          <p class="muted small">Testovací provoz — bez ověřování e-mailu, stačí vymyslet heslo (min. 8 znaků).</p>` : ''}
          <button class="btn btn-grad btn-block" ${st.busy ? 'disabled' : ''}>${signup ? 'Registrovat' : st.authMode === 'reset' ? 'Poslat odkaz' : 'Přihlásit se'}</button>
        </form>
        <div class="d-auth-links">
          ${signup ? `<button class="link" data-d="auth-mode" data-m="login">Už mám účet</button>` : `<button class="link" data-d="auth-mode" data-m="signup">Nemám účet — registrovat</button>`}
          ${st.authMode === 'reset' ? `<button class="link" data-d="auth-mode" data-m="login">Zpět na přihlášení</button>` : ''}
        </div>
      </div>
      <ul class="d-auth-why">
        <li>${I('users')} Mřížka lidí v okolí podle vzdálenosti</li>
        <li>${I('heart')} Swipe a matche</li>
        <li>${I('chat')} Chat v reálném čase s fotkami</li>
        <li>${I('shield')} Blokování a nahlášení, pouze 18+</li>
      </ul>
    </div>`;
  }

  function chips(name, items, sel = [], type = 'checkbox') {
    const list = Array.isArray(items) ? items.map((x) => [x, x]) : Object.entries(items);
    return `<div class="d-chipset">${list.map(([k, l]) => `<label class="d-chk"><input type="${type}" name="${name}" value="${esc(k)}" ${sel.includes(k) ? 'checked' : ''} /><span>${esc(l)}</span></label>`).join('')}</div>`;
  }
  const lookingChecks = (sel = ['date']) => chips('looking', LOOKING, sel);
  function pick(name, cat, val) {
    return `<select name="${name}"><option value="">Neuvedeno</option>${Object.entries(OPT[cat]).map(([k, l]) => `<option value="${k}" ${val === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  }
  const sec = (title, body, open = true) => `<details class="d-sec" ${open ? 'open' : ''}><summary>${title}</summary><div class="d-sec-body">${body}</div></details>`;

  function onboardingView() {
    const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() - 18);
    return `<div class="d-auth"><form id="dOnboard" class="d-auth-card glass d-form">
      <p class="eyebrow">Krok 1 / 1</p><h2>Vytvoř si profil</h2>
      <label class="field"><span>Přezdívka</span><input name="name" required maxlength="30" /></label>
      <label class="field"><span>Datum narození <small class="muted">(nelze později změnit)</small></span><input name="birthdate" type="date" required max="${maxDate.toISOString().slice(0, 10)}" /></label>
      <div class="field"><span>Hledám</span>${lookingChecks()}</div>
      <label class="field"><span>O mně</span><textarea name="bio" maxlength="500" rows="3" placeholder="Pár slov o sobě…"></textarea></label>
      <label class="field"><span>Fotky <small class="muted">(až 6, z fotek odstraníme polohu)</small></span><input name="photos" type="file" accept="image/*" multiple /></label>
      <p class="muted small">Postavu, pozici, kmeny, zájmy a další kategorie doplníš potom v záložce Profil.</p>
      <button class="btn btn-grad btn-block" ${st.busy ? 'disabled' : ''}>${st.busy ? 'Ukládám…' : 'Pokračovat'}</button>
      <button type="button" class="link center" data-d="logout">Odhlásit</button>
    </form></div>`;
  }

  function shell() {
    const tabs = [['grid', 'Okolí', 'users'], ['swipe', 'Swipe', 'heart'], ['chats', 'Zprávy', 'chat'], ['me', 'Profil', 'user']];
    let body = '';
    if (st.view === 'grid') body = gridView();
    if (st.view === 'swipe') body = swipeView();
    if (st.view === 'chats') body = chatsView();
    if (st.view === 'me') body = meView();
    const n = st.unreadMsgs + st.taps.filter((t) => !t.seen).length;
    return `<div class="d-shell">
      <div class="d-tabs" role="tablist">${tabs.map(([k, l, ic]) => `<button role="tab" class="${st.view === k ? 'on' : ''}" data-d="view" data-v="${k}">${I(ic)}<span>${l}</span>${k === 'chats' ? `<b id="dBadge" class="d-badge" ${n ? '' : 'hidden'}>${n}</b>` : ''}</button>`).join('')}</div>
      ${st.geo === 'denied' || st.geo === 'unsupported' ? `<div class="notice">${I('pin')}<span>Bez polohy neuvidíš vzdálenosti a ostatní neuvidí tebe podle vzdálenosti. Povol polohu v prohlížeči a <button class="link" data-d="locate">zkus znovu</button>.</span></div>` : ''}
      ${body}
    </div>`;
  }

  function filterBar() {
    const f = st.filters, n = activeFilters(f);
    return `<div class="d-filters">
        <button class="chip d-fbtn ${n ? 'on' : ''}" data-d="filters">${I('filter')} Filtry${n ? ` <b class="d-badge">${n}</b>` : ''}</button>
        <button class="chip ${f.online ? 'on' : ''}" data-d="f-toggle" data-k="online"><i class="dot"></i> Online</button>
        <button class="chip ${f.has_photo ? 'on' : ''}" data-d="f-toggle" data-k="has_photo">S fotkou</button>
        <span class="d-fsep"></span>
        ${Object.entries(OPT.tribes).map(([k, l]) => `<button class="chip ${f.tribes.includes(k) ? 'on' : ''}" data-d="f-tribe" data-k="${k}">${l}</button>`).join('')}
      </div>`;
  }
  function gridView() {
    if (!st.grid) { loadGrid(); return filterBar() + `<div class="d-loading"><span class="spin"></span></div>`; }
    return filterBar() + (st.grid.length ? `<div class="d-grid">${st.grid.map((p) => `
        <button class="d-tile" data-d="open-profile" data-id="${p.id}">
          ${avatar(p)}
          ${p.position ? `<span class="d-tile-pos">${esc(label('position', p.position).replace(/ \(.*\)/, ''))}</span>` : ''}
          <span class="d-tile-info">${p.online ? '<i class="dot"></i>' : ''}<b>${esc(p.display_name)}</b><small>${fmtDist(p.distance_m)}</small></span>
        </button>`).join('')}</div>`
      : `<div class="empty glass">${I('users')}<h3>Nikdo neodpovídá filtrům</h3><p class="muted">Zkus filtry uvolnit.</p><button class="btn btn-ghost" data-d="f-reset">Zrušit filtry</button></div>`);
  }

  function filtersModal() {
    const f = st.filters;
    const num = (name, v, ph, min, max) => `<input type="number" name="${name}" value="${v ?? ''}" placeholder="${ph}" min="${min}" max="${max}" />`;
    modal(`<form id="dFilters" class="d-form d-filters-form"><h2>${I('filter')} Filtry</h2>
      <div class="d-two">
        <label class="field"><span>Věk</span><div class="d-range">${num('min_age', f.min_age > 18 ? f.min_age : null, '18', 18, 99)}–${num('max_age', f.max_age < 99 ? f.max_age : null, '99', 18, 99)}</div></label>
        <label class="field"><span>Vzdálenost</span><select name="max_km">${[['', 'Jakákoli'], [1, 'do 1 km'], [2, 'do 2 km'], [5, 'do 5 km'], [10, 'do 10 km'], [25, 'do 25 km'], [100, 'do 100 km']].map(([v, l]) => `<option value="${v}" ${String(f.max_km ?? '') === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Výška (cm)</span><div class="d-range">${num('min_height', f.min_height, 'od', 120, 230)}–${num('max_height', f.max_height, 'do', 120, 230)}</div></label>
        <label class="field"><span>Váha (kg)</span><div class="d-range">${num('min_weight', f.min_weight, 'od', 35, 250)}–${num('max_weight', f.max_weight, 'do', 35, 250)}</div></label>
      </div>
      <div class="d-chipset"><label class="d-chk"><input type="checkbox" name="online" ${f.online ? 'checked' : ''} /><span>Jen online</span></label><label class="d-chk"><input type="checkbox" name="has_photo" ${f.has_photo ? 'checked' : ''} /><span>Jen s fotkou</span></label></div>
      ${sec('Hledá', chips('looking', OPT.looking, f.looking))}
      ${sec('Pozice', chips('positions', OPT.position, f.positions))}
      ${sec('Kmeny', chips('tribes', OPT.tribes, f.tribes))}
      ${sec('Postava', chips('body_types', OPT.body_type, f.body_types), false)}
      ${sec('Vztah', chips('relationship', OPT.relationship, f.relationship), false)}
      ${sec('Kde se setkat', chips('meet_at', OPT.meet_at, f.meet_at), false)}
      ${sec('NSFW fotky', chips('nsfw', OPT.nsfw, f.nsfw), false)}
      ${sec('Identita', chips('gender', OPT.gender, f.gender), false)}
      <p class="muted small">V rámci jedné kategorie stačí shoda v jedné volbě. Profily, které údaj nevyplnily, se při aktivním filtru nezobrazí.</p>
      <div class="d-actions"><button type="button" class="btn btn-ghost" data-d="f-reset">Zrušit vše</button><button class="btn btn-grad">Zobrazit</button></div>
    </form>`, 'modal-filters');
  }

  function swipeView() {
    if (!st.deck) { loadDeck(); return `<div class="d-loading"><span class="spin"></span></div>`; }
    const modes = [[null, 'Vše'], ...Object.entries(LOOKING)];
    const top = st.deck[0];
    return `<div class="d-swipe">
      <div class="seg d-seg">${modes.map(([k, l]) => `<button class="${st.deckMode === k ? 'on' : ''}" data-d="deck-mode" data-k="${k ?? ''}">${l}</button>`).join('')}</div>
      <div class="deck">${top ? st.deck.slice(0, 3).reverse().map((p, i, a) => swipeCard(p, i === a.length - 1)).join('')
        : `<div class="deck-empty glass">${I('sparkle')}<h3>Prošel jsi všechny</h3><p class="muted">Noví lidé přibývají každý den. Mezitím mrkni do Okolí.</p><button class="btn btn-ghost" data-d="view" data-v="grid">Do Okolí</button></div>`}</div>
      ${top ? `<div class="swipe-btns">
        <button class="round round-lg" data-d="swipe" data-l="0" aria-label="Přeskočit">${I('x')}</button>
        <button class="round" data-d="open-profile" data-id="${top.id}" aria-label="Detail profilu">${I('user')}</button>
        <button class="round round-lg round-like" data-d="swipe" data-l="1" aria-label="Líbí se mi">${I('heart')}</button>
      </div><p class="center small muted d-hint">Tip: táhni kartu nebo použij šipky ← →</p>` : ''}
    </div>`;
  }
  function swipeCard(p, isTop) {
    const ph = p.photos || [];
    return `<article class="pcard ${isTop ? 'top' : ''}" data-id="${p.id}" data-i="0">
      ${ph.length ? `<img class="pcard-img" src="${esc(photoUrl(ph[0]))}" alt="" draggable="false" />${ph.length > 1 ? `<div class="pcard-dots">${ph.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}` : avatar(p, 'd-av-card')}
      <div class="stamp stamp-like">LIKE</div><div class="stamp stamp-nope">NOPE</div>
      <div class="pcard-info">
        <h2>${esc(p.display_name)}, ${p.age} ${p.online ? '<i class="dot"></i>' : ''}</h2>
        <div class="pcard-meta">${p.distance_m != null ? `${I('pin')} ${fmtDist(p.distance_m)}` : ''} ${p.is_demo ? '<span class="tag">Ukázkový profil</span>' : ''}</div>
        ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
        <div class="tags">${p.position ? `<span class="pos">${esc(label('position', p.position))}</span>` : ''}${(p.tribes || []).slice(0, 3).map((t) => `<span class="tr">${esc(label('tribes', t))}</span>`).join('')}${(p.looking_for || []).map((k) => `<span class="lf">${LOOKING[k]}</span>`).join('')}</div>
      </div>
    </article>`;
  }

  function chatsView() {
    if (!st.convos) { loadConvos(); return `<div class="d-loading"><span class="spin"></span></div>`; }
    const newMatches = st.convos.filter((c) => c.is_match && !c.last_body && !c.last_has_image);
    const threads = st.convos.filter((c) => c.last_body || c.last_has_image);
    return `<div class="d-chats">
      ${st.taps.length ? `<section><h3 class="col-title">${I('sparkle')} Tapy</h3><div class="d-row">${st.taps.slice(0, 20).map((t) => `
        <button class="d-mini ${t.seen ? '' : 'unseen'}" data-d="open-profile" data-id="${t.from_id}">${avatar(t.p)}<span class="d-mini-emoji">${TAPS[t.kind][0]}</span><small>${esc(t.p.display_name)}</small></button>`).join('')}</div></section>` : ''}
      ${newMatches.length ? `<section><h3 class="col-title">${I('heart')} Nové matche</h3><div class="d-row">${newMatches.map((c) => `
        <button class="d-mini unseen" data-d="chat" data-id="${c.other}">${avatar({ ...c, id: c.other })}<small>${esc(c.display_name)}</small></button>`).join('')}</div></section>` : ''}
      <section><h3 class="col-title">${I('chat')} Konverzace</h3>
      ${threads.length ? `<div class="d-threads">${threads.map((c) => `
        <button class="d-thread ${c.unread ? 'unread' : ''}" data-d="chat" data-id="${c.other}">
          ${avatar({ ...c, id: c.other })}
          <div class="grow"><b>${esc(c.display_name)} ${c.online ? '<i class="dot"></i>' : ''} ${c.is_match ? I('heart', 'ic-xs ic-match') : ''}</b>
          <span class="muted small">${c.last_from_me ? 'Ty: ' : ''}${c.last_has_image && !c.last_body ? '📷 Fotka' : esc(c.last_body)}</span></div>
          <div class="d-thread-r"><small class="muted">${c.last_at ? time(c.last_at) : ''}</small>${c.unread ? `<b class="d-badge">${c.unread}</b>` : ''}</div>
        </button>`).join('')}</div>`
      : `<p class="muted">Zatím žádné zprávy. Napiš někomu z Okolí nebo pošli tap.</p>`}</section>
    </div>`;
  }

  function meView() {
    const m = st.me;
    return `<div class="d-me">
      <div class="glass d-me-card">
        <h3>Moje fotky <small class="muted">${m.photos.length}/6</small></h3>
        <div class="d-photos">
          ${m.photos.map((ph, i) => `<div class="d-photo"><img src="${esc(photoUrl(ph))}" alt="" />${i === 0 ? '<span class="tag">Hlavní</span>' : `<button class="d-ph-main" data-d="photo-main" data-i="${i}" title="Nastavit jako hlavní">${I('star')}</button>`}<button class="d-ph-del" data-d="photo-del" data-i="${i}" aria-label="Smazat fotku">${I('x')}</button></div>`).join('')}
          ${m.photos.length < 6 ? `<label class="d-photo d-photo-add">${I('plus')}<span>Přidat</span><input type="file" accept="image/*" multiple data-d="photo-add" hidden /></label>` : ''}
        </div>
      </div>
      <form id="dProfile" class="glass d-me-card d-form">
        <h3>Profil</h3>
        ${sec('Základ', `
          <label class="field"><span>Přezdívka</span><input name="name" required maxlength="30" value="${esc(m.display_name)}" /></label>
          <div class="field"><span>Věk</span><b>${ageOf(m.birthdate)}</b></div>
          <label class="field"><span>O mně</span><textarea name="bio" maxlength="500" rows="3">${esc(m.bio)}</textarea></label>
          <div class="field"><span>Hledám</span>${lookingChecks(m.looking_for)}</div>`)}
        ${sec('Tělo a pozice', `
          <div class="d-two"><label class="field"><span>Výška (cm)</span><input name="height" type="number" min="120" max="230" value="${m.height_cm ?? ''}" /></label>
          <label class="field"><span>Váha (kg)</span><input name="weight" type="number" min="35" max="250" value="${m.weight_kg ?? ''}" /></label>
          <label class="field"><span>Postava</span>${pick('body_type', 'body_type', m.body_type)}</label>
          <label class="field"><span>Pozice</span>${pick('position', 'position', m.position)}</label></div>`)}
        ${sec('Kmeny <small class="muted">(jak se vidíš)</small>', chips('tribes', OPT.tribes, m.tribes || []))}
        ${sec('Zájmy', chips('tags', [...new Set([...INTERESTS, ...(m.tags || [])])], m.tags || []))}
        ${sec('Vztah a setkání', `
          <div class="d-two"><label class="field"><span>Vztah</span>${pick('relationship', 'relationship', m.relationship)}</label>
          <label class="field"><span>NSFW fotky</span>${pick('nsfw', 'nsfw', m.nsfw)}</label></div>
          <div class="field"><span>Kde se setkat</span>${chips('meet_at', OPT.meet_at, m.meet_at || [])}</div>`, false)}
        ${sec('Identita a jazyky', `
          <div class="d-two"><label class="field"><span>Identita</span>${pick('gender', 'gender', m.gender)}</label>
          <label class="field"><span>Zájmena</span><input name="pronouns" maxlength="20" placeholder="např. on/jeho" value="${esc(m.pronouns || '')}" /></label>
          <label class="field"><span>Kouření</span>${pick('smoking', 'smoking', m.smoking)}</label></div>
          <div class="field"><span>Jazyky</span>${chips('languages', LANGS, m.languages || [])}</div>`, false)}
        ${sec('Zdraví <small class="muted">(nepovinné, vidí ostatní)</small>', `
          <div class="d-two"><label class="field"><span>HIV status</span>${pick('hiv_status', 'hiv_status', m.hiv_status)}</label>
          <label class="field"><span>Poslední test</span><input name="last_tested" type="date" max="${new Date().toISOString().slice(0, 10)}" value="${m.last_tested || ''}" /></label></div>`, false)}
        ${sec('Soukromí', `
          <label class="check"><input type="checkbox" name="show" ${m.show_in_grid ? 'checked' : ''} /> Zobrazovat mě v Okolí a ve Swipu</label>
          <label class="check"><input type="checkbox" name="hide" ${m.hide_distance ? 'checked' : ''} /> Skrýt moji vzdálenost</label>`, false)}
        <button class="btn btn-grad btn-block">Uložit profil</button>
      </form>
      <div class="glass d-me-card">
        <h3>Účet</h3>
        <p class="muted small">${esc(st.session.user.email)}</p>
        <div class="btn-row" style="justify-content:flex-start">
          <button class="btn btn-ghost btn-sm" data-d="logout">${I('logout')} Odhlásit</button>
          <button class="btn btn-ghost btn-sm" data-d="delete-account">${I('trash')} Smazat účet</button>
        </div>
      </div>
    </div>`;
  }

  /* ---------- Detail profilu ---------- */
  function facts(p) {
    const rows = [];
    const add = (l, v) => v && rows.push(`<dt>${l}</dt><dd>${v}</dd>`);
    add('Výška / váha', [p.height_cm && `${p.height_cm} cm`, p.weight_kg && `${p.weight_kg} kg`].filter(Boolean).join(' • '));
    add('Postava', p.body_type && label('body_type', p.body_type));
    add('Pozice', p.position && label('position', p.position));
    add('Kmeny', (p.tribes || []).map((t) => label('tribes', t)).join(', '));
    add('Vztah', p.relationship && label('relationship', p.relationship));
    add('Kde se setkat', (p.meet_at || []).map((t) => label('meet_at', t)).join(', '));
    add('NSFW fotky', p.nsfw && label('nsfw', p.nsfw));
    add('Identita', [p.gender && label('gender', p.gender), p.pronouns && esc(p.pronouns)].filter(Boolean).join(' • '));
    add('HIV status', p.hiv_status && label('hiv_status', p.hiv_status) + (p.last_tested ? ` <span class="muted">(test ${new Date(p.last_tested).toLocaleDateString('cs-CZ')})</span>` : ''));
    add('Kouření', p.smoking && label('smoking', p.smoking));
    add('Jazyky', (p.languages || []).map(esc).join(', '));
    return rows.length ? `<dl class="d-facts">${rows.join('')}</dl>` : '';
  }
  async function openProfile(id) {
    const p = st.people[id] || (await person(id));
    if (!p) return toast('Profil není dostupný');
    const ph = p.photos || [];
    modal(`<div class="d-profile">
      <div class="d-gallery">${ph.length ? ph.map((x) => `<img src="${esc(photoUrl(x))}" alt="" />`).join('') : avatar(p, 'd-av-card')}</div>
      <div class="d-profile-body">
        <h2>${esc(p.display_name)}, ${p.age} ${p.online ? '<i class="dot"></i>' : ''}</h2>
        <p class="muted small">${[fmtDist(p.distance_m), p.online ? 'online' : ago(p.last_active)].filter(Boolean).join(' • ')}${p.is_demo ? ' • <span class="tag">Ukázkový profil</span>' : ''}</p>
        <div class="tags">${(p.looking_for || []).map((k) => `<span class="lf">${LOOKING[k]}</span>`).join('')}</div>
        ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
        ${facts(p)}
        ${(p.tags || []).length ? `<div><p class="eyebrow">Zájmy</p><div class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div></div>` : ''}
        <div class="d-actions">
          <button class="btn btn-grad" data-d="chat" data-id="${p.id}">${I('chat')} Napsat</button>
          <button class="btn btn-ghost" data-d="like" data-id="${p.id}">${I('heart')} Líbí se mi</button>
        </div>
        <div class="d-tapbar">${Object.entries(TAPS).map(([k, [e, l]]) => `<button class="btn btn-ghost btn-sm" data-d="tap" data-id="${p.id}" data-k="${k}">${e} ${l}</button>`).join('')}</div>
        <div class="d-danger"><button class="link" data-d="block" data-id="${p.id}">Blokovat</button><button class="link" data-d="report" data-id="${p.id}">Nahlásit</button></div>
      </div>
    </div>`, 'modal-profile');
  }

  function matchModal(p) {
    modal(`<div class="match-modal d-match">
      <p class="eyebrow">It's a match</p>
      <div class="match-avatars">${avatar({ ...st.me, id: uid() }, 'd-av-round')}${avatar(p, 'd-av-round')}</div>
      <h2>Ty a ${esc(p.display_name)} se líbíte!</h2>
      <div class="btn-row"><button class="btn btn-grad" data-d="chat" data-id="${p.id}">${I('chat')} Napsat zprávu</button><button class="btn btn-ghost" data-act="close-modal">Pokračovat</button></div>
    </div>`);
  }

  /* ---------- Chat ---------- */
  async function openChat(other) {
    const p = st.people[other] || (await person(other));
    if (!p) return toast('Profil není dostupný');
    st.chat = null;
    modal(`<div class="chat">
      <div class="chat-head">${avatar(p, 'd-av-round')}<div class="grow"><b>${esc(p.display_name)}, ${p.age}</b><div class="muted small">${p.online ? 'online' : ago(p.last_active)}</div></div>
        <button class="icon-btn" data-d="open-profile" data-id="${p.id}" aria-label="Profil">${I('user')}</button></div>
      <div class="chat-body" id="chatBody"><div class="d-loading"><span class="spin"></span></div></div>
      <form class="chat-form" id="dChatForm">
        <label class="round d-attach" aria-label="Poslat fotku">${I('plus')}<input type="file" accept="image/*" data-d="chat-photo" hidden /></label>
        <input id="dChatInput" autocomplete="off" placeholder="Napiš zprávu…" maxlength="2000" />
        <button class="round" aria-label="Odeslat">${I('send')}</button>
      </form>
    </div>`, 'modal-chat');
    st.chat = { other, p, msgs: [] };
    const me = uid();
    const { data, error } = await sb.from('messages').select('*')
      .or(`and(sender.eq.${me},recipient.eq.${other}),and(sender.eq.${other},recipient.eq.${me})`)
      .order('created_at', { ascending: true }).limit(300);
    if (!st.chat || st.chat.other !== other) return;
    if (error) toast(esc(errText(error)));
    st.chat.msgs = data || [];
    drawChatBody();
    $('#dChatInput')?.focus();
    await sb.rpc('mark_read', { p_other: other });
    st.convos = null;
    loadConvos(false);
  }
  function drawChatBody() {
    const b = $('#chatBody');
    if (!b || !st.chat) return;
    const me = uid();
    const msgs = st.chat.msgs;
    const lastMine = [...msgs].reverse().find((m) => m.sender === me);
    b.innerHTML = msgs.length ? msgs.map((m) => `<div class="msg ${m.sender === me ? 'me' : ''}">
        ${m.image_path ? `<img class="msg-img" src="${esc(photoUrl(m.image_path))}" alt="Fotka" />` : ''}${m.body ? esc(m.body) : ''}
        <small class="msg-time">${time(m.created_at)}</small></div>
        ${m === lastMine && m.read_at ? '<div class="msg-read">Přečteno</div>' : ''}`).join('')
      : `<p class="center muted small">Začni konverzaci 👋${st.chat.p.is_demo ? '<br/>(Ukázkový profil odpoví automaticky.)' : ''}</p>`;
    b.scrollTop = b.scrollHeight;
  }
  async function sendMessage(body, image_path = null) {
    if (!st.chat) return;
    const { data, error } = await sb.from('messages').insert({ sender: uid(), recipient: st.chat.other, body, image_path }).select().single();
    if (error) return toast(esc(errText(error)));
    st.chat.msgs.push(data);
    drawChatBody();
    st.convos = null;
  }

  /* ---------- Swipe ---------- */
  async function doSwipe(liked, id) {
    const target = id || st.deck?.[0]?.id;
    if (!target) return;
    const card = st.view === 'swipe' && !id ? $('.pcard.top') : null;
    if (card) {
      card.style.transition = 'transform .35s ease, opacity .35s ease';
      card.style.transform = `translateX(${liked ? 130 : -130}%) rotate(${liked ? 18 : -18}deg)`;
      card.style.opacity = '0';
    }
    if (st.deck) st.deck = st.deck.filter((p) => p.id !== target);
    const { data: matched, error } = await sb.rpc('swipe', { p_target: target, p_liked: liked });
    if (error) toast(esc(errText(error)));
    setTimeout(() => { if (st.view === 'swipe' && !$('#modal.open')) draw(); }, card ? 260 : 0);
    if (matched) { st.convos = null; const p = await person(target); if (p) matchModal(p); }
    else if (id && liked) toast(`${I('heart')} Like odeslán`);
    if (st.deck && st.deck.length < 5 && st.view === 'swipe') setTimeout(loadDeck, 400);
  }
  function bindDrag() {
    const card = $('.pcard.top');
    if (!card) return;
    let sx = 0, dx = 0, sy = 0, dragging = false, moved = false;
    card.addEventListener('pointerdown', (e) => { dragging = true; moved = false; sx = e.clientX; sy = e.clientY; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; });
    card.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dx = e.clientX - sx;
      if (Math.abs(dx) > 5) moved = true;
      card.style.transform = `translate(${dx}px, ${(e.clientY - sy) * 0.3}px) rotate(${dx / 18}deg)`;
      card.style.setProperty('--like', Math.max(0, Math.min(1, dx / 100)));
      card.style.setProperty('--nope', Math.max(0, Math.min(1, -dx / 100)));
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      if (dx > 110) doSwipe(true);
      else if (dx < -110) doSwipe(false);
      else {
        card.style.transition = 'transform .25s ease'; card.style.transform = '';
        card.style.setProperty('--like', 0); card.style.setProperty('--nope', 0);
        if (!moved && e.type === 'pointerup') cyclePhoto(card, e);
      }
      dx = 0;
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  }
  function cyclePhoto(card, e) {
    const p = st.people[card.dataset.id];
    const ph = p?.photos || [];
    if (ph.length < 2) return;
    const r = card.getBoundingClientRect();
    let i = Number(card.dataset.i) + (e.clientX - r.left > r.width / 2 ? 1 : -1);
    i = (i + ph.length) % ph.length;
    card.dataset.i = i;
    card.querySelector('.pcard-img').src = photoUrl(ph[i]);
    card.querySelectorAll('.pcard-dots i').forEach((d, k) => d.classList.toggle('on', k === i));
  }

  /* ---------- Akce ---------- */
  async function saveMe(patch) {
    const { data, error } = await sb.from('profiles').update(patch).eq('id', uid()).select().single();
    if (error) { toast(esc(errText(error))); return false; }
    st.me = data;
    return true;
  }

  document.addEventListener('click', async (ev) => {
    const closer = ev.target.closest('[data-act="close-modal"]');
    if (closer) { closeModal(); return; }
    const el = ev.target.closest('[data-d]');
    if (!el || !sb) return;
    const d = el.dataset.d, id = el.dataset.id;
    switch (d) {
      case 'auth-mode': st.authMode = el.dataset.m; draw(); break;
      case 'view':
        closeModal();
        st.view = el.dataset.v;
        if (st.view === 'chats') { st.convos = null; sb.rpc('mark_taps_seen').then(() => { st.taps.forEach((t) => (t.seen = true)); drawBadge(); }); }
        if (st.view === 'grid') st.grid = null;
        draw(); break;
      case 'reload': st.grid = null; await heartbeat(); draw(); break;
      case 'locate': await heartbeat(); st.grid = null; st.deck = null; draw(); break;
      case 'filters': filtersModal(); break;
      case 'f-toggle': st.filters[el.dataset.k] = !st.filters[el.dataset.k]; saveFilters(); st.grid = null; st.deck = null; draw(); break;
      case 'f-tribe': {
        const k = el.dataset.k, t = st.filters.tribes;
        st.filters.tribes = t.includes(k) ? t.filter((x) => x !== k) : [...t, k];
        saveFilters(); st.grid = null; st.deck = null; draw(); break;
      }
      case 'f-reset': st.filters = emptyFilters(); saveFilters(); closeModal(); st.grid = null; st.deck = null; draw(); break;
      case 'deck-mode': st.deckMode = el.dataset.k || null; st.deck = null; draw(); break;
      case 'open-profile': openProfile(id); break;
      case 'chat': openChat(id); break;
      case 'swipe': doSwipe(el.dataset.l === '1'); break;
      case 'like': el.disabled = true; doSwipe(true, id); break;
      case 'tap': {
        const { error } = await sb.from('taps').insert({ from_id: uid(), to_id: id, kind: el.dataset.k });
        toast(error ? esc(errText(error)) : `${TAPS[el.dataset.k][0]} Tap odeslán`);
        break;
      }
      case 'block': {
        if (!el.dataset.confirm) { el.dataset.confirm = '1'; el.textContent = 'Opravdu blokovat?'; break; }
        const { error } = await sb.from('blocks').insert({ blocker: uid(), blocked: id });
        if (error) { toast(esc(errText(error))); break; }
        delete st.people[id];
        st.grid = st.grid && st.grid.filter((p) => p.id !== id);
        st.deck = st.deck && st.deck.filter((p) => p.id !== id);
        st.convos = null;
        closeModal(); draw(); toast('Uživatel zablokován. Už tě neuvidí a nenapíše ti.');
        break;
      }
      case 'report': {
        modal(`<form id="dReport" class="d-form" data-id="${id}"><h2>Nahlásit profil</h2>
          <label class="field"><span>Důvod</span><select name="reason">${Object.entries(REASONS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
          <label class="field"><span>Podrobnosti</span><textarea name="details" maxlength="1000" rows="3"></textarea></label>
          <label class="check"><input type="checkbox" name="block" checked /> Zároveň zablokovat</label>
          <button class="btn btn-grad btn-block">Odeslat hlášení</button></form>`);
        break;
      }
      case 'photo-del': {
        const i = Number(el.dataset.i);
        const path = st.me.photos[i];
        const photos = st.me.photos.filter((_, k) => k !== i);
        if (await saveMe({ photos })) { sb.storage.from('photos').remove([path]); draw(); }
        break;
      }
      case 'photo-main': {
        const i = Number(el.dataset.i);
        const photos = [st.me.photos[i], ...st.me.photos.filter((_, k) => k !== i)];
        if (await saveMe({ photos })) draw();
        break;
      }
      case 'logout': stopLive(); await sb.auth.signOut(); break;
      case 'delete-account': {
        if (!el.dataset.confirm) { el.dataset.confirm = '1'; el.innerHTML = 'Opravdu smazat vše? Klikni znovu'; break; }
        el.disabled = true;
        const { data: files } = await sb.storage.from('photos').list(uid());
        const { data: chatFiles } = await sb.storage.from('photos').list(uid() + '/chat');
        const paths = [...(files || []).filter((f) => f.id).map((f) => `${uid()}/${f.name}`), ...(chatFiles || []).map((f) => `${uid()}/chat/${f.name}`)];
        if (paths.length) await sb.storage.from('photos').remove(paths);
        const { error } = await sb.rpc('delete_account');
        if (error) { toast(esc(errText(error))); el.disabled = false; break; }
        stopLive(); await sb.auth.signOut(); toast('Účet byl smazán.');
        break;
      }
    }
  });

  document.addEventListener('change', async (ev) => {
    const el = ev.target;
    if (!sb || !el.dataset) return;
    const d = el.dataset.d;
    if (d === 'photo-add') {
      const files = [...el.files].slice(0, 6 - st.me.photos.length);
      if (!files.length) return;
      toast('Nahrávám fotky…');
      try {
        const paths = [];
        for (const f of files) paths.push(await uploadPhoto(f));
        if (await saveMe({ photos: [...st.me.photos, ...paths] })) { draw(); toast(`${I('check')} Fotky nahrány`); }
      } catch (e) { toast(esc(errText(e))); }
    }
    if (d === 'chat-photo' && el.files[0]) {
      try { toast('Odesílám fotku…'); const path = await uploadPhoto(el.files[0], 'chat/'); await sendMessage('', path); }
      catch (e) { toast(esc(errText(e))); }
      el.value = '';
    }
  });

  document.addEventListener('submit', async (ev) => {
    const f = ev.target;
    if (!sb || !['dAuth', 'dOnboard', 'dProfile', 'dChatForm', 'dReport', 'dFilters'].includes(f.id)) return;
    ev.preventDefault();
    const fd = new FormData(f);
    if (f.id === 'dChatForm') {
      const inp = $('#dChatInput');
      const t = inp.value.trim();
      if (!t) return;
      inp.value = '';
      await sendMessage(t);
      return;
    }
    if (f.id === 'dAuth') {
      st.busy = true;
      const email = String(fd.get('email')).trim(), password = String(fd.get('password') || '');
      let res;
      const redirect = location.origin + location.pathname;
      if (st.authMode === 'signup') {
        // Testovací provoz: účet se založí rovnou potvrzený, bez e-mailu
        res = await sb.rpc('test_signup', { p_email: email, p_password: password });
        if (!res.error) res = await sb.auth.signInWithPassword({ email: email.toLowerCase(), password });
      }
      else if (st.authMode === 'reset') res = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirect });
      else res = await sb.auth.signInWithPassword({ email, password });
      st.busy = false;
      if (res.error) { toast(esc(errText(res.error))); draw(); return; }
      if (st.authMode === 'signup' && !res.data.session) { st.authMode = 'login'; draw(); modal(`<div class="center"><h2>Zkontroluj e-mail 📬</h2><p class="muted">Poslali jsme ti odkaz na <b>${esc(email)}</b>. Po kliknutí se můžeš přihlásit.</p></div>`); }
      if (st.authMode === 'reset') { modal(`<div class="center"><h2>Odkaz odeslán</h2><p class="muted">Pokud účet existuje, přijde ti e-mail s odkazem pro nastavení nového hesla.</p></div>`); }
      return;
    }
    if (f.id === 'dOnboard') {
      st.busy = true; draw();
      const row = {
        id: uid(), display_name: String(fd.get('name')).trim(), birthdate: fd.get('birthdate'),
        bio: String(fd.get('bio') || '').trim(), looking_for: fd.getAll('looking'),
      };
      if (!row.looking_for.length) row.looking_for = ['date'];
      const files = [...(f.querySelector('[name=photos]').files || [])].slice(0, 6);
      const { data, error } = await sb.from('profiles').insert(row).select().single();
      if (error) { st.busy = false; toast(esc(/18/.test(error.message) ? 'NEXO je pouze pro osoby starší 18 let.' : errText(error))); draw(); return; }
      st.me = data;
      try {
        const paths = [];
        for (const file of files) paths.push(await uploadPhoto(file));
        if (paths.length) await saveMe({ photos: paths });
      } catch (e) { toast('Fotky se nepodařilo nahrát: ' + esc(errText(e))); }
      st.busy = false;
      startLive();
      st.view = 'grid';
      draw();
      return;
    }
    if (f.id === 'dProfile') {
      const v = (k) => (fd.get(k) ? String(fd.get(k)) : null);
      const n = (k) => (fd.get(k) ? Number(fd.get(k)) : null);
      const ok = await saveMe({
        display_name: String(fd.get('name')).trim(), bio: String(fd.get('bio') || '').trim(),
        looking_for: fd.getAll('looking').length ? fd.getAll('looking') : ['date'],
        tags: fd.getAll('tags').slice(0, 20), tribes: fd.getAll('tribes'), meet_at: fd.getAll('meet_at'), languages: fd.getAll('languages').slice(0, 8),
        height_cm: n('height'), weight_kg: n('weight'), body_type: v('body_type'), position: v('position'),
        relationship: v('relationship'), nsfw: v('nsfw'), gender: v('gender'), pronouns: v('pronouns')?.trim() || null,
        smoking: v('smoking'), hiv_status: v('hiv_status'), last_tested: v('last_tested'),
        show_in_grid: !!fd.get('show'), hide_distance: !!fd.get('hide'),
      });
      if (ok) { toast(`${I('check')} Profil uložen`); st.grid = null; st.deck = null; }
      return;
    }
    if (f.id === 'dFilters') {
      const n = (k) => (fd.get(k) ? Number(fd.get(k)) : null);
      st.filters = {
        online: !!fd.get('online'), has_photo: !!fd.get('has_photo'),
        min_age: n('min_age') || 18, max_age: n('max_age') || 99, max_km: n('max_km'),
        min_height: n('min_height'), max_height: n('max_height'), min_weight: n('min_weight'), max_weight: n('max_weight'),
        looking: fd.getAll('looking'), positions: fd.getAll('positions'), tribes: fd.getAll('tribes'), body_types: fd.getAll('body_types'),
        relationship: fd.getAll('relationship'), meet_at: fd.getAll('meet_at'), nsfw: fd.getAll('nsfw'), gender: fd.getAll('gender'),
      };
      saveFilters(); closeModal(); st.grid = null; st.deck = null; draw();
      return;
    }
    if (f.id === 'dReport') {
      const target = f.dataset.id;
      const { error } = await sb.from('reports').insert({ reporter: uid(), reported: target, reason: fd.get('reason'), details: String(fd.get('details') || '') });
      if (error) return toast(esc(errText(error)));
      if (fd.get('block')) await sb.from('blocks').insert({ blocker: uid(), blocked: target });
      delete st.people[target]; st.grid = null; st.deck = null; st.convos = null;
      closeModal(); draw(); toast('Děkujeme, hlášení prověříme.');
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && $('#modal.open')) closeModal();
    if (!st.mounted || st.view !== 'swipe' || $('#modal.open') || ev.target.matches('input,textarea,select')) return;
    if (ev.key === 'ArrowLeft') doSwipe(false);
    if (ev.key === 'ArrowRight') doSwipe(true);
  });

  /* ---------- Start ---------- */
  async function boot() {
    if (st.booted || !window.supabase) return;
    st.filters = loadFilters();
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } });
    const { data } = await sb.auth.getSession();
    st.session = data.session;
    if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
    sb.auth.onAuthStateChange((event, session) => {
      const changed = session?.user?.id !== st.session?.user?.id;
      st.session = session;
      if (event === 'SIGNED_OUT') { stopLive(); st.me = null; st.grid = st.deck = st.convos = null; st.taps = []; st.people = {}; closeModal(); draw(); }
      else if (changed && session) setTimeout(loadMe, 0);
      if (event === 'PASSWORD_RECOVERY') setTimeout(passwordModal, 300);
    });
    if (st.session) await loadMe(false);
    st.booted = true;
    draw();
  }
  async function loadMe(redraw = true) {
    const { data, error } = await sb.from('profiles').select('*').eq('id', uid()).maybeSingle();
    if (error) toast(esc(errText(error)));
    st.me = data || null;
    if (st.me) startLive();
    if (redraw) draw();
  }
  function passwordModal() {
    modal(`<form id="dNewPass" class="d-form"><h2>Nové heslo</h2><label class="field"><span>Heslo</span><input name="p" type="password" minlength="8" required autocomplete="new-password" /></label><button class="btn btn-grad btn-block">Uložit</button></form>`);
    $('#dNewPass').addEventListener('submit', async (e) => {
      e.preventDefault();
      const { error } = await sb.auth.updateUser({ password: new FormData(e.target).get('p') });
      toast(error ? esc(errText(error)) : 'Heslo změněno');
      if (!error) closeModal();
    });
  }

  window.NexoDating = {
    mount(root) {
      st.root = root;
      st.mounted = true;
      if (!window.supabase) { draw(); return; }
      if (!st.booted) { draw(); boot(); } else draw();
    },
    unmount() { st.mounted = false; st.root = null; },
  };
})();
