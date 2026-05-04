/* ============================================================
   ADVERIS ADVISORS LLP — MAIN JS
   All DOM-dependent code runs after 'layoutReady' fires from layout.js
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------------
     0. LENIS — Buttery smooth scroll
  ---------------------------------------------------------------- */
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      lerp: 0.07,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1.0,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      infinite: false,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenis = lenis;          // expose for content-loader hash scrolling
    window.__lenisStop = () => lenis.stop();
    window.__lenisStart = () => lenis.start();
  }

  /* ----------------------------------------------------------------
     INIT — runs after layout.js has injected nav/menu/footer
  ---------------------------------------------------------------- */
  function init() {

    /* 1. DOM REFERENCES (grabbed fresh after injection) */
    const nav        = document.getElementById('mainNav');
    const menuBtn    = document.getElementById('menuBtn');
    const menuOverlay= document.getElementById('menuOverlay');
    const menuClose  = document.getElementById('menuClose');
    const sideDots   = document.getElementById('sideDots');
    const scrollProg = document.getElementById('scrollProg');
    const backToTop  = document.getElementById('backToTop');

    /* 2. BACK TO TOP */
    if (backToTop) {
      backToTop.addEventListener('click', () => {
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.8, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    /* 3. FULLSCREEN MENU */
    function openMenu() {
      if (!menuOverlay) return;
      menuOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      menuBtn && menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn && menuBtn.classList.add('menu-open-state');
      if (window.__lenisStop) window.__lenisStop();
    }
    function closeMenu() {
      if (!menuOverlay) return;
      menuOverlay.classList.remove('open');
      document.body.style.overflow = '';
      menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn && menuBtn.classList.remove('menu-open-state');
      if (window.__lenisStart) window.__lenisStart();
    }

    menuBtn   && menuBtn.addEventListener('click', openMenu);
    menuClose && menuClose.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

    // Global menu closing logic (using delegation on window for maximum reliability)
    window.addEventListener('click', e => {
      // Close if any link inside the menu overlay is clicked
      if (e.target.closest('#menuOverlay a')) {
        closeMenu();
      }
    }, true);

    // Also close on hash change (same-page navigation)
    window.addEventListener('hashchange', () => {
      closeMenu();
    });

    // Fallback: If clicking any link that contains the current page URL + hash
    window.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href')?.includes('#')) {
        // Just in case hashchange doesn't fire (e.g. same hash)
        closeMenu();
      }
    });

    /* 4. MOBILE ACCORDION — menu columns */
    function isMobile() { return window.innerWidth <= 768; }

    function initAccordion() {
      const cols = document.querySelectorAll('.menu-col');
      cols.forEach((col, idx) => {
        const title   = col.querySelector('.menu-col-title');
        const content = col.querySelector('.menu-col-content');
        if (!title || !content) return;

        // avoid re-adding listeners by cloning title
        const newTitle = title.cloneNode(true);
        title.parentNode.replaceChild(newTitle, title);

        const toggle = e => {
          if (!isMobile()) return;
          e.preventDefault();
          const isOpen = col.classList.contains('open');
          cols.forEach(c => {
            c.classList.remove('open');
            const t = c.querySelector('.menu-col-title');
            if (t) t.setAttribute('aria-expanded', 'false');
          });
          if (!isOpen) {
            col.classList.add('open');
            newTitle.setAttribute('aria-expanded', 'true');
          }
        };
        newTitle.addEventListener('click', toggle);
        newTitle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') toggle(e); });

        // First column open by default on mobile
        if (idx === 0) col.classList.add('open');
      });
    }

    // Re-set accordion state whenever menu opens
    menuBtn && menuBtn.addEventListener('click', () => {
      if (isMobile()) {
        document.querySelectorAll('.menu-col').forEach((c, i) => {
          c.classList.toggle('open', i === 0);
          const t = c.querySelector('.menu-col-title');
          if (t) t.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');
        });
      }
    });

    initAccordion();
    window.addEventListener('resize', initAccordion);

    /* 5. SIDE DOTS — homepage only */
    const sections = document.querySelectorAll('[data-section]');
    const dots      = document.querySelectorAll('.s-dot');

    function updateDots() {
      if (!sections.length || !dots.length) return;
      let current = '', currentTheme = 'dark';
      sections.forEach(sec => {
        if (sec.getBoundingClientRect().top <= window.innerHeight * 0.5) {
          current      = sec.getAttribute('data-section');
          currentTheme = sec.getAttribute('data-theme') || 'dark';
        }
      });
      dots.forEach(d => d.classList.toggle('active', d.getAttribute('data-target') === current));
      if (sideDots) sideDots.classList.toggle('on-light', currentTheme === 'light');
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const target = document.querySelector(`[data-section="${dot.getAttribute('data-target')}"]`);
        if (!target) return;
        if (lenis) {
          lenis.scrollTo(target, { offset: -80, duration: 1.6, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    /* 6. SCROLL REVEAL */
    window.initReveal = function () {
      const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      els.forEach(el => { if (!el.classList.contains('visible')) obs.observe(el); });
    };
    window.initReveal();

    /* 7. STAT COUNTER */
    const statNums = document.querySelectorAll('[data-count]');
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    function animateCounter(el) {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const dur = 1600, steps = 60, inc = target / steps;
      let current = 0, step = 0;
      const timer = setInterval(() => {
        step++;
        current = Math.min(Math.round(inc * step), target);
        el.textContent = current + suffix;
        if (step >= steps) clearInterval(timer);
      }, dur / steps);
    }
    statNums.forEach(el => counterObs.observe(el));

    /* 8. NAV BREADCRUMB */
    const crumb = document.getElementById('navPage');
    if (crumb) crumb.textContent = document.body.getAttribute('data-page') || 'Home';

    /* 9. ACTIVE MENU LINK */
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.menu-primary-link, .menu-sub-link').forEach(a => {
      const href = (a.getAttribute('href') || '').split('#')[0]; // strip hash
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        a.style.color = 'var(--saffron)';
        a.style.fontWeight = '600';
      }
    });

    /* 10. CONTACT FORM */
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxCOsWP4EPPjWTpzEH-z_X2_HIbdmOODNmDX1d3qZx5TKddzG9T1UrCzx_gvNCvqM1Uiw/exec";

    document.querySelectorAll('.numeric-only').forEach(input => {
      input.addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });
    });

    if (contactForm) {
      contactForm.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = contactForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        const code = contactForm.querySelector('#countryCode')?.value || '';
        const phone = contactForm.querySelector('#phone')?.value || '';
        const data = {
          formType: 'Contact Enquiry',
          name: contactForm.querySelector('#name')?.value || '',
          email: contactForm.querySelector('#email')?.value || '',
          phone: (code || phone) ? `${code}${phone}` : '',
          company: contactForm.querySelector('#company')?.value || 'N/A',
          service: contactForm.querySelector('#service')?.value || 'N/A',
          message: contactForm.querySelector('#message')?.value || ''
        };
        try {
          await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
          if (formSuccess) formSuccess.classList.add('show');
          contactForm.reset();
        } catch (err) {
          console.error('Submission error:', err);
          alert('Sorry, there was an error. Please email admin@adverisadvisors.com directly.');
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = 'Send Enquiry'; }
        }
      });
    }

    /* 11. CAREERS FORM */
    const careerForm = document.getElementById('careerForm');
    const careerSuccess = document.getElementById('careerSuccess');
    if (careerForm) {
      careerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = careerForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }
        const code = careerForm.querySelector('#cCountryCode')?.value || '';
        const phone = careerForm.querySelector('#cphone')?.value || '';
        const data = {
          formType: 'Career Application',
          name: careerForm.querySelector('#cname')?.value || '',
          email: careerForm.querySelector('#cemail')?.value || '',
          phone: (code || phone) ? `${code}${phone}` : '',
          role: careerForm.querySelector('#crole')?.value || 'N/A',
          message: careerForm.querySelector('#cmsg')?.value || 'No cover note.'
        };
        try {
          await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
          if (careerSuccess) careerSuccess.classList.add('show');
          careerForm.reset();
        } catch (err) {
          console.error('Submission error:', err);
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = 'Submit Application'; }
        }
      });
    }

    /* 12. PAGE TRANSITION */
    const overlay = document.getElementById('pageTransition');
    if (overlay) {
      overlay.classList.remove('show');
      document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('http')) return;
        link.addEventListener('click', e => {
          const url = new URL(link.href, window.location.origin);
          if (url.pathname === window.location.pathname && url.hash) return;
          e.preventDefault();
          overlay.classList.add('show');
          setTimeout(() => { window.location.href = href; }, 500);
        });
      });
    }

    /* 13. AGGREGATE SCROLL HANDLER */
    function onScroll(lenisOrEvent) {
      const y = (lenisOrEvent && lenisOrEvent.scroll !== undefined)
        ? lenisOrEvent.scroll
        : window.scrollY;
      if (nav) nav.classList.toggle('nav--scrolled', y > 60);
      if (scrollProg) {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        scrollProg.style.width = (total > 0 ? (y / total) * 100 : 0) + '%';
      }
      if (backToTop) backToTop.classList.toggle('visible', y > 400);
      updateDots();
    }

    if (lenis) {
      lenis.on('scroll', onScroll);
    } else {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => { onScroll(null); ticking = false; });
          ticking = true;
        }
      }, { passive: true });
    }

    window.addEventListener('resize', () => onScroll(null));
    onScroll(null);

    console.log('%c Adveris Advisors LLP ', 'background:#FF9933;color:#0D1B3E;font-weight:bold;font-size:14px;padding:4px 8px;border-radius:4px;');
  }

  /* Wait for layout.js to finish injecting HTML before init */
  document.addEventListener('layoutReady', init);

  /* ----------------------------------------------------------------
     BFCACHE FIX — Clear overlay & restore state on back/forward
  ---------------------------------------------------------------- */
  window.addEventListener('pageshow', (event) => {
    // 1. Clear Transition Overlay
    const overlay = document.getElementById('pageTransition');
    if (overlay) overlay.classList.remove('show');

    // 2. Restore Scrollability (in case it was locked by menu or transition)
    document.body.style.overflow = '';
    if (window.__lenisStart) window.__lenisStart();

    // 3. Ensure Menu is Closed
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) menuOverlay.classList.remove('open');
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.classList.remove('menu-open-state');
    }
  });

})();
