/**
 * Adveris Content Loader
 * Fetches JSON data and populates dynamic content across all pages.
 */

// Run after layout.js has injected the common elements
const initContent = function () {

  /* ================================================================
     SERVICES — single fetch populates all consumers:
       • servicesGrid     → services.html full grid
       • servicesCarousel → index.html preview
       • footer-services-list → every page footer
     Also handles hash-anchor scroll after dynamic injection.
  ================================================================ */
  const servicesGrid = document.getElementById('servicesGrid');
  const servicesCarousel = document.getElementById('servicesCarousel');
  const footerList = document.getElementById('footer-services-list');
  const menuList = document.getElementById('menu-services-list');

  if (servicesGrid || servicesCarousel || footerList || menuList) {
    fetch('data/services.json?v=' + Date.now())
      .then(r => r.json())
      .then(services => {

        /* Full grid — services.html */
        if (servicesGrid) {
          servicesGrid.innerHTML = services.map(s => `
            <div class="svc-detail-card reveal" id="${s.id}">
              <div class="svc-num">${s.id}</div>
              <h3>${s.title}</h3>
              <ul class="svc-bullets">
                ${s.bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          `).join('');
          if (window.initReveal) window.initReveal();

          /* ── Hash-anchor scroll fix ─────────────────────────────
             The browser tries to scroll to #04 before JS has injected
             the cards. After injection, we do it ourselves.          */
          const handleHashScroll = () => {
            const hash = window.location.hash;
            if (hash) {
              const id = hash.replace('#', '');
              const target = document.getElementById(id);
              if (target) {
                setTimeout(() => {
                  if (window.__lenis) {
                    window.__lenis.scrollTo(target, { offset: -100, duration: 1.2 });
                  } else {
                    const top = target.getBoundingClientRect().top + window.pageYOffset - 100;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }
                }, 100);
              }
            }
          };

          handleHashScroll();
          window.addEventListener('hashchange', handleHashScroll);
        }

        /* Homepage carousel — index.html */
        if (servicesCarousel) {
          servicesCarousel.innerHTML = services.map((s, i) => `
            <div class="svc-card reveal">
              <div style="font-size:2rem;color:var(--saffron);font-family:var(--font-serif);margin-bottom:12px;line-height:1;">${String(i + 1).padStart(2, '0')}</div>
              <h3>${s.title}</h3>
              <p>${s.summary || ''}</p>
              <a href="services.html#${s.id}" class="arrow-link arrow-link-dark">
                <span class="line"></span><span>Learn more</span><span class="arr">&#8594;</span>
              </a>
            </div>
          `).join('');
          if (window.initReveal) window.initReveal();
        }

        /* Footer practice areas — injected on every page */
        if (footerList) {
          footerList.innerHTML = services.map(s =>
            `<a href="services.html#${s.id}">${s.title}</a>`
          ).join('');
        }

        /* Menu Practice Areas sub-links — injected on every page */
        if (menuList) {
          menuList.innerHTML = services.map(s =>
            `<a href="services.html#${s.id}" class="menu-sub-link">${s.title}</a>`
          ).join('');
        }

      })
      .catch(err => console.error('Failed to load services:', err));
  }



  /* ================================================================
     TEAM — single fetch populates all consumers:
       • teamCore        → core partners  (team.html)
       • teamStaff       → staff section  (team.html)
       • teamSpecialised → specialised    (team.html)
       • teamPreview     → homepage preview
     Splits by member.team field: "core" | "staff" | "specialised"
  ================================================================ */
  const teamCore = document.getElementById('teamCore');
  const teamStaff = document.getElementById('teamStaff');
  const teamSpecialised = document.getElementById('teamSpecialised');
  const teamPreview = document.getElementById('teamPreview');

  if (teamCore || teamStaff || teamSpecialised || teamPreview) {
    fetch('data/team.json?v=' + Date.now())
      .then(r => r.json())
      .then(team => {

        const core = team.filter(m => m.team === 'core');
        const staff = team.filter(m => m.team === 'staff');
        const specialised = team.filter(m => m.team === 'specialised');

        /* Helper: render a standard card */
        function memberCard(m) {
          const tagHTML = m.tags
            ? `<div class="team-card__tags">${m.tags.map(t => `<span class="team-tag">${t}</span>`).join('')}</div>`
            : '';
          return `
            <div class="team-card reveal">
              <div class="team-avatar">${m.initial}</div>
              <h3>${m.name}</h3>
              <p class="team-role">${m.role}</p>
              <p class="team-bio">${m.bio[0]}</p>
              ${tagHTML}
            </div>`;
        }

        /* Helper: section header */
        function sectionHeader(label, title) {
          return `
            <div class="team-section-header">
              <p class="sec-label">${label}</p>
              <h2 class="sec-title">${title}</h2>
              <div class="sec-divider"></div>
            </div>`;
        }

        /* ── CORE — hero layout for first, cards for rest ── */
        if (teamCore && core.length) {
          const [first, ...rest] = core;
          const heroHTML = `
            <div class="leader-featured reveal">
              <div class="leader-initial-bg">${first.initial}</div>
              <div class="leader-avatar-wrap">
                <div class="leader-avatar-circle">${first.initial}</div>
                <div class="leader-tags">${(first.tags || []).join(' · ')}</div>
              </div>
              <div class="leader-content">
                <h2>${first.name}</h2>
                <p class="leader-role">${first.role}</p>
                ${first.bio.map(p => `<p class="leader-bio-p">${p}</p>`).join('')}
                ${first.email ? `<a href="mailto:${first.email}" class="arrow-link" style="color:var(--saffron);margin-top:8px;"><span class="line"></span><span>Get in Touch</span><span class="arr">&#8594;</span></a>` : ''}
              </div>
            </div>`;

          const restHTML = rest.length
            ? `<div class="team-grid stagger">${rest.map(memberCard).join('')}</div>`
            : '';

          teamCore.innerHTML = heroHTML + restHTML;
          if (window.initReveal) window.initReveal();
        }

        /* ── STAFF — Professional Team & Consultants ── */
        if (teamStaff && staff.length) {
          teamStaff.innerHTML =
            sectionHeader('Professional Team &amp; Consultants', 'Specialised <em>Expertise</em>') +
            `<div class="team-grid team-grid--centered stagger">${staff.map(memberCard).join('')}</div>`;
          if (window.initReveal) window.initReveal();
        }

        /* ── SPECIALISED — Specialised Expertise ── */
        if (teamSpecialised && specialised.length) {
          teamSpecialised.innerHTML =
            sectionHeader('Specialised Expertise', 'Expert <em>Advisors</em> &amp; Advocates') +
            `<div class="team-grid team-grid--centered stagger">${specialised.map(memberCard).join('')}</div>`;
          if (window.initReveal) window.initReveal();
        }

        /* ── HOMEPAGE PREVIEW — first 3 core members ── */
        if (teamPreview) {
          const previewMembers = core.slice(0, 3);
          teamPreview.innerHTML = previewMembers.map(m => `
            <div class="team-card reveal">
              <div class="team-avatar">${m.initial}</div>
              <h3>${m.name}</h3>
              <p class="team-role">${m.role}</p>
              <p class="team-bio">${m.homepageSummary || m.summary || (m.bio[0].substring(0, 120) + '...')}</p>
            </div>`).join('');
          if (window.initReveal) window.initReveal();
        }

      })
      .catch(err => console.error('Failed to load team:', err));
  }


  /* ================================================================
     INSIGHTS — Full grid (insights.html)
  ================================================================ */
  const insightsGrid = document.getElementById('insightsGrid');
  if (insightsGrid) {
    fetch('data/insights.json?v=' + Date.now())
      .then(r => r.json())
      .then(insights => {
        insightsGrid.innerHTML = insights.map(a => `
          <article class="insight-card reveal" data-cat="${a.catId}">
            <div class="insight-card__top">
              <span class="insight-tag">${a.category}</span>
              <h3>${a.title}</h3>
            </div>
            <div class="insight-card__body">
              <p>${a.summary}</p>
              <div class="insight-meta">
                <span>${a.date}</span>
                <span>${a.readTime}</span>
              </div>
            </div>
          </article>
        `).join('');
        if (window.initReveal) window.initReveal();
      })
      .catch(err => console.error('Failed to load insights:', err));
  }

  /* ================================================================
     INSIGHTS PREVIEW — Homepage (index.html)
  ================================================================ */
  const insightsPreview = document.getElementById('insightsPreview');
  if (insightsPreview) {
    fetch('data/insights.json?v=' + Date.now())
      .then(r => r.json())
      .then(insights => {
        const preview = insights.slice(0, 3);
        insightsPreview.innerHTML = preview.map(a => `
          <article class="insight-card reveal">
            <div class="insight-card__top">
              <span class="insight-tag">${a.category}</span>
              <h3>${a.title}</h3>
            </div>
            <div class="insight-card__body">
              <p>${a.summary.substring(0, 160)}...</p>
              <div class="insight-meta">
                <span>${a.date}</span>
                <a href="insights.html" class="arrow-link" style="font-size:0.68rem;">
                  <span class="line" style="width:24px;"></span><span>Read</span><span class="arr">&#8594;</span>
                </a>
              </div>
            </div>
          </article>
        `).join('');
        if (window.initReveal) window.initReveal();
      })
      .catch(err => console.error('Failed to load insights preview:', err));
  }

  /* ================================================================
     TESTIMONIALS — Homepage (index.html)
  ================================================================ */
  const tGridContainer = document.getElementById('t-grid-container');
  if (tGridContainer) {
    fetch('data/testimonials.json?v=' + Date.now())
      .then(r => r.json())
      .then(data => {
        if (window.initTestimonials) window.initTestimonials(data);
      })
      .catch(err => console.error('Failed to load testimonials:', err));
  }

};

if (window.__layoutReady) {
  initContent();
} else {
  document.addEventListener('layoutReady', initContent);
}
