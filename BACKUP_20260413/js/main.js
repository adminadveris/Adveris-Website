/* ============================================================
   ADVERIS ADVISORS LLP — MAIN JS
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------------
     0. LENIS — Buttery smooth scroll (same feel as NKF)
  ---------------------------------------------------------------- */
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      // lerp controls inertia — 0.07 = very smooth/weighted, like NKF
      // Lower = more lag/momentum. 0.05-0.08 is the premium sweet spot.
      lerp: 0.07,
      smoothWheel: true,
      syncTouch: false,          // keep native feel on mobile touch
      wheelMultiplier: 1.0,      // scroll speed multiplier
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      infinite: false,
    });

    // Drive Lenis on every animation frame
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Stop/start scroll when menu opens/closes
    window.__lenisStop = () => lenis.stop();
    window.__lenisStart = () => lenis.start();
  }

  /* ----------------------------------------------------------------
     1. DOM REFERENCES
  ---------------------------------------------------------------- */
  const nav = document.getElementById('mainNav');
  const menuBtn = document.getElementById('menuBtn');
  const menuOverlay = document.getElementById('menuOverlay');
  const menuClose = document.getElementById('menuClose');
  const sideDots = document.getElementById('sideDots');
  const scrollProg = document.getElementById('scrollProg');
  const backToTop = document.getElementById('backToTop');

  /* ----------------------------------------------------------------
     2. NAV — Scroll state
  ---------------------------------------------------------------- */
  function handleNavScroll() {
    if (!nav) return;
    if (window.scrollY > 60) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  /* ----------------------------------------------------------------
     3. SCROLL PROGRESS BAR
  ---------------------------------------------------------------- */
  function updateScrollProgress() {
    if (!scrollProg) return;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    scrollProg.style.width = pct + '%';
  }

  /* ----------------------------------------------------------------
     4. BACK TO TOP
  ---------------------------------------------------------------- */
  function handleBackToTop() {
    if (!backToTop) return;
    if (window.scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.8, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* ----------------------------------------------------------------
     5. FULLSCREEN MENU
  ---------------------------------------------------------------- */
  function openMenu() {
    if (!menuOverlay) return;
    menuOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    menuBtn && menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn && menuBtn.classList.add('menu-open-state');
  }
  function closeMenu() {
    if (!menuOverlay) return;
    menuOverlay.classList.remove('open');
    document.body.style.overflow = '';
    menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn && menuBtn.classList.remove('menu-open-state');
  }

  menuBtn && menuBtn.addEventListener('click', () => { openMenu(); if (window.__lenisStop) window.__lenisStop(); });
  menuClose && menuClose.addEventListener('click', () => { closeMenu(); if (window.__lenisStart) window.__lenisStart(); });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); if (window.__lenisStart) window.__lenisStart(); }
  });

  // Close when clicking any menu link
  if (menuOverlay) {
    menuOverlay.querySelectorAll('a.menu-primary-link, a.menu-sub-link, a.menu-bottom-link').forEach(a => {
      a.addEventListener('click', () => { closeMenu(); });
    });
  }

  /* ----------------------------------------------------------------
     5b. MOBILE ACCORDION — Menu columns
  ---------------------------------------------------------------- */
  function isMobile() { return window.innerWidth <= 768; }

  function initAccordion() {
    const cols = document.querySelectorAll('.menu-col');
    cols.forEach((col, idx) => {
      const title = col.querySelector('.menu-col-title');
      const content = col.querySelector('.menu-col-content');
      if (!title || !content) return;

      // On desktop: always show content; remove open class
      // On mobile: accordion behaviour
      const toggle = (e) => {
        if (!isMobile()) return;
        e.preventDefault();
        const isOpen = col.classList.contains('open');
        // Close all others
        cols.forEach(c => {
          c.classList.remove('open');
          const t = c.querySelector('.menu-col-title');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          col.classList.add('open');
          title.setAttribute('aria-expanded', 'true');
        }
      };

      title.addEventListener('click', toggle);
      title.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') toggle(e);
      });

      // Open first column by default on mobile when menu opens
      if (idx === 0) col.classList.add('open');
    });
  }

  // Re-init accordion state when menu opens
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (isMobile()) {
        const cols = document.querySelectorAll('.menu-col');
        cols.forEach((c, i) => {
          c.classList.toggle('open', i === 0);
          const t = c.querySelector('.menu-col-title');
          if (t) t.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');
        });
      }
    });
  }

  initAccordion();
  window.addEventListener('resize', initAccordion);

  /* ----------------------------------------------------------------
     6. SIDE DOTS — Adaptive color tracking (homepage only)
  ---------------------------------------------------------------- */
  const sections = document.querySelectorAll('[data-section]');
  const dots = document.querySelectorAll('.s-dot');

  function updateDots() {
    if (!sections.length || !dots.length) return;
    let current = '';
    let currentTheme = 'dark'; // default hero is dark

    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= window.innerHeight * 0.5) {
        current = sec.getAttribute('data-section');
        currentTheme = sec.getAttribute('data-theme') || 'dark';
      }
    });

    // Update active dot
    dots.forEach(d => {
      d.classList.toggle('active', d.getAttribute('data-target') === current);
    });

    // Switch dot colors based on section background
    if (sideDots) {
      sideDots.classList.toggle('on-light', currentTheme === 'light');
    }
  }

  // Dot click → smooth scroll via Lenis
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = document.querySelector('[data-section="' + dot.getAttribute('data-target') + '"]');
      if (!target) return;
      if (lenis) {
        lenis.scrollTo(target, {
          offset: -80, duration: 1.6,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ----------------------------------------------------------------
     7. SCROLL REVEAL — IntersectionObserver
  ---------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ----------------------------------------------------------------
     8. STAT COUNTER ANIMATION
  ---------------------------------------------------------------- */
  const statNums = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const dur = 1600;
    const steps = 60;
    const inc = target / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(inc * step), target);
      el.textContent = current + suffix;
      if (step >= steps) clearInterval(timer);
    }, dur / steps);
  }

  statNums.forEach(el => counterObserver.observe(el));

  /* ----------------------------------------------------------------
     9. NAV BREADCRUMB — show current page
  ---------------------------------------------------------------- */
  const crumb = document.getElementById('navPage');
  if (crumb) {
    // value is set via data attribute on body
    const page = document.body.getAttribute('data-page') || 'Home';
    crumb.textContent = page;
  }

  /* ----------------------------------------------------------------
     10. ACTIVE MENU LINK HIGHLIGHT
  ---------------------------------------------------------------- */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu-primary-link, .menu-sub-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      a.style.color = 'var(--saffron)';
      a.style.fontWeight = '600';
    }
  });

  /* ----------------------------------------------------------------
     11. CONTACT FORM — Silent Background Submit (powered by Google Apps Script)
  ---------------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  // PASTE YOUR GOOGLE SCRIPT URL HERE
  // PASTE YOUR GOOGLE SCRIPT URL HERE
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxCOsWP4EPPjWTpzEH-z_X2_HIbdmOODNmDX1d3qZx5TKddzG9T1UrCzx_gvNCvqM1Uiw/exec";

  // Numeric-only validation helper
  document.querySelectorAll('.numeric-only').forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  });

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      const code = contactForm.querySelector('#countryCode')?.value || '';
      const phone = contactForm.querySelector('#phone')?.value || '';
      const fullPhone = (code || phone) ? `${code}${phone}` : '';

      const data = {
        formType: 'Contact Enquiry',
        name: contactForm.querySelector('#name')?.value || '',
        email: contactForm.querySelector('#email')?.value || '',
        phone: fullPhone,
        company: contactForm.querySelector('#company')?.value || 'N/A',
        service: contactForm.querySelector('#service')?.value || 'N/A',
        message: contactForm.querySelector('#message')?.value || ''
      };

      console.log('Sending Contact Data:', data);

      try {
        // If no script URL is provided, stay in testing mode
        if (SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_URL_HERE") {
          console.warn("No Google Script URL provided. Still using mailto fallback.");
          const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\nService: ${data.service}\n\n${data.message}`);
          window.open(`mailto:csashikgswamy@gmail.com?cc=kishorebt11@gmail.com&subject=Enquiry from ${encodeURIComponent(data.name)}&body=${body}`);
        } else {
          // Actual Silent API Call
          await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data),
          });
        }

        if (formSuccess) formSuccess.classList.add('show');
        contactForm.reset();
      } catch (error) {
        console.error("Submission error:", error);
        alert("Sorry, there was an error sending your enquiry. Please try again or contact us via email.");
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Send Enquiry'; }
      }
    });
  }

  /* ----------------------------------------------------------------
     12. CAREERS FORM — Silent Background Submit
  ---------------------------------------------------------------- */
  const careerForm = document.getElementById('careerForm');
  const careerSuccess = document.getElementById('careerSuccess');

  if (careerForm) {
    careerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = careerForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

      const code = careerForm.querySelector('#cCountryCode')?.value || '';
      const phone = careerForm.querySelector('#cphone')?.value || '';
      const fullPhone = (code || phone) ? `${code}${phone}` : '';

      const data = {
        formType: 'Career Application',
        name: careerForm.querySelector('#cname')?.value || '',
        email: careerForm.querySelector('#cemail')?.value || '',
        phone: fullPhone,
        role: careerForm.querySelector('#crole')?.value || 'N/A',
        message: careerForm.querySelector('#cmsg')?.value || 'No cover note provided.'
      };

      console.log('Sending Career Data:', data);

      try {
        if (SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_URL_HERE") {
          const body = encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\nApplying for: ${data.role}`);
          window.open(`mailto:csashikgswamy@gmail.com?cc=kishorebt11@gmail.com&subject=Job Application - ${encodeURIComponent(data.role)}&body=${body}`);
        } else {
          await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data),
          });
        }

        if (careerSuccess) careerSuccess.classList.add('show');
        careerForm.reset();
      } catch (error) {
        console.error("Submission error:", error);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Submit Application'; }
      }
    });
  }

  /* ----------------------------------------------------------------
     13. PAGE TRANSITION OVERLAY
  ---------------------------------------------------------------- */
  const overlay = document.getElementById('pageTransition');
  if (overlay) {
    // Fade in on load
    overlay.classList.remove('show');
    // Fade out before navigating
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('http')) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        overlay.classList.add('show');
        setTimeout(() => { window.location.href = href; }, 500);
      });
    });
  }

  /* ----------------------------------------------------------------
     14. AGGREGATE SCROLL HANDLER
  ---------------------------------------------------------------- */
  function onScroll(lenisOrEvent) {
    // Lenis 1.1.x emits the Lenis instance; fallback uses { scroll: y }
    const y = (lenisOrEvent && lenisOrEvent.scroll !== undefined)
      ? lenisOrEvent.scroll
      : (lenisOrEvent && lenisOrEvent.scrollY !== undefined)
        ? lenisOrEvent.scrollY
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
    lenis.on('scroll', onScroll);  // Lenis passes its own instance
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
  onScroll(null); // init

  console.log('%c Adveris Advisors LLP ', 'background:#FF9933;color:#0D1B3E;font-weight:bold;font-size:14px;padding:4px 8px;border-radius:4px;');
  console.log('%c Crafted with precision. Built for scale. ', 'color:#FF9933;font-size:11px;');

})();
