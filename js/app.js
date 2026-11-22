/* NEXO — single-page app (vanilla JS, bez build kroku). */
(() => {
  'use strict';
  const D = window.NEXO_DATA;
  const I = window.ICONS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');

  /* ---------- Stav (localStorage) ---------- */
  const KEY = 'nexo-state-v1';
  const today = () => new Date().toISOString().slice(0, 10);
  const defaults = () => ({
    plan: 'free', name: '', memberSince: today(),
    cart: {}, liked: [], passed: [], history: [], matches: [], superLikes: 0,
    likes: { date: today(), n: 0 }, mode: 'date',
    filters: { ageMin: 18, ageMax: 45, km: 10, verified: false },
    tickets: [], groups: [], points: 120, redeemed: [],
  });
  let S;
  try { S = { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { S = defaults(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage nedostupné */ } };
  if (S.likes.date !== today()) S.likes = { date: today(), n: 0 };

  /* ---------- Pomocné ---------- */
  const isPlus = () => S.plan === 'plus';
  const noAds = () => S.plan !== 'free';
  const FREE_LIKES = 15;
  const kc = (n) => `${Math.round(n).toLocaleString('cs-CZ')} Kč`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const planName = (id = S.plan) => D.plans.find((p) => p.id === id).name;
  const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const memberId = () => 'NX-' + String(hash(S.memberSince + (S.name || 'nexo')) % 1e6).padStart(6, '0');
  const fmtDate = (iso) => {
    const d = new Date(iso + 'T12:00:00');
    const dn = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'][d.getDay()];
    return `${dn} ${d.getDate()}. ${d.getMonth() + 1}.`;
  };
  const venueName = { heaven: 'Heaven Club', pitch: 'The Pitch', nexo: 'NEXO' };

  const shopDiscount = (p) => (isPlus() ? (p.exclusive ? 0.1 : 0.05) : 0);
  const shopPrice = (p) => Math.round(p.price * (1 - shopDiscount(p)));
  const eventDiscount = (e) => (isPlus() && e.price > 0 ? (e.venue === 'nexo' ? 0.1 : 0.2) : 0);
  const eventPrice = (e) => Math.round(e.price * (1 - eventDiscount(e)));
  const cartCount = () => Object.values(S.cart).reduce((a, b) => a + b, 0);

  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function modal(html, cls = '') {
    const m = $('#modal');
    m.innerHTML = `<div class="modal-backdrop" data-act="close-modal"></div>
      <div class="modal ${cls}" role="dialog" aria-modal="true">
        <button class="modal-x" data-act="close-modal" aria-label="Zavřít">${I('x')}</button>${html}</div>`;
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    $('#modal').classList.remove('open');
    $('#modal').innerHTML = '';
    document.body.style.overflow = '';
  }

  /* Dekorativní QR (demo) — deterministicky z textu. */
  function qr(text, size = 120) {
    const n = 25, cell = size / n;
    let seed = hash(text);
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 16) & 1;
    const finder = (x, y) => x < 7 && y < 7 || x >= n - 7 && y < 7 || x < 7 && y >= n - 7;
    let rects = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let on;
      if (finder(x, y)) {
        const fx = x >= n - 7 ? x - (n - 7) : x, fy = y >= n - 7 ? y - (n - 7) : y;
        on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
      } else on = rnd();
      if (on) rects += `<rect x="${(x * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
    }
    return `<svg class="qr" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-label="QR kód"><rect width="${size}" height="${size}" fill="#fff" rx="6"/><g fill="#0b0912" transform="translate(${size * 0.06} ${size * 0.06}) scale(0.88)">${rects}</g></svg>`;
  }

  /* ---------- Ilustrace (bez fotek, čisté SVG/CSS) ---------- */
  const skyline = `<svg class="skyline" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path fill="currentColor" d="M0 120V92h18v-8h10v8h14V78h8l4-14 4 14h8v14h20V70h6V52l5-18 5 18v18h6v22h18V60l7-26 7 26v32h10V80h12v-6h6l3-10 3 10h6v18h14V66l4-6V40l4-22 4 22v20l4 6v26h16V74h8l6-18 6 18h8v18h20V84h12V62l5-14 5 14v30h22V78h14v14h18V86h14v34Z"/></svg>`;

  function avatar(p, big = false) {
    const h = p.hue;
    return `<div class="avatar ${big ? 'avatar-big' : ''}" style="--h:${h}">
      <svg viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><radialGradient id="ag${p.id}${big ? 'b' : ''}" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="hsl(${h} 70% 62%)"/><stop offset=".55" stop-color="hsl(${h + 25} 60% 28%)"/><stop offset="1" stop-color="hsl(${h + 40} 50% 8%)"/></radialGradient></defs>
        <rect width="200" height="240" fill="url(#ag${p.id}${big ? 'b' : ''})"/>
        <circle cx="100" cy="98" r="44" fill="hsl(${h} 30% 12% / .55)"/>
        <path d="M18 240c6-52 40-82 82-82s76 30 82 82Z" fill="hsl(${h} 30% 10% / .6)"/>
      </svg>
      <span class="avatar-initial">${p.name[0]}</span>
    </div>`;
  }

  function art(kind) {
    switch (kind) {
      case 'seznamka':
        return `<div class="art art-date"><div class="orb o1"></div><div class="orb o2"></div>${I('heart', 'art-heart')}</div>`;
      case 'shop':
        return `<div class="art art-shop"><span class="bottle b1"><i>NEXO</i></span><span class="bottle b2"><i>NEXO</i></span><span class="bottle b3"></span><span class="bottle b4"><i>NEXO</i></span></div>`;
      case 'heaven':
        return `<div class="art art-club"><div class="beams"></div><div class="neon">HEAVEN<small>CLUB</small></div><div class="crowd"></div></div>`;
      case 'pitch':
        return `<div class="art art-pitch"><div class="neon neon-red">THE PITCH</div><div class="lamps"><i></i><i></i><i></i><i></i></div></div>`;
      case 'friends':
        return `<div class="art art-friends">${skyline}<div class="people"><i></i><i></i><i></i><i></i><i></i></div></div>`;
    }
    return '';
  }

  const adBanner = () => noAds() ? '' : `<div class="ad"><span class="ad-label">Reklama</span><span>Partner nabídka: 2+1 drink zdarma v baru U Sousedů.</span><a href="#clenstvi" class="link">Bez reklam od 99 Kč</a></div>`;

  /* ---------- Navigace ---------- */
  const NAV = [
    ['seznamka', 'Seznamka', 'heart'],
    ['shop', 'E-shop', 'bag'],
    ['heaven', 'Heaven', 'cocktail'],
    ['pitch', 'The Pitch', 'ticket'],
    ['friends', 'Friends', 'users'],
    ['clenstvi', 'Členství', 'gem'],
  ];
  function renderChrome(route) {
    const href = (r) => (r === 'seznamka' ? 'app/' : `#${r}`);
    $('#nav').innerHTML = NAV.map(([r, l]) => `<a href="${href(r)}" class="${route === r ? 'active' : ''}">${l}</a>`).join('');
    const tabs = [['', 'Domů', 'home'], ...NAV.slice(0, 3), ['ucet', 'Účet', 'user']];
 $('#tabbar').innerHTML = tabs.map(([r, l, ic]) => `<a href="${href(r)}" class="${route === r ? 'active' : ''}">${I(ic)}<span>${l}</span></a>`).join('');
    const c = cartCount();
    $('#cartBtn').innerHTML = `${I('bag')}${c ? `<span class="badge">${c}</span>` : ''}`;
    $('#planChip').className = `plan-chip ${S.plan}`;
    $('#planChip').innerHTML = isPlus() ? `<span class="grad-text">NEXO+</span>` : `${I('user')}<span>${S.plan === 'adfree' ? 'Ad-Free' : 'Free'}</span>`;
  }

  /* ---------- Stránky ---------- */
  const pillars = [
    { r: 'seznamka', n: 1, t: 'Seznamka', lead: 'Poznej nové lidi. Na vztah, sex nebo přátelství.', items: [['heart', 'Profily, matching, chat'], ['chat', 'Režimy Date / Friends / Tonight'], ['checkCircle', 'Bez reklam (s předplatným)'], ['shield', 'Ověřené profily'], ['calendar', 'Event discovery']] },
    { r: 'shop', n: 2, t: 'E-shop', lead: 'Prémiový výběr pro moderní gay lifestyle.', items: [['bag', 'Erotické pomůcky a wellness'], ['tag', 'Prémiové značky'], ['gem', 'Exkluzivní nabídky pro členy'], ['truck', 'Rychlé a diskrétní doručení'], ['percent', 'Bonusy a slevy s NEXO+']] },
    { r: 'heaven', n: 3, t: 'Heaven', lead: 'Legendární gay klub v srdci Prahy.', items: [['ticket', 'Sleva na vstup'], ['lock', 'Members-only akce'], ['flame', 'Priority vstup'], ['sparkle', 'Speciální eventy pro členy'], ['cocktail', 'Drink vouchery a výhody']] },
    { r: 'pitch', n: 4, t: 'The Pitch', lead: 'Seznamovací akce, drag shows a komunitní večery.', items: [['users', 'Speed dating / meetingy'], ['ticket', 'Sleva na akce'], ['calendar', 'Přednostní registrace'], ['star', 'Speciální NEXO eventy'], ['mic', 'Komunitní setkání']] },
    { r: 'friends', n: 5, t: 'Friends', lead: 'Komunita, přátelství a společné zážitky.', items: [['users', 'Neformální meetupy'], ['run', 'Sport, cestování, kultura'], ['plane', 'Tematické skupiny'], ['lock', 'Privátní akce pro členy'], ['chat', 'Noví přátelé v Praze']] },
  ];

  function planCards() {
    return D.plans.map((p) => {
      const current = S.plan === p.id;
      return `<article class="plan ${p.popular ? 'plan-pop' : ''} ${current ? 'plan-current' : ''}">
        ${p.popular ? '<span class="pop-badge">Nejoblíbenější</span>' : ''}
        <h3>${p.id === 'plus' ? '<span>NEXO+</span> <em class="grad-text">Membership</em>' : esc(p.name)}</h3>
        <div class="price"><strong>${p.price} Kč</strong><span>/ měsíc</span></div>
        <p class="muted small">${p.lead}</p>
        <ul class="checks">${p.features.map((f) => `<li>${I('checkCircle')}${f}</li>`).join('')}
        ${p.missing.map((f) => `<li class="off">${I('checkCircle')}${f}</li>`).join('')}</ul>
        <button class="btn ${p.popular ? 'btn-grad' : 'btn-ghost'} btn-block" data-act="choose-plan" data-plan="${p.id}" ${current ? 'disabled' : ''}>${current ? 'Aktuální tarif' : p.price ? 'Vybrat tarif' : 'Přejít na Free'}</button>
      </article>`;
    }).join('');
  }

  function phoneMock() {
    const p = D.profiles[0];
    const e = D.events[0];
    return `<div class="phones" aria-hidden="true">
      <div class="phone ph1"><div class="ph-top"><span class="logo logo-xs">NEXO</span></div>
        <div class="ph-tabs"><b>Date</b><span>Friends</span><span>Events</span></div>
        <div class="ph-card">${avatar(p)}<div class="ph-meta"><span>${I('pin')} Praha</span><span>${p.km} km</span></div></div>
        <div class="ph-btns"><i>${I('undo')}</i><i>${I('x')}</i><i class="hl">${I('heart')}</i><i>${I('star')}</i></div></div>
      <div class="phone ph2"><div class="ph-top"><span>Events</span></div><div class="ph-event">${art('heaven')}</div>
        <div class="ph-ev-txt"><b>${e.title}</b><small>Heaven Club</small><small class="muted">${fmtDate(e.date)} • Praha</small></div>
        <div class="ph-cta">Získat vstupenku</div></div>
      <div class="phone ph3"><div class="ph-top"><span>Shop</span></div><div class="ph-shop">${art('shop')}</div></div>
    </div>`;
  }

  const views = {
    home() {
      return `
      <section class="hero container">
        <div class="hero-copy">
          <div class="logo logo-xl">NEXO</div>
          <p class="tagline">People • Places • Experiences</p>
          <h1>Jeden ekosystém<br /><span class="grad-text">pro gay komunitu v Praze.</span></h1>
          <p class="lead">Seznamka, e-shop, kluby, meetingy a komunita. Propojeno jedním členstvím.</p>
          <div class="hero-cta">
            <a class="btn btn-grad" href="#seznamka">Začít zdarma ${I('arrowRight')}</a>
            <a class="btn btn-ghost" href="#clenstvi">Členství NEXO+</a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="plus-card glass">
            <div class="plus-title"><span class="grad-text">NEXO+</span></div>
            <div class="plus-sub">Membership</div>
            <p>Jeden účet. Více možností.<br />Online i offline.</p>
            <div class="plus-icons">
              ${[['seznamka', 'heart', 'Seznamka'], ['shop', 'bag', 'E-shop'], ['pitch', 'ticket', 'Akce'], ['heaven', 'cocktail', 'Kluby'], ['friends', 'users', 'Friends']].map(([r, ic, l]) => `<a href="#${r}">${I(ic)}<span>${l}</span></a>`).join('')}
            </div>
          </div>
          ${phoneMock()}
        </div>
      </section>

      <section class="container">
        <div class="pillars">
          ${pillars.map((p) => `
            <a class="pillar" href="#${p.r}">
              <div class="pillar-art">${art(p.r)}${p.n === 1 ? '<span class="n-badge">N</span>' : ''}</div>
              <div class="pillar-body">
                <h3><span class="num">${p.n}.</span> ${p.t.toUpperCase()}</h3>
                <p>${p.lead}</p>
                <ul>${p.items.map(([ic, t]) => `<li>${I(ic)}${t}</li>`).join('')}</ul>
              </div>
            </a>`).join('')}
        </div>
      </section>

      <section class="container tariffs" id="tarify">
        <div class="tariffs-intro">
          <h2 class="eyebrow-title">Tarify</h2>
          <p class="muted">Vyber si, co ti sedí.<br />Od základních funkcí po členství v celém ekosystému.</p>
        </div>
        <div class="plans">${planCards()}</div>
        <div class="one-account glass">
          ${I('qr', 'qr-ic')}
          <h3 class="grad-text">Jeden účet.<br />Všude s tebou.</h3>
          <p class="muted small">Přihlas se jednou a využívej všechny služby NEXO online i offline. Tvůj digitální členský průkaz, výhody a komunita v jedné aplikaci.</p>
          <a href="#ucet" class="link">Můj průkaz ${I('arrowRight')}</a>
        </div>
      </section>`;
    },

    /* ----- E-shop ----- */
    shop(params) {
      const cat = shopCat;
      const items = D.products.filter((p) => cat === 'all' || p.cat === cat);
      return `
      <section class="container page">
        <div class="page-head">
          <div><p class="eyebrow">2. E-shop</p><h1>Prémiový výběr</h1><p class="muted">Pro moderní gay lifestyle. Rychlé a diskrétní doručení po celé ČR.</p></div>
          <div class="perks">
            <span>${I('truck')} Doprava zdarma od 1 500 Kč</span>
            <span>${I('eyeOff')} Neutrální balení</span>
            <span>${I('percent')} ${isPlus() ? '<b>Tvá NEXO+ sleva je aktivní</b>' : '5–10 % s NEXO+'}</span>
          </div>
        </div>
        <div class="chips">${D.productCats.map((c) => `<button class="chip ${cat === c.id ? 'on' : ''}" data-act="cat" data-cat="${c.id}">${c.name}</button>`).join('')}</div>
        <div class="products">${items.map(productCard).join('')}</div>
        ${adBanner()}
      </section>`;
    },

    kosik() {
      const lines = Object.entries(S.cart).map(([id, q]) => ({ p: D.products.find((x) => x.id === id), q })).filter((l) => l.p);
      const full = lines.reduce((a, l) => a + l.p.price * l.q, 0);
      const sub = lines.reduce((a, l) => a + shopPrice(l.p) * l.q, 0);
      const ship = sub >= 1500 || sub === 0 ? 0 : 89;
      return `
      <section class="container page narrow">
        <div class="page-head"><div><p class="eyebrow">E-shop</p><h1>Košík</h1></div></div>
        ${lines.length ? `
        <div class="cart glass">
          ${lines.map(({ p, q }) => `
            <div class="cart-line">
              <div class="thumb" style="--h:${p.hue}"><span class="bottle mini"></span></div>
              <div class="grow"><b>${esc(p.name)}</b><div class="muted small">${kc(shopPrice(p))} / ks</div></div>
              <div class="qty">
                <button data-act="qty" data-id="${p.id}" data-d="-1" aria-label="Méně">${I('minus')}</button><span>${q}</span><button data-act="qty" data-id="${p.id}" data-d="1" aria-label="Více">${I('plus')}</button>
              </div>
              <b class="line-total">${kc(shopPrice(p) * q)}</b>
            </div>`).join('')}
          <div class="cart-sum">
            <div><span>Mezisoučet</span><span>${kc(full)}</span></div>
            ${full !== sub ? `<div class="accent"><span>Sleva NEXO+</span><span>−${kc(full - sub)}</span></div>` : ''}
            <div><span>Doprava (diskrétní balení)</span><span>${ship ? kc(ship) : 'Zdarma'}</span></div>
            <div class="total"><span>Celkem</span><span>${kc(sub + ship)}</span></div>
            ${isPlus() ? `<div class="muted small">Za objednávku získáš <b>${Math.floor(sub / 10)} NEXO bodů</b>.</div>` : `<div class="muted small">S NEXO+ bys ušetřil ${kc(lines.reduce((a, l) => a + Math.round(l.p.price * (l.p.exclusive ? 0.1 : 0.05)) * l.q, 0))} a sbíral body. <a class="link" href="#clenstvi">Více</a></div>`}
          </div>
          <button class="btn btn-grad btn-block" data-act="checkout" data-total="${sub + ship}">Pokračovat k platbě</button>
        </div>` : `<div class="empty glass">${I('bag')}<h3>Košík je prázdný</h3><a class="btn btn-ghost" href="#shop">Do e-shopu</a></div>`}
      </section>`;
    },

    /* ----- Heaven ----- */
    heaven() { return venuePage('heaven'); },
    pitch() { return venuePage('pitch'); },

    /* ----- Friends ----- */
    friends() {
      return `
      <section class="container page">
        <div class="venue-hero friends-hero">${art('friends')}<div class="venue-hero-txt"><p class="eyebrow">5. Friends</p><h1>Komunita, přátelství a společné zážitky</h1><p class="muted">Neformální meetupy, sport, cestování a kultura. Najdi svou partu v Praze.</p></div></div>
        <div class="groups">${D.groups.map(groupCard).join('')}</div>
        <div class="split glass">
          <div><h3>Hledáš kamarády, ne rande?</h3><p class="muted">Přepni seznamku do režimu <b>Friends</b> a ukážeme ti lidi se stejnými zájmy.</p></div>
          <button class="btn btn-ghost" data-act="go-friends-mode">Otevřít Friends režim ${I('arrowRight')}</button>
        </div>
      </section>`;
    },

    /* ----- Členství ----- */
    clenstvi() {
      return `
      <section class="container page">
        <div class="page-head center-head"><div><p class="eyebrow">Tarify</p><h1>Vyber si, co ti sedí</h1><p class="muted">Od základních funkcí po členství v celém ekosystému. Kdykoliv zrušíš.</p></div></div>
        <div class="plans plans-page">${planCards()}</div>
        <div class="compare glass">
          <table>
            <thead><tr><th></th><th>Free</th><th>Ad-Free</th><th class="grad-text">NEXO+</th></tr></thead>
            <tbody>
              ${[
                ['Lajky v seznamce', '15 / den', 'Neomezeně', 'Neomezeně'],
                ['Reklamy', 'Ano', 'Ne', 'Ne'],
                ['Pokročilé filtry a vrácení swipu', '—', '✓', '✓'],
                ['Super like', '—', '—', '✓'],
                ['Sleva v e-shopu', '—', '—', '5–10 %'],
                ['Sleva na vstup Heaven / The Pitch', '—', '—', '20 %'],
                ['Members-only akce a skupiny', '—', '—', '✓'],
                ['Prioritní registrace', '—', '—', '✓'],
                ['NEXO Rewards body', '—', '—', '1 bod / 10 Kč'],
              ].map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><b>${r[3]}</b></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="faq">
          ${[
            ['Jak členství funguje offline?', 'V účtu máš digitální členský průkaz s QR kódem. Na baru nebo u vstupu v Heaven a The Pitch ho jen ukážeš a sleva se uplatní automaticky.'],
            ['Můžu tarif kdykoli změnit?', 'Ano. Změna platí okamžitě, předplatné se účtuje měsíčně a zrušit ho můžeš jedním klikem.'],
            ['Jsou moje data v bezpečí?', 'Profily ověřujeme, polohu ukazujeme jen přibližně a objednávky z e-shopu posíláme v neutrálním balení bez loga.'],
          ].map(([q, a]) => `<details class="glass"><summary>${q}</summary><p class="muted">${a}</p></details>`).join('')}
        </div>
      </section>`;
    },

    /* ----- Účet ----- */
    ucet() {
      const myTickets = S.tickets.map((t) => ({ ...t, e: D.events.find((e) => e.id === t.eventId) })).filter((t) => t.e);
      const myGroups = D.groups.filter((g) => S.groups.includes(g.id));
      return `
      <section class="container page">
        <div class="page-head"><div><p class="eyebrow">Můj účet</p><h1>Ahoj${S.name ? ', ' + esc(S.name) : ''} 👋</h1><p class="muted">Jeden účet. Všude s tebou.</p></div></div>
        <div class="account">
          <div class="member-card ${S.plan}">
            <div class="mc-top"><span class="logo logo-sm">NEXO</span><span class="mc-plan">${isPlus() ? 'NEXO+ MEMBER' : planName().toUpperCase()}</span></div>
            <div class="mc-mid">
              <div><div class="mc-name">${esc(S.name || 'Tvoje jméno')}</div><div class="mc-id">${memberId()}</div><div class="mc-since">Členem od ${new Date(S.memberSince).toLocaleDateString('cs-CZ')}</div></div>
              ${qr(memberId(), 96)}
            </div>
            <div class="mc-foot">People • Places • Experiences</div>
          </div>
          <div class="acc-side">
            <label class="field"><span>Jméno na průkazu</span><input id="nameInput" maxlength="24" value="${esc(S.name)}" placeholder="Např. Honza" /></label>
            <div class="row-between"><span class="muted">Tarif</span><b>${planName()}</b></div>
            <a href="#clenstvi" class="btn btn-ghost btn-block">Změnit tarif</a>
          </div>
        </div>

        <h2 class="sec-title">${I('gift')} NEXO Rewards</h2>
        <div class="rewards glass">
          <div class="points"><strong class="grad-text">${S.points}</strong><span>bodů</span>${isPlus() ? '' : '<small class="muted">Body sbíráš s NEXO+</small>'}</div>
          <div class="reward-list">${D.rewards.map((r) => `
            <div class="reward"><span class="r-ic">${I(r.icon)}</span><div class="grow"><b>${r.name}</b><div class="muted small">${r.cost} bodů</div></div>
            <button class="btn btn-sm ${S.points >= r.cost && isPlus() ? 'btn-grad' : 'btn-ghost'}" data-act="redeem" data-id="${r.id}" ${S.points >= r.cost && isPlus() ? '' : 'disabled'}>Uplatnit</button></div>`).join('')}
          </div>
        </div>
        ${S.redeemed.length ? `<p class="muted small">Uplatněno: ${S.redeemed.map((r) => esc(D.rewards.find((x) => x.id === r.id)?.name || '') + ' (' + r.code + ')').join(', ')}</p>` : ''}

        <h2 class="sec-title">${I('ticket')} Moje vstupenky</h2>
        ${myTickets.length ? `<div class="tickets">${myTickets.map((t) => `
          <div class="ticket glass"><div class="grow"><p class="eyebrow">${venueName[t.e.venue]}</p><b>${esc(t.e.title)}</b><div class="muted small">${fmtDate(t.e.date)} • ${t.e.time} • ${t.qty}× vstup</div><div class="mono small">${t.code}</div></div>${qr(t.code, 84)}</div>`).join('')}</div>`
          : `<p class="muted">Zatím žádné. <a class="link" href="#heaven">Podívej se na akce</a>.</p>`}

        <h2 class="sec-title">${I('users')} Moje skupiny</h2>
        ${myGroups.length ? `<div class="chips">${myGroups.map((g) => `<a class="chip on" href="#friends">${g.name}</a>`).join('')}</div>` : `<p class="muted">Ještě nejsi v žádné skupině. <a class="link" href="#friends">Najdi partu</a>.</p>`}

        <div class="danger"><button class="btn btn-sm btn-ghost" data-act="reset-all">${I('logout')} Vymazat demo data</button></div>
      </section>`;
    },

    notfound() {
      return `<section class="container page narrow"><div class="empty glass"><h3>Stránka nenalezena</h3><a class="btn btn-ghost" href="#">Domů</a></div></section>`;
    },
  };

  /* ---------- Komponenty ---------- */
  function currentDeck() {
    const f = S.filters;
    const useFilters = noAds();
    return D.profiles.filter((p) => p.modes.includes(S.mode)
      && !S.liked.includes(p.id) && !S.passed.includes(p.id)
      && (!useFilters || (p.age >= f.ageMin && p.age <= f.ageMax && p.km <= f.km && (!f.verified || p.verified))));
  }

  function profileCard(p, isTop) {
    return `<article class="pcard ${isTop ? 'top' : ''}" data-id="${p.id}">
      ${avatar(p, true)}
      <div class="stamp stamp-like">LIKE</div><div class="stamp stamp-nope">NOPE</div>
      <div class="pcard-info">
        <h2>${p.name}, ${p.age} ${p.verified ? `<span class="verified" title="Ověřený profil">${I('check')}</span>` : ''}</h2>
        <div class="pcard-meta">${I('pin')} ${p.area} • ${p.km} km</div>
        <p>${esc(p.bio)}</p>
        <div class="tags">${p.tags.map((t) => `<span>${t}</span>`).join('')}</div>
      </div>
    </article>`;
  }

  function matchesList() {
    if (!S.matches.length) return `<p class="muted small">Zatím žádné matche. Dej like a uvidíme! 💜</p>`;
    return `<div class="matches">${S.matches.map((m) => {
      const p = D.profiles.find((x) => x.id === m.id);
      const last = m.msgs[m.msgs.length - 1];
      return `<button class="match" data-act="open-chat" data-id="${p.id}">${avatar(p)}<div class="grow"><b>${p.name}</b><span class="muted small">${last ? esc(last.t) : 'Nový match — napiš první!'}</span></div>${m.super ? I('star', 'ic-gold') : ''}</button>`;
    }).join('')}</div>`;
  }

  function eventMini(e) {
    return `<a class="ev-mini" href="#${e.venue === 'nexo' ? 'pitch' : e.venue}"><span class="date-box"><b>${new Date(e.date).getDate()}.</b><small>${new Date(e.date).getMonth() + 1}.</small></span><div class="grow"><b>${esc(e.title)}</b><span class="muted small">${venueName[e.venue]} • ${e.time}</span></div>${I('arrowRight')}</a>`;
  }

  function productCard(p) {
    const locked = p.exclusive && !isPlus();
    const d = shopDiscount(p);
    return `<article class="product glass">
      <div class="product-img" style="--h:${p.hue}">
        <span class="bottle b-lg"><i>NEXO</i></span>
        ${p.badge ? `<span class="p-badge ${p.exclusive ? 'gold' : ''}">${p.badge}</span>` : ''}
      </div>
      <div class="product-body">
        <h3>${esc(p.name)}</h3>
        <p class="muted small">${esc(p.desc)}</p>
        <div class="product-foot">
          <div class="pprice">${d ? `<s>${kc(p.price)}</s>` : ''}<b>${kc(shopPrice(p))}</b></div>
          ${locked ? `<a href="#clenstvi" class="btn btn-sm btn-ghost">${I('lock')} NEXO+</a>` : `<button class="btn btn-sm btn-grad" data-act="add" data-id="${p.id}">${I('plus')} Do košíku</button>`}
        </div>
      </div>
    </article>`;
  }

  function eventCard(e) {
    const owned = S.tickets.find((t) => t.eventId === e.id);
    const locked = (e.membersOnly || e.priority) && !isPlus();
    const d = eventDiscount(e);
    const pct = e.capacity ? Math.round((e.taken / e.capacity) * 100) : null;
    let action;
    if (owned) action = `<a class="btn btn-sm btn-ghost" href="#ucet">${I('check')} Máš vstupenku</a>`;
    else if (locked) action = `<a class="btn btn-sm btn-ghost" href="#clenstvi">${I('lock')} ${e.priority ? 'Priorita NEXO+' : 'Jen NEXO+'}</a>`;
    else action = `<button class="btn btn-sm btn-grad" data-act="buy" data-id="${e.id}">${e.price ? 'Získat vstupenku' : 'Registrovat'}</button>`;
    return `<article class="event glass">
      <div class="date-box lg"><b>${new Date(e.date).getDate()}.</b><small>${fmtDate(e.date).split(' ')[0]} ${new Date(e.date).getMonth() + 1}.</small></div>
      <div class="grow">
        <div class="ev-tags"><span class="tag">${e.cat}</span>${e.membersOnly ? `<span class="tag gold">${I('lock', 'ic-xs')} Members-only</span>` : ''}${e.priority ? `<span class="tag gold">Prioritní registrace</span>` : ''}</div>
        <h3>${esc(e.title)}</h3>
        <p class="muted small">${esc(e.desc)}</p>
        <div class="ev-meta">${I('clock')} ${e.time} ${I('pin')} ${venueName[e.venue]}${pct !== null ? ` • <span class="cap"><i style="width:${pct}%"></i></span> ${e.capacity - e.taken} míst` : ''}</div>
      </div>
      <div class="ev-right">
        <div class="pprice">${d ? `<s>${kc(e.price)}</s>` : ''}<b>${e.price ? kc(eventPrice(e)) : 'Zdarma'}</b></div>
        ${action}
      </div>
    </article>`;
  }

  function venuePage(v) {
    const isHeaven = v === 'heaven';
    const evs = D.events.filter((e) => e.venue === v || (!isHeaven && e.venue === 'nexo')).sort((a, b) => a.date.localeCompare(b.date));
    const perks = isHeaven
      ? [['ticket', 'Sleva 20 % na vstup'], ['flame', 'Priority vstup bez fronty'], ['lock', 'Members-only noci'], ['cocktail', 'Drink vouchery za body']]
      : [['users', 'Speed dating a meetingy'], ['ticket', 'Sleva 20 % na akce'], ['calendar', 'Přednostní registrace'], ['mic', 'Drag shows a komunitní večery']];
    return `
      <section class="container page">
        <div class="venue-hero ${isHeaven ? 'heaven-hero' : 'pitch-hero'}">
          ${art(v)}
          <div class="venue-hero-txt">
            <p class="eyebrow">${isHeaven ? '3. Heaven' : '4. The Pitch'}</p>
            <h1>${isHeaven ? 'Legendární gay klub v srdci Prahy' : 'Seznamovací akce, drag shows a komunitní večery'}</h1>
            <p class="muted">${isHeaven ? 'Pá–So 22:00–06:00 • Praha 1' : 'St–So od 18:00 • Praha 2'}</p>
          </div>
        </div>
        <div class="perk-row">${perks.map(([ic, t]) => `<div class="perk glass">${I(ic)}<span>${t}</span></div>`).join('')}</div>
        ${isPlus() ? `<div class="notice">${I('gem')}<span>Jsi člen NEXO+ — slevy jsou už započítané v cenách. Při vstupu ukaž průkaz v <a class="link" href="#ucet">účtu</a>.</span></div>` : `<div class="notice">${I('sparkle')}<span>S <a class="link" href="#clenstvi">NEXO+</a> máš 20 % slevu na vstup, priority vstup a members-only akce.</span></div>`}
        <h2 class="sec-title">${I('calendar')} Program</h2>
        <div class="events">${evs.map(eventCard).join('')}</div>
      </section>`;
  }

  function groupCard(g) {
    const joined = S.groups.includes(g.id);
    const locked = g.membersOnly && !isPlus();
    return `<article class="group glass">
      <div class="g-ic">${I(g.icon)}</div>
      <div class="grow">
        <div class="ev-tags"><span class="tag">${g.cat}</span>${g.membersOnly ? `<span class="tag gold">${I('lock', 'ic-xs')} Pro členy</span>` : ''}</div>
        <h3>${g.name}</h3>
        <p class="muted small">${g.desc}</p>
        <div class="ev-meta">${I('users')} ${g.members + (joined ? 1 : 0)} členů • ${I('calendar')} ${g.next}</div>
      </div>
      ${locked ? `<a class="btn btn-sm btn-ghost" href="#clenstvi">${I('lock')} NEXO+</a>` : `<button class="btn btn-sm ${joined ? 'btn-ghost' : 'btn-grad'}" data-act="join" data-id="${g.id}">${joined ? 'Odejít' : 'Přidat se'}</button>`}
    </article>`;
  }

  /* ---------- Seznamka: akce ---------- */
  function swipe(dir) {
    const deck = currentDeck();
    const p = deck[0];
    if (!p) return;
    if ((dir === 'like' || dir === 'super') && S.plan === 'free' && S.likes.n >= FREE_LIKES) {
      toast('Dnešní lajky došly. Neomezeně s Ad-Free.');
      return;
    }
    if (dir === 'super' && !isPlus()) {
      toast(`${I('star')} Super like je součástí NEXO+`);
      return;
    }
    const card = $(`.pcard.top`);
    const finish = () => {
      if (dir === 'pass') S.passed.push(p.id);
      else {
        S.liked.push(p.id);
        S.likes.n++;
        const isMatch = dir === 'super' || hash(p.id + p.name) % 3 !== 0;
        if (isMatch && !S.matches.find((m) => m.id === p.id)) {
          S.matches.unshift({ id: p.id, msgs: [], super: dir === 'super' });
          setTimeout(() => matchModal(p), 150);
        }
      }
      S.history.push({ id: p.id, dir });
      save();
      render();
    };
    if (card) {
      card.style.transition = 'transform .35s ease, opacity .35s ease';
      const x = dir === 'pass' ? -1 : 1;
      card.style.transform = dir === 'super' ? 'translateY(-120%) scale(.9)' : `translateX(${x * 130}%) rotate(${x * 18}deg)`;
      card.style.opacity = '0';
      setTimeout(finish, 280);
    } else finish();
  }

  function matchModal(p) {
    modal(`<div class="match-modal">
      <p class="eyebrow">It's a match</p>
      <div class="match-avatars">${avatar({ id: 'me', name: S.name || 'Ty', hue: 270 })}${avatar(p)}</div>
      <h2>Ty a ${p.name} se líbíte!</h2>
      <p class="muted">Napiš mu první zprávu, nebo ho pozvi na nejbližší akci.</p>
      <div class="btn-row"><button class="btn btn-grad" data-act="open-chat" data-id="${p.id}">${I('chat')} Napsat zprávu</button><button class="btn btn-ghost" data-act="close-modal">Pokračovat</button></div>
    </div>`);
  }

  function chatModal(id) {
    const p = D.profiles.find((x) => x.id === id);
    const m = S.matches.find((x) => x.id === id);
    if (!p || !m) return;
    modal(`<div class="chat">
      <div class="chat-head">${avatar(p)}<div><b>${p.name}, ${p.age}</b><div class="muted small">${p.area} • ${p.km} km</div></div></div>
      <div class="chat-body" id="chatBody">${chatMsgs(m)}</div>
      <form class="chat-form" data-id="${id}"><input id="chatInput" autocomplete="off" placeholder="Napiš zprávu…" maxlength="500" /><button class="round" aria-label="Odeslat">${I('send')}</button></form>
    </div>`, 'modal-chat');
    $('#chatInput').focus();
    const b = $('#chatBody'); b.scrollTop = b.scrollHeight;
  }
  const chatMsgs = (m) => m.msgs.length ? m.msgs.map((x) => `<div class="msg ${x.me ? 'me' : ''}">${esc(x.t)}</div>`).join('') : `<p class="center muted small">Začni konverzaci. Tip: zeptej se na jeho zájmy 😉</p>`;

  function filtersModal() {
    if (!noAds()) {
      modal(`<div class="center"><h2>${I('filter')} Pokročilé filtry</h2><p class="muted">Filtry podle věku, vzdálenosti a ověření jsou součástí Ad-Free a NEXO+.</p><a href="#clenstvi" class="btn btn-grad" data-act="close-modal">Zobrazit tarify</a></div>`);
      return;
    }
    const f = S.filters;
    modal(`<form class="filters" id="filtersForm"><h2>Filtry</h2>
      <label class="field"><span>Věk od <b id="aMinV">${f.ageMin}</b></span><input type="range" name="ageMin" min="18" max="60" value="${f.ageMin}" /></label>
      <label class="field"><span>Věk do <b id="aMaxV">${f.ageMax}</b></span><input type="range" name="ageMax" min="18" max="70" value="${f.ageMax}" /></label>
      <label class="field"><span>Vzdálenost do <b id="kmV">${f.km}</b> km</span><input type="range" name="km" min="1" max="50" value="${f.km}" /></label>
      <label class="check"><input type="checkbox" name="verified" ${f.verified ? 'checked' : ''} /> Jen ověřené profily</label>
      <button class="btn btn-grad btn-block">Použít</button></form>`);
  }

  /* ---------- Události ---------- */
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const id = el.dataset.id;
    switch (act) {
      case 'close-modal': closeModal(); break;
      case 'cat': shopCat = el.dataset.cat; render(); break;
      case 'mode': S.mode = el.dataset.mode; save(); render(); break;
      case 'like': swipe('like'); break;
      case 'pass': swipe('pass'); break;
      case 'super': swipe('super'); break;
      case 'undo': {
        if (!noAds()) { toast('Vrácení swipu je v Ad-Free a NEXO+'); break; }
        const last = S.history.pop();
        if (!last) { toast('Není co vrátit'); break; }
        S.passed = S.passed.filter((x) => x !== last.id);
        if (last.dir !== 'pass') {
          S.liked = S.liked.filter((x) => x !== last.id);
          S.likes.n = Math.max(0, S.likes.n - 1);
        }
        save(); render(); break;
      }
      case 'reset-deck': S.passed = []; S.history = []; save(); render(); break;
      case 'filters': filtersModal(); break;
      case 'open-chat': chatModal(id); break;
      case 'go-friends-mode': S.mode = 'friends'; save(); location.hash = '#seznamka'; break;
      case 'add': {
        S.cart[id] = (S.cart[id] || 0) + 1; save(); renderChrome(route().name);
        toast(`${I('check')} Přidáno do košíku`); break;
      }
      case 'qty': {
        S.cart[id] = (S.cart[id] || 0) + Number(el.dataset.d);
        if (S.cart[id] <= 0) delete S.cart[id];
        save(); render(); break;
      }
      case 'checkout': {
        const total = Number(el.dataset.total);
        modal(`<div class="center"><h2>Platba</h2><p class="muted">Demo verze — platební brána (např. GoPay / Stripe) se napojí v produkci.</p>
          <div class="sum-big">${kc(total)}</div>
          <button class="btn btn-grad btn-block" data-act="pay" data-total="${total}">Zaplatit (demo)</button></div>`);
        break;
      }
      case 'pay': {
        const total = Number(el.dataset.total);
        const pts = isPlus() ? Math.floor(total / 10) : 0;
        S.points += pts; S.cart = {}; save(); closeModal(); location.hash = '#ucet';
        toast(`${I('check')} Objednávka přijata${pts ? ` • +${pts} bodů` : ''}. Odešleme v diskrétním balení.`);
        break;
      }
      case 'buy': {
        const e = D.events.find((x) => x.id === id);
        modal(`<div><p class="eyebrow">${venueName[e.venue]} • ${fmtDate(e.date)} ${e.time}</p><h2>${esc(e.title)}</h2>
          <p class="muted">${esc(e.desc)}</p>
          <div class="row-between buy-row"><span>Počet vstupenek</span><select id="qtySel">${[1, 2, 3, 4].map((n) => `<option>${n}</option>`).join('')}</select></div>
          <div class="row-between"><span>Cena / ks</span><b>${e.price ? kc(eventPrice(e)) : 'Zdarma'}${eventDiscount(e) ? ` <span class="accent small">(−${eventDiscount(e) * 100} % NEXO+)</span>` : ''}</b></div>
          <button class="btn btn-grad btn-block" data-act="confirm-buy" data-id="${e.id}">${e.price ? 'Koupit (demo)' : 'Potvrdit registraci'}</button></div>`);
        break;
      }
      case 'confirm-buy': {
        const e = D.events.find((x) => x.id === id);
        const qty = Number($('#qtySel').value);
        const code = `${e.venue.toUpperCase().slice(0, 3)}-${(hash(e.id + Date.now()) % 1e6).toString(36).toUpperCase().padStart(4, '0')}`;
        S.tickets.push({ eventId: id, qty, code });
        if (isPlus()) S.points += Math.floor((eventPrice(e) * qty) / 10);
        save(); closeModal(); render();
        toast(`${I('ticket')} Vstupenka je ve tvém účtu`);
        break;
      }
      case 'join': {
        const g = D.groups.find((x) => x.id === id);
        if (S.groups.includes(id)) { S.groups = S.groups.filter((x) => x !== id); toast(`Opustil jsi skupinu ${g.name}`); }
        else { S.groups.push(id); toast(`${I('users')} Vítej ve skupině ${g.name}!`); }
        save(); render(); break;
      }
      case 'choose-plan': {
        const p = D.plans.find((x) => x.id === el.dataset.plan);
        modal(`<div class="center"><p class="eyebrow">Změna tarifu</p><h2>${p.id === 'plus' ? '<span class="grad-text">NEXO+</span> Membership' : p.name}</h2>
          <div class="sum-big">${p.price} Kč <small class="muted">/ měsíc</small></div>
          <p class="muted small">Demo — v produkci zde proběhne platba předplatného.</p>
          <button class="btn btn-grad btn-block" data-act="confirm-plan" data-plan="${p.id}">${p.price ? 'Aktivovat' : 'Přejít na Free'}</button></div>`);
        break;
      }
      case 'confirm-plan': {
        const wasPlus = isPlus();
        S.plan = el.dataset.plan;
        if (S.plan === 'plus' && !wasPlus) S.points += 100;
        save(); closeModal(); render();
        toast(S.plan === 'plus' ? `${I('gem')} Vítej v NEXO+! Bonus +100 bodů.` : `Tarif změněn na ${planName()}`);
        break;
      }
      case 'redeem': {
        const r = D.rewards.find((x) => x.id === id);
        if (S.points < r.cost) break;
        S.points -= r.cost;
        const code = 'RW-' + (hash(r.id + Date.now()) % 1e6).toString(36).toUpperCase();
        S.redeemed.push({ id, code });
        if (id === 'r4') S.superLikes += 5;
        save(); render(); toast(`${I('gift')} Uplatněno: ${r.name}`);
        break;
      }
      case 'reset-all': {
        if (el.dataset.confirm) { localStorage.removeItem(KEY); S = defaults(); save(); render(); toast('Demo data vymazána'); }
        else { el.dataset.confirm = '1'; el.innerHTML = 'Opravdu? Klikni znovu'; }
        break;
      }
    }
  });

  document.addEventListener('submit', (ev) => {
    const f = ev.target;
    if (f.classList.contains('chat-form') && $('#chatInput')) {
      ev.preventDefault();
      const input = $('#chatInput');
      const t = input.value.trim();
      if (!t) return;
      const m = S.matches.find((x) => x.id === f.dataset.id);
      m.msgs.push({ me: true, t });
      input.value = '';
      save();
      $('#chatBody').innerHTML = chatMsgs(m);
      $('#chatBody').scrollTop = 1e6;
      setTimeout(() => {
        m.msgs.push({ me: false, t: D.replies[(m.msgs.length + hash(m.id)) % D.replies.length] });
        save();
        const b = $('#chatBody');
        if (b) { b.innerHTML = chatMsgs(m); b.scrollTop = 1e6; }
        if (route().name === 'seznamka') { const col = $('.matches'); if (col) col.outerHTML = matchesList(); }
      }, 1100);
    }
    if (f.id === 'filtersForm') {
      ev.preventDefault();
      const fd = new FormData(f);
      let a = Number(fd.get('ageMin')), b = Number(fd.get('ageMax'));
      if (a > b) [a, b] = [b, a];
      S.filters = { ageMin: a, ageMax: b, km: Number(fd.get('km')), verified: !!fd.get('verified') };
      save(); closeModal(); render();
    }
  });

  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.id === 'nameInput') { S.name = t.value.trim(); save(); const n = $('.mc-name'); if (n) n.textContent = S.name || 'Tvoje jméno'; }
    if (t.form && t.form.id === 'filtersForm') {
      const map = { ageMin: 'aMinV', ageMax: 'aMaxV', km: 'kmV' };
      if (map[t.name]) $('#' + map[t.name]).textContent = t.value;
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
  });

  /* Tažení karty (swipe gestem). */
  function bindDrag() {
    const card = $('.pcard.top');
    if (!card) return;
    let sx = 0, sy = 0, dx = 0, dragging = false;
    card.addEventListener('pointerdown', (e) => { dragging = true; sx = e.clientX; sy = e.clientY; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; });
    card.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dx = e.clientX - sx;
      const dy = e.clientY - sy;
      card.style.transform = `translate(${dx}px, ${dy * 0.3}px) rotate(${dx / 18}deg)`;
      card.style.setProperty('--like', Math.max(0, Math.min(1, dx / 100)));
      card.style.setProperty('--nope', Math.max(0, Math.min(1, -dx / 100)));
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (dx > 110) swipe('like');
      else if (dx < -110) swipe('pass');
      else { card.style.transition = 'transform .25s ease'; card.style.transform = ''; card.style.setProperty('--like', 0); card.style.setProperty('--nope', 0); }
      dx = 0;
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  }

  /* ---------- Router ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const name = path || '';
    return { name, params: new URLSearchParams(qs || '') };
  }
  let lastRoute = null;
  let shopCat = 'all';
  function render() {
    const r = route();
    if (r.name === 'seznamka') { location.replace('app/'); return; }
    const view = r.name === '' ? views.home : views[r.name] || views.notfound;
    app.innerHTML = view(r.params);
    renderChrome(r.name);
    if (lastRoute !== r.name) { window.scrollTo(0, 0); lastRoute = r.name; }
    document.title = r.name ? `${(NAV.find((n) => n[0] === r.name) || [, r.name === 'ucet' ? 'Účet' : r.name === 'kosik' ? 'Košík' : 'NEXO'])[1]} — NEXO` : 'NEXO — People • Places • Experiences';
  }
  window.addEventListener('hashchange', () => { closeModal(); render(); });
  render();
})();
