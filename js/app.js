/* =========================================================
   BiteView — app.js
   Vanilla ES6 · No dependencies
   Handles: mobile menu, navbar scroll state, scroll reveal,
   smooth anchors, active nav link, button ripple, hero intro
   ========================================================= */

'use strict';

(() => {
  /* -------------------------------------------------------
     Utilities
  ------------------------------------------------------- */

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** rAF-throttled callback — keeps scroll handlers at 60fps */
  const rafThrottle = (fn) => {
    let queued = false;
    return (...args) => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        fn(...args);
      });
    };
  };

  /* =======================================================
     1. MOBILE MENU
  ======================================================= */

  const initMobileMenu = () => {
    const menuBtn  = $('.menu-btn');
    const navLinks = $('#mobile-menu');
    if (!menuBtn || !navLinks) return;

    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

    const openMenu = () => {
      navLinks.classList.add('is-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Close Menu');
    };

    const closeMenu = () => {
      if (!navLinks.classList.contains('is-open')) return;
      navLinks.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open Menu');
    };

    const toggleMenu = () => {
      navLinks.classList.contains('is-open') ? closeMenu() : openMenu();
    };

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close after tapping any link inside the menu
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeMenu();
    });

    // Click / tap outside closes the menu
    document.addEventListener('click', (e) => {
      if (!navLinks.classList.contains('is-open')) return;
      if (navLinks.contains(e.target) || menuBtn.contains(e.target)) return;
      closeMenu();
    });

    // Escape closes and returns focus to the trigger
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        closeMenu();
        menuBtn.focus();
      }
    });

    // Reset state when crossing into desktop layout
    window.addEventListener('resize', rafThrottle(() => {
      if (isDesktop()) closeMenu();
    }), { passive: true });

    return { closeMenu };
  };

  /* =======================================================
     2. NAVBAR SCROLL STATE
     Adds .is-scrolled for stronger glass + shadow
  ======================================================= */

  const initNavbarScroll = () => {
    const navbar = $('.navbar');
    if (!navbar) return;

    const THRESHOLD = 24;
    let scrolled = null;

    const update = () => {
      const next = window.scrollY > THRESHOLD;
      if (next === scrolled) return;             // avoid redundant class writes
      scrolled = next;
      navbar.classList.toggle('is-scrolled', next);

      // Progressive glass strengthening (no CSS file required)
      navbar.style.backdropFilter = next
        ? 'blur(32px) saturate(180%)'
        : '';
      navbar.style.webkitBackdropFilter = navbar.style.backdropFilter;
      navbar.style.boxShadow = next
        ? 'inset 0 1px 0 rgba(255,255,255,.12), 0 18px 54px rgba(0,0,0,.46)'
        : '';
      navbar.style.borderColor = next ? 'rgba(255,255,255,.11)' : '';
    };

    update();
    window.addEventListener('scroll', rafThrottle(update), { passive: true });
  };

  /* =======================================================
     3. SCROLL REVEAL (.reveal → .active)
  ======================================================= */

  const initReveal = () => {
    const items = $$('.reveal');
    if (!items.length) return;

    // No IO support or reduced motion → show everything immediately
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      items.forEach((el) => el.classList.add('active'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('active');
        observer.unobserve(entry.target);       // reveal once, then stop watching
      });
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.12
    });

    items.forEach((el) => observer.observe(el));
  };

  /* =======================================================
     4. SMOOTH ANCHOR SCROLLING
     Accounts for the fixed navbar height
  ======================================================= */

  const initSmoothScroll = (menu) => {
    const navbar = $('.navbar');

    const offsetFor = () => (navbar ? navbar.getBoundingClientRect().height + 26 : 26);

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const hash = link.getAttribute('href');
      if (!hash || hash === '#' || hash.length < 2) return;

      const target = document.getElementById(hash.slice(1));
      if (!target) return;

      e.preventDefault();
      if (menu && menu.closeMenu) menu.closeMenu();

      const top = target.getBoundingClientRect().top + window.scrollY - offsetFor();

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      // Keep the URL shareable without triggering a jump
      if (history.replaceState) history.replaceState(null, '', hash);
    });
  };

  /* =======================================================
     5. ACTIVE NAV LINK ON SCROLL
  ======================================================= */

  const initActiveNav = () => {
    const navAnchors = $$('.nav-links a[href^="#"]');
    if (!navAnchors.length) return;

    const map = new Map();                       // section element → anchor

    navAnchors.forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      const section = id && document.getElementById(id);
      if (section) map.set(section, a);
    });

    if (!map.size || !('IntersectionObserver' in window)) return;

    const setActive = (anchor) => {
      navAnchors.forEach((a) => {
        const on = a === anchor;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };

    const observer = new IntersectionObserver((entries) => {
      // Choose the most visible intersecting section
      const visible = entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible) setActive(map.get(visible.target));
    }, {
      root: null,
      rootMargin: '-35% 0px -50% 0px',
      threshold: [0, 0.25, 0.5, 0.75]
    });

    map.forEach((_, section) => observer.observe(section));
  };

  /* =======================================================
     6. BUTTON RIPPLE
     Injects a short-lived span, cleaned up on animationend
  ======================================================= */

  const initRipple = () => {
    if (prefersReducedMotion) return;

    const SELECTOR = '.primary-btn, .secondary-btn, .card-button, .social-links a';

    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest(SELECTOR);
      if (!btn) return;

      const rect = e.currentTarget === btn ? btn.getBoundingClientRect() : btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;

      const ripple = document.createElement('span');
      ripple.setAttribute('aria-hidden', 'true');

      Object.assign(ripple.style, {
        position: 'absolute',
        top: `${e.clientY - rect.top - size / 2}px`,
        left: `${e.clientX - rect.left - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,.34), rgba(255,255,255,.06) 62%, transparent 72%)',
        opacity: '0',
        pointerEvents: 'none',
        transform: 'scale(0.2)',
        transition: 'transform 620ms cubic-bezier(.16,1,.3,1), opacity 620ms ease-out',
        zIndex: '0'
      });

      // Ensure containment without touching stylesheets
      const computed = getComputedStyle(btn);
      if (computed.position === 'static') btn.style.position = 'relative';
      if (computed.overflow !== 'hidden') btn.style.overflow = 'hidden';

      btn.appendChild(ripple);

      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(1)';
        ripple.style.opacity = '1';
        requestAnimationFrame(() => { ripple.style.opacity = '0'; });
      });

      setTimeout(() => ripple.remove(), 700);
    }, { passive: true });
  };

  /* =======================================================
     7. HERO INTRO
     Flags readiness so CSS entrance animations can run,
     plus a subtle pointer-parallax on the model card
  ======================================================= */

  const initHero = () => {
    const hero = $('.hero');
    if (!hero) return;

    document.body.classList.add('is-ready');
    hero.classList.add('is-ready');

    if (prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) return;

    const card = $('.model-card');
    if (!card) return;

    const MAX = 4;                               // degrees
    let raf = null;

    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          `perspective(1200px) rotateY(${px * MAX}deg) rotateX(${-py * MAX}deg) translateY(-4px)`;
      });
    };

    const onLeave = () => {
      card.style.transform = '';
    };

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
  };

  /* =======================================================
     8. LAZY IMAGE HINTS
     Non-critical images get native lazy loading
  ======================================================= */

  const initLazyImages = () => {
    $$('img').forEach((img, i) => {
      if (!img.hasAttribute('loading')) {
        img.loading = i === 0 ? 'eager' : 'lazy';
      }
      if (!img.hasAttribute('decoding')) img.decoding = 'async';
    });
  };

  /* =======================================================
     BOOTSTRAP — lazy, idle-friendly initialization
  ======================================================= */

  const boot = () => {
    const menu = initMobileMenu();       // critical interactions first
    initNavbarScroll();
    initSmoothScroll(menu);
    initHero();

    const deferred = () => {
      initReveal();
      initActiveNav();
      initRipple();
      initLazyImages();
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(deferred, { timeout: 900 });
    } else {
      setTimeout(deferred, 120);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();