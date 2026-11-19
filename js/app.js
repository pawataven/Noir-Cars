/* NOIR CARS — renders every page from js/data.js. Plain JS, no build step. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  const D = window.NOIR;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = document.body.dataset.page;

  const brandOf = (id) => D.brands.find((brand) => brand.id === id);
  const typeOf = (id) => D.types.find((type) => type.id === id);
  const carOf = (id) => D.cars.find((car) => car.id === id);
  const carImg = (key) => `img/cars/${key}.webp`;
  const sceneImg = (key) => `img/scenes/${key}.webp`;
  const imgFor = (key) => (D.credits[key] && ['stage', 'garage', 'lightbox', 'showroom', 'cabin', 'wheel', 'dash'].includes(key) ? sceneImg(key) : carImg(key));
  const baht = (n) => n.toLocaleString('th-TH');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const WIDE_LOGOS = ['toyota', 'lexus', 'mercedes', 'porsche'];
  // Shared by observeReveal(), which the inventory page already calls while it first renders.
  let observer;

  /** Monthly installment, Thai flat-rate hire purchase: (price − down) × (1 + rate × years) ÷ months. */
  const monthly = (price, downPct = 25, months = 72, rate = 2.79) => {
    const loan = price * (1 - downPct / 100);
    return Math.round((loan * (1 + (rate / 100) * (months / 12))) / months / 10) * 10;
  };

  const icon = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16M14 6l6 6-6 6"/></svg>',
    line: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 .9l-.1.9c0 .3-.2 1 .9.5 1-.4 5.6-3.3 7.7-5.6C21.3 14.4 22 12.8 22 11c0-4.4-4.5-8-10-8z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    road: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><path d="M7 21 10 3M17 21 14 3M12 6v2M12 11v2M12 16v2"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v8M12 8v8M18 8v4H6"/></svg>',
    fuel: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M4 10h11M15 8l3 2v8a1.5 1.5 0 0 0 3 0V9l-3-3"/></svg>',
    engine: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><path d="M4 9h3l2-2h5l2 2h2v3h2v4h-2v2h-4l-2 2H9l-2-2H4z"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.5-4.5"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7"/></svg>',
    wheel: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3v6.5M4.5 16.5l5.4-3M19.5 16.5l-5.4-3"/></svg>',
  };

  /* ---------- shared header & footer ---------- */
  const NAV = [
    ['cars.html', 'รถทั้งหมด'],
    ['index.html#brands', 'แบรนด์'],
    ['index.html#finance', 'คำนวณค่างวด'],
    ['index.html#sell', 'ขายรถกับเรา'],
    ['contact.html', 'ติดต่อ'],
  ];

  const header = $('[data-header]');
  if (header) {
    header.outerHTML = `
      <header class="site-header">
        <div class="wrap">
          <a class="brand-logo" href="index.html" aria-label="NOIR CARS หน้าแรก"><img src="img/logo/noir-logo.svg" alt="NOIR CARS" width="185" height="36" /></a>
          <nav class="nav" aria-label="เมนูหลัก">
            ${NAV.map(([href, label]) => `<a href="${href}"${location.pathname.endsWith(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
          </nav>
          <a class="btn header-cta" href="contact.html">นัดดูรถ</a>
          <button class="burger" type="button" aria-label="เปิดเมนู" data-menu-open><span></span><span></span><span></span></button>
        </div>
      </header>
      <div class="mobile-menu" data-menu aria-hidden="true">
        <button class="close" type="button" aria-label="ปิดเมนู" data-menu-close>×</button>
        <nav aria-label="เมนู">${NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</nav>
      </div>`;
  }

  const footer = $('[data-footer]');
  if (footer) {
    footer.outerHTML = `
      <footer class="site-footer">
        <div class="wrap">
          <div class="cols">
            <div style="display:grid;gap:18px;align-content:start">
              <img src="img/logo/noir-logo-ivory.svg" alt="NOIR CARS" width="185" height="36" />
              <p style="max-width:28em">รถมือสองคัดพิเศษ ตรวจครบทุกคัน พร้อมรับประกันและไฟแนนซ์ในที่เดียว</p>
            </div>
            <div><h4>รถตามแบรนด์</h4><ul>${D.brands.slice(0, 4).map((b) => `<li><a href="cars.html?brand=${b.id}">${b.name}</a></li>`).join('')}</ul></div>
            <div><h4>&nbsp;</h4><ul>${D.brands.slice(4).map((b) => `<li><a href="cars.html?brand=${b.id}">${b.name}</a></li>`).join('')}</ul></div>
            <div><h4>ติดต่อ</h4><ul><li>02 000 0000</li><li>LINE @noircars</li><li>ทุกวัน 10:00 – 19:00</li><li><a href="credits.html">เครดิตภาพ</a></li></ul></div>
          </div>
          <div class="legal">
            <span>© 2026 NOIR CARS — เว็บไซต์ตัวอย่างโดย SOFT Z DIGITAL</span>
            <span>ภาพรถจาก Unsplash · โลโก้แบรนด์เป็นเครื่องหมายการค้าของเจ้าของ · <a href="credits.html">ดูเครดิตทั้งหมด</a></span>
          </div>
        </div>
      </footer>`;
  }

  // Menu, header border on scroll.
  const menu = $('[data-menu]');
  $('[data-menu-open]')?.addEventListener('click', () => {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
  });
  $('[data-menu-close]')?.addEventListener('click', () => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
  });
  $$('[data-menu] a').forEach((a) => a.addEventListener('click', () => menu.classList.remove('open')));
  const siteHeader = $('.site-header');
  const onScroll = () => siteHeader?.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- building blocks ---------- */
  const carCard = (car) => {
    const brand = brandOf(car.brand);
    return `
      <a class="car-card reveal" href="car.html?id=${car.id}">
        <div class="shot">
          <img src="${carImg(car.id)}" alt="${esc(brand.name + ' ' + car.model)}" loading="lazy" width="1600" height="1000" />
          ${car.badge ? `<span class="badge">${esc(car.badge)}</span>` : ''}
        </div>
        <div class="row">
          <div>
            <img class="brand-mini" src="${brand.logo}" alt="${esc(brand.name)}" />
            <h3>${esc(car.model)}</h3>
            <div class="specs"><span>${car.year}</span><span>${baht(car.km)} กม.</span><span>${esc(car.gear.split(' ')[0])}</span></div>
          </div>
          <div class="price"><b>฿${baht(car.price)}</b><small>ผ่อน ฿${baht(monthly(car.price))}/ด.</small></div>
        </div>
      </a>`;
  };

  const brandTile = (brand) => {
    const count = D.cars.filter((car) => car.brand === brand.id).length;
    return `<a class="brand-tile${WIDE_LOGOS.includes(brand.id) ? ' wide' : ''}" href="cars.html?brand=${brand.id}" aria-label="${brand.name} ${count} คัน">
      <img src="${brand.logo}" alt="${esc(brand.name)}" loading="lazy" />
      <span class="count">${count}</span>
    </a>`;
  };

  /* ---------- home ---------- */
  if (page === 'home') {
    $('[data-brands]').innerHTML = D.brands.map(brandTile).join('');
    $('[data-types]').innerHTML = D.types
      .map((type) => {
        const count = D.cars.filter((car) => car.type === type.id).length;
        return `<a class="type-card reveal" href="cars.html?type=${type.id}">
          <img src="${carImg(type.cover)}" alt="${esc(type.name)}" loading="lazy" />
          <div class="meta"><div><b>${type.en}</b><small>${type.name}</small></div><small>${count} คัน</small></div>
        </a>`;
      })
      .join('');
    const featured = ['911', 'gx', 'cx5', 'm5', 'typer', 'cclass'];
    $('[data-featured]').innerHTML = featured.map((id) => carCard(carOf(id))).join('');

    // Search: brand / type / budget → cars.html with the same filters.
    const searchBrand = $('[data-search-brand]');
    const searchType = $('[data-search-type]');
    searchBrand.innerHTML = '<option value="">ทุกแบรนด์</option>' + D.brands.map((b) => `<option value="${b.id}">${b.name}</option>`).join('');
    searchType.innerHTML = '<option value="">ทุกประเภท</option>' + D.types.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
    $('[data-search]').addEventListener('submit', (event) => {
      event.preventDefault();
      const params = new URLSearchParams();
      if (searchBrand.value) params.set('brand', searchBrand.value);
      if (searchType.value) params.set('type', searchType.value);
      const budget = $('[data-search-budget]').value;
      if (budget) params.set('max', budget);
      location.href = 'cars.html' + (params.toString() ? '?' + params : '');
    });

    initCalculator($('[data-calc]'), 1500000);
  }

  /* ---------- finance calculator ---------- */
  function initCalculator(root, startPrice) {
    if (!root) return;
    const price = $('[name="price"]', root);
    const down = $('[name="down"]', root);
    const out = {
      price: $('[data-out="price"]', root),
      down: $('[data-out="down"]', root),
      amount: $('[data-out="amount"]', root),
      loan: $('[data-out="loan"]', root),
    };
    let months = 72;
    price.value = startPrice;
    const update = () => {
      const p = Number(price.value);
      const d = Number(down.value);
      out.price.textContent = '฿' + baht(p);
      out.down.textContent = `${d}% · ฿${baht(Math.round((p * d) / 100))}`;
      out.amount.textContent = '฿' + baht(monthly(p, d, months));
      out.loan.textContent = `ยอดจัด ฿${baht(Math.round(p * (1 - d / 100)))} · ${months} งวด · ดอกเบี้ย 2.79% ต่อปี`;
    };
    [price, down].forEach((input) => input.addEventListener('input', update));
    $$('[data-months]', root).forEach((button) =>
      button.addEventListener('click', () => {
        months = Number(button.dataset.months);
        $$('[data-months]', root).forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        update();
      }),
    );
    update();
  }

  /* ---------- inventory ---------- */
  if (page === 'cars') {
    const params = new URLSearchParams(location.search);
    const state = {
      brand: params.get('brand') || '',
      type: params.get('type') || '',
      max: Number(params.get('max')) || 0,
      sort: 'new',
    };
    const chipsBrand = $('[data-filter-brands]');
    const chipsType = $('[data-filter-types]');
    chipsBrand.innerHTML =
      `<button class="chip" type="button" data-brand="">ทุกแบรนด์</button>` +
      D.brands.map((b) => `<button class="chip" type="button" data-brand="${b.id}" title="${b.name}"><img src="${b.logo}" alt="" />${b.id === 'mercedes' ? 'Benz' : b.name}</button>`).join('');
    chipsType.innerHTML = D.types.map((t) => `<button class="chip" type="button" data-type="${t.id}">${t.en}</button>`).join('');
    const maxSelect = $('[data-filter-max]');
    const sortSelect = $('[data-filter-sort]');
    maxSelect.value = String(state.max || '');

    const render = () => {
      let list = D.cars.filter(
        (car) => (!state.brand || car.brand === state.brand) && (!state.type || car.type === state.type) && (!state.max || car.price <= state.max),
      );
      const sorters = {
        new: (a, b) => b.year - a.year,
        low: (a, b) => a.price - b.price,
        high: (a, b) => b.price - a.price,
        km: (a, b) => a.km - b.km,
      };
      list = list.sort(sorters[state.sort]);
      $('[data-grid]').innerHTML = list.length
        ? list.map(carCard).join('')
        : `<div class="empty" style="grid-column:1/-1"><p class="th-title">ยังไม่มีรถตามเงื่อนไขนี้</p><button class="btn btn-line" type="button" data-reset>ดูรถทั้งหมด</button></div>`;
      $('[data-count]').textContent = list.length;
      $$('[data-brand]', chipsBrand).forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.brand === state.brand)));
      $$('[data-type]', chipsType).forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.type === state.type)));

      // Brand page header: the logo replaces the generic title.
      const brand = brandOf(state.brand);
      $('[data-head]').innerHTML = brand
        ? `<span class="eyebrow">Brand collection</span><div class="brand-head"><img src="${brand.logo}" alt="${brand.name}" /><h1 class="h2">${brand.name}</h1></div>`
        : `<span class="eyebrow">Inventory</span><h1 class="display" style="font-size:clamp(44px,6vw,92px)">The <em>Collection</em></h1>`;
      document.title = (brand ? brand.name + ' — ' : 'รถทั้งหมด — ') + 'NOIR CARS';

      const query = new URLSearchParams();
      if (state.brand) query.set('brand', state.brand);
      if (state.type) query.set('type', state.type);
      if (state.max) query.set('max', state.max);
      history.replaceState(null, '', 'cars.html' + (query.toString() ? '?' + query : ''));
      observeReveal();
    };

    chipsBrand.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-brand]');
      if (!chip) return;
      state.brand = chip.dataset.brand === state.brand ? '' : chip.dataset.brand;
      render();
    });
    chipsType.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-type]');
      if (!chip) return;
      state.type = chip.dataset.type === state.type ? '' : chip.dataset.type;
      render();
    });
    maxSelect.addEventListener('change', () => {
      state.max = Number(maxSelect.value) || 0;
      render();
    });
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      render();
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-reset]')) return;
      Object.assign(state, { brand: '', type: '', max: 0 });
      maxSelect.value = '';
      render();
    });
    render();
  }

  /* ---------- car detail ---------- */
  if (page === 'car') {
    const car = carOf(new URLSearchParams(location.search).get('id')) || D.cars[0];
    const brand = brandOf(car.brand);
    document.title = `${brand.name} ${car.model} ${car.year} — NOIR CARS`;

    // Gallery: real extra photos when we have them, otherwise close-ups cropped from the main photo.
    const shots = [{ src: carImg(car.id), pos: '50% 50%', zoom: 1 }];
    (car.gallery || []).forEach((key) => shots.push({ src: imgFor(key), pos: '50% 50%', zoom: 1 }));
    if (!car.gallery) {
      shots.push({ src: carImg(car.id), pos: '22% 62%', zoom: 1.9 }, { src: carImg(car.id), pos: '78% 58%', zoom: 1.9 }, { src: carImg(car.id), pos: '50% 45%', zoom: 1.45 });
    }
    const credit = D.credits[car.id];

    $('[data-detail]').innerHTML = `
      <div>
        <div class="gallery">
          <div class="main" data-main role="button" tabindex="0" aria-label="ดูภาพขยาย">
            <img src="${shots[0].src}" alt="${esc(brand.name + ' ' + car.model)}" width="1600" height="1000" />
            ${car.badge ? `<span class="detail-badge">${esc(car.badge)}</span>` : ''}
          </div>
          <div class="thumbs" style="grid-template-columns:repeat(${Math.max(shots.length, 4)},minmax(0,1fr))">${shots
            .map(
              (shot, index) =>
                `<button type="button" aria-label="ภาพที่ ${index + 1}" data-shot="${index}" ${index === 0 ? 'aria-current="true"' : ''} style="background-image:url('${shot.src}');background-size:${shot.zoom * 100}%;background-position:${shot.pos}"></button>`,
            )
            .join('')}</div>
        </div>
        <div class="spec-grid">
          <div>${icon.calendar}<small>ปีรถ</small><b>${car.year}</b></div>
          <div>${icon.road}<small>เลขไมล์</small><b>${baht(car.km)} กม.</b></div>
          <div>${icon.gear}<small>เกียร์</small><b>${esc(car.gear)}</b></div>
          <div>${icon.fuel}<small>เชื้อเพลิง</small><b>${esc(car.fuel)}</b></div>
          <div>${icon.engine}<small>เครื่องยนต์</small><b>${esc(car.engine)}</b></div>
          <div>${icon.palette}<small>สี</small><b>${esc(car.color)}</b></div>
        </div>
        <div class="assure">
          <div><b>175</b>จุดตรวจสภาพก่อนขาย พร้อมใบรายงาน</div>
          <div><b>1 ปี</b>รับประกันเครื่องยนต์และเกียร์</div>
          <div><b>7 วัน</b>เปลี่ยนคันได้ ถ้าไม่ถูกใจ</div>
        </div>
        ${credit ? `<p style="margin-top:28px;font-size:12px;color:var(--muted)">ภาพโดย <a style="text-decoration:underline" href="https://unsplash.com/@${credit[1]}" target="_blank" rel="noopener">${esc(credit[0])}</a> บน Unsplash</p>` : ''}
      </div>
      <aside class="summary">
        <img class="brand-mini" src="${brand.logo}" alt="${esc(brand.name)}" />
        <div><span class="eyebrow">${car.year} · ${esc(typeOf(car.type).en)}</span><h1 style="margin-top:14px">${esc(car.model)}</h1></div>
        <div class="price"><b>฿${baht(car.price)}</b><small>ผ่อนเริ่ม ฿${baht(monthly(car.price))}/เดือน · ดาวน์ 25% · 72 งวด</small></div>
        <div class="actions">
          <a class="btn" href="contact.html?car=${car.id}">${icon.calendar.replace('stroke-width', 'stroke="currentColor" stroke-width')}นัดดูรถ / ทดลองขับ</a>
          <a class="btn btn-line" href="https://line.me/" target="_blank" rel="noopener">${icon.line}สอบถามทาง LINE</a>
          <a class="btn btn-line" href="tel:020000000">${icon.phone}02 000 0000</a>
        </div>
      </aside>`;

    // Gallery thumbs + lightbox.
    const main = $('[data-main] img');
    let current = 0;
    const show = (index) => {
      current = (index + shots.length) % shots.length;
      const shot = shots[current];
      main.src = shot.src;
      main.style.objectPosition = shot.pos;
      main.style.transform = `scale(${shot.zoom})`;
      main.style.transformOrigin = shot.pos;
      $$('[data-shot]').forEach((b, i) => b.setAttribute('aria-current', String(i === current)));
    };
    $$('[data-shot]').forEach((button) => button.addEventListener('click', () => show(Number(button.dataset.shot))));
    const box = $('[data-lightbox]');
    const boxImg = $('img', box);
    const openBox = () => {
      boxImg.src = shots[current].src;
      $('.count', box).textContent = `${current + 1} / ${shots.length}`;
      box.classList.add('open');
    };
    $('[data-main]').addEventListener('click', openBox);
    $('[data-main]').addEventListener('keydown', (e) => e.key === 'Enter' && openBox());
    $('.x', box).addEventListener('click', () => box.classList.remove('open'));
    $('.prev', box).addEventListener('click', () => {
      show(current - 1);
      openBox();
    });
    $('.next', box).addEventListener('click', () => {
      show(current + 1);
      openBox();
    });
    addEventListener('keydown', (e) => {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') box.classList.remove('open');
      if (e.key === 'ArrowRight') $('.next', box).click();
      if (e.key === 'ArrowLeft') $('.prev', box).click();
    });

    const similar = D.cars.filter((c) => c.id !== car.id && (c.type === car.type || c.brand === car.brand)).slice(0, 3);
    $('[data-similar]').innerHTML = similar.map(carCard).join('');
    initCalculator($('[data-calc]'), car.price);
  }

  /* ---------- contact ---------- */
  if (page === 'contact') {
    const form = $('[data-form]');
    const carSelect = $('[name="car"]', form);
    carSelect.innerHTML = '<option value="">ยังไม่ได้เลือก</option>' + D.cars.map((c) => `<option value="${c.id}">${brandOf(c.brand).name} ${c.model} ${c.year}</option>`).join('');
    const query = new URLSearchParams(location.search);
    if (query.get('car')) carSelect.value = query.get('car');
    $$('[data-topic]', form).forEach((chip) =>
      chip.addEventListener('click', () => {
        $$('[data-topic]', form).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        $('[name="topic"]', form).value = chip.dataset.topic;
      }),
    );
    // contact.html?topic=sell opens on that tab (the "sell your car" button on the home page).
    const topic = query.get('topic');
    if (topic) $(`[data-topic="${topic}"]`, form)?.click();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      $('.ok', form).classList.add('show');
      form.reset();
    });
  }

  /* ---------- credits ---------- */
  if (page === 'credits') {
    $('[data-credits]').innerHTML = Object.entries(D.credits)
      .map(
        ([key, [name, user, slug]]) =>
          `<li><img src="${imgFor(key)}" alt="" loading="lazy" /><span>ภาพโดย <a href="https://unsplash.com/@${user}" target="_blank" rel="noopener">${esc(name)}</a> · <a href="https://unsplash.com/photos/${slug}" target="_blank" rel="noopener">ดูบน Unsplash</a></span></li>`,
      )
      .join('');
    $('[data-logo-credits]').innerHTML = D.brands
      .map((b) => `<li><img src="${b.logo}" alt="" style="object-fit:contain" /><span>${b.name} — <a href="${D.logoSources[b.id]}" target="_blank" rel="noopener">Wikimedia Commons</a></span></li>`)
      .join('');
  }

  /* ---------- reveal on scroll ---------- */
  function observeReveal() {
    if (!('IntersectionObserver' in window)) return $$('.reveal').forEach((el) => el.classList.add('in'));
    observer ||= new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }),
      { rootMargin: '0px 0px -6% 0px' },
    );
    $$('.reveal:not(.in)').forEach((el) => observer.observe(el));
  }
  observeReveal();
})();
