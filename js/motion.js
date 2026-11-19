/*
  NOIR CARS — motion, ported from the SOFT Z site.

  Scroll-linked effects are "tweens": the scroll handler only sets a target, and one shared rAF loop eases each
  value toward it, so a mouse wheel's 100px jumps turn into smooth motion. Everything here is decoration: with
  reduced motion (unless ?motion=1 was used) the page stays still and fully readable.
*/
(function () {
  'use strict';

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches && !root.classList.contains('force-motion');
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = matchMedia('(min-width: 900px)');
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ---------- tween engine ---------- */
  const tweens = [];
  let running = false;
  let last = 0;
  const EASE_PER_FRAME = 0.12;

  function tick(now) {
    const dt = last ? Math.min(64, now - last) : 16.7;
    last = now;
    const k = 1 - Math.pow(1 - EASE_PER_FRAME, dt / 16.7);
    let moving = false;
    for (const t of tweens) {
      const d = t.target - t.value;
      if (d === 0) continue;
      if (Math.abs(d) <= t.eps) t.value = t.target;
      else {
        t.value += d * k;
        moving = true;
      }
      t.apply(t.value);
    }
    if (moving) requestAnimationFrame(tick);
    else {
      running = false;
      last = 0;
    }
  }

  function tween(apply, eps = 0.0005) {
    const t = { target: 0, value: 0, eps, ready: false, apply };
    tweens.push(t);
    return (target) => {
      t.target = target;
      if (!t.ready) {
        t.ready = true;
        t.value = target;
        apply(target);
        return;
      }
      if (!running && t.value !== target) {
        running = true;
        requestAnimationFrame(tick);
      }
    };
  }

  const effects = [];
  let queued = false;
  const runEffects = () => {
    queued = false;
    effects.forEach((fn) => fn());
  };
  const onScroll = (fn) => {
    effects.push(fn);
    fn();
  };
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(runEffects);
  }, { passive: true });
  addEventListener('resize', runEffects);

  /* ---------- header: hide while scrolling down, back on the way up ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    let anchor = scrollY;
    onScroll(() => {
      const y = Math.max(0, scrollY);
      if (y < 120 || document.querySelector('.mobile-menu.open')) {
        header.classList.remove('hide');
        anchor = y;
        return;
      }
      if (y - anchor > 60) {
        header.classList.add('hide');
        anchor = y;
      } else if (anchor - y > 30) {
        header.classList.remove('hide');
        anchor = y;
      }
    });
  }

  if (reduced) {
    $$('[data-split]').forEach((el) => el.classList.add('is-static'));
    return;
  }
  root.classList.add('motion');

  /* ---------- headlines: each line slides up out of a mask ---------- */
  $$('.display, .h2').forEach((heading) => {
    const lines = heading.innerHTML.split(/<br\s*\/?>/i);
    heading.innerHTML = lines.map((line, i) => `<span class="line-mask"><span style="transition-delay:${i * 0.09}s">${line.trim()}</span></span>`).join('');
    heading.classList.add('lines');
  });
  const lineObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('lines-in');
        lineObserver.unobserve(entry.target);
      }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  $$('.lines').forEach((el) => lineObserver.observe(el));

  /* ---------- cards and tiles come in one after another ---------- */
  const staggerGroups = () =>
    $$('.cars, .types, .reviews, .steps, .brands').forEach((group) =>
      [...group.children].forEach((child, i) => (child.style.transitionDelay = `${(i % 6) * 0.07}s`)),
    );
  staggerGroups();
  new MutationObserver(staggerGroups).observe(document.body, { childList: true, subtree: true });

  /* ---------- numbers count up when they come into view ---------- */
  const countObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);
        const el = entry.target;
        const end = Number(el.dataset.count);
        const start = performance.now();
        const step = (now) => {
          const t = clamp01((now - start) / 1600);
          el.textContent = Math.round(end * easeOut(t)).toLocaleString('th-TH');
          if (t < 1) requestAnimationFrame(step);
        };
        el.textContent = '0';
        requestAnimationFrame(step);
      }),
    { threshold: 0.6 },
  );
  $$('[data-count]').forEach((el) => countObserver.observe(el));

  /* ---------- hero photo: settles and drifts up a little as the page leaves it ---------- */
  const heroImg = document.querySelector('.hero-figure img');
  if (heroImg) {
    heroImg.style.animation = 'none';
    const set = tween((p) => (heroImg.style.transform = `translateY(${(p * 8).toFixed(2)}%) scale(${(1.06 - 0.06 * p).toFixed(4)})`));
    onScroll(() => set(clamp01(scrollY / (innerHeight * 0.9))));
  }

  /* ---------- showcase: the photo grows from an inset to the full width ---------- */
  $$('[data-grow]').forEach((el) => {
    const img = el.querySelector('img');
    const set = tween((p) => {
      el.style.clipPath = `inset(0 ${(1 - p) * 18}% round ${(1 - p) * 4}px)`;
      img.style.transform = `scale(${(1.14 - 0.14 * p).toFixed(4)})`;
    });
    onScroll(() => {
      const top = el.getBoundingClientRect().top;
      set(clamp01((innerHeight - top) / (innerHeight * 0.85)));
    });
  });

  /* ---------- split gallery: base pair stays; next photos fade in by halves; the last closes as a frame ---------- */
  $$('[data-split]').forEach((gallery) => {
    const steps = $$('figure:not([data-slot$="base"])', gallery).map((figure) => ({
      figure,
      img: figure.querySelector('img'),
      final: figure.dataset.slot === 'final',
    }));
    gallery.style.setProperty('--steps', steps.length);
    const bases = $$('figure[data-slot$="base"] img', gallery);
    const set = tween((p) => {
      const baseScale = 1.08 - 0.08 * clamp01(p / 0.25);
      bases.forEach((img) => (img.style.transform = `scale(${baseScale.toFixed(4)})`));
      const played = clamp01((p - 0.06) / 0.76) * steps.length;
      steps.forEach(({ figure, img, final }, i) => {
        const t = easeOut(clamp01(played - i));
        figure.style.opacity = t.toFixed(3);
        if (final) figure.style.transform = `scale(${(0.84 + 0.16 * t).toFixed(4)})`;
        else img.style.transform = `scale(${(1.08 - 0.08 * t).toFixed(4)})`;
      });
    });
    onScroll(() => {
      if (!wide.matches) return;
      const b = gallery.getBoundingClientRect();
      const travel = b.height - innerHeight;
      if (travel > 0) set(clamp01(-b.top / travel));
    });
  });

  /* ---------- cursor: border light (like the SOFT Z nav) and car photos drifting toward the pointer ---------- */
  if (canHover) {
    const GLOW = '.brand-tile, .search, .review, .calc-result, .car-card .shot, .type-card, .chip, .spec-grid > div';
    document.addEventListener(
      'pointermove',
      (event) => {
        const host = event.target.closest?.(GLOW);
        if (!host) return;
        const b = host.getBoundingClientRect();
        host.style.setProperty('--mx', `${event.clientX - b.left}px`);
        host.style.setProperty('--my', `${event.clientY - b.top}px`);
        if (host.matches('.car-card .shot, .type-card')) {
          host.style.setProperty('--px', ((event.clientX - b.left) / b.width - 0.5).toFixed(3));
          host.style.setProperty('--py', ((event.clientY - b.top) / b.height - 0.5).toFixed(3));
        }
      },
      { passive: true },
    );
    document.addEventListener('pointerout', (event) => {
      const host = event.target.closest?.('.car-card .shot, .type-card');
      if (host && !host.contains(event.relatedTarget)) {
        host.style.removeProperty('--px');
        host.style.removeProperty('--py');
      }
    });
  }
})();
