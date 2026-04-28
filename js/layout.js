/**
 * Shared Layout Manager for Adveris Website
 * Handles Navbar, Menu, and Footer injection across all pages.
 * Dispatches 'layoutReady' event when injection is complete.
 */

const SHARED_NAV = `
  <div class="nav__inner">
    <a href="index.html" class="nav__logo"><span class="logo-name">Adveris</span><span class="logo-tagline">Advisors LLP</span></a>
    <button class="nav__menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="menuOverlay">
      <span>Menu</span>
      <div class="menu-circle" aria-hidden="true">
        <div class="menu-line"></div>
        <div class="menu-line"></div>
        <div class="menu-line"></div>
      </div>
    </button>
  </div>
`;

const SHARED_MENU = `
  <div class="menu-overlay__top">
    <a href="index.html" class="menu-logo nav__logo">
      <span class="logo-name">Adveris</span>
      <span class="logo-tagline">Advisors LLP</span>
    </a>
    <button class="menu-close" id="menuClose" aria-label="Close menu">
      <span>Close</span>
      <div class="menu-close-circle" aria-hidden="true">&times;</div>
    </button>
  </div>
  <div class="menu-body">
    <div class="menu-col" id="mcol-1">
      <div class="menu-col-title" role="button" tabindex="0" aria-expanded="true" aria-controls="mcol-1-content">Navigate</div>
      <div class="menu-col-content" id="mcol-1-content">
        <a href="index.html" class="menu-primary-link">Home</a>
        <a href="about.html" class="menu-primary-link">About Us</a>
        <a href="team.html" class="menu-primary-link">Our Team</a>
        <a href="contact.html" class="menu-primary-link">Contact</a>
      </div>
    </div>
    <div class="menu-col" id="mcol-2">
      <div class="menu-col-title" role="button" tabindex="0" aria-expanded="false" aria-controls="mcol-2-content">Practice Areas</div>
      <div class="menu-col-content" id="mcol-2-content">
        <a href="services.html" class="menu-primary-link"><em>Services</em></a>
        <div class="menu-sub-group">
          <div class="menu-sub-label">What We Do</div>
          <div id="menu-services-list"><!-- populated by content-loader.js from services.json --></div>
        </div>
      </div>
    </div>
    <div class="menu-col" id="mcol-3">
      <div class="menu-col-title" role="button" tabindex="0" aria-expanded="false" aria-controls="mcol-3-content">Explore</div>
      <div class="menu-col-content" id="mcol-3-content">
        <a href="insights.html" class="menu-primary-link">Insights</a>
        <a href="careers.html" class="menu-primary-link">Careers</a>
        <div class="menu-sub-group">
          <div class="menu-sub-label">Contact</div>
          <a href="tel:+919739382704" class="menu-sub-link">+91 97393 82704</a>
          <a href="mailto:admin@adverisadvisors.com" class="menu-sub-link">admin@adverisadvisors.com</a>
          <a href="contact.html" class="menu-sub-link">Bengaluru, Karnataka</a>
        </div>
      </div>
    </div>
  </div>
  <div class="menu-bottom">
    <div class="menu-bottom-left">
      <a href="about.html" class="menu-bottom-link">About the Firm</a>
      <a href="contact.html" class="menu-bottom-link">Get in Touch</a>
      <a href="careers.html" class="menu-bottom-link">Careers</a>
    </div>
    <div class="menu-bottom-right">
      <span style="font-size:0.7rem;color:rgba(255,255,255,0.3);letter-spacing:0.1em;">Bengaluru · Pan India · Since 2024</span>
    </div>
  </div>
`;

const SHARED_FOOTER = `
  <div class="footer-saffron-bar"></div>
  <div class="container" style="padding-top:72px;">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="nav__logo" style="margin-bottom:16px;">
          <span class="logo-name" style="font-family:var(--font-serif);font-size:2.8rem;color:white;">Adveris</span>
          <span class="logo-tagline" style="color:rgba(255,255,255,0.45);font-size:0.95rem;">Advisors LLP</span>
        </div>
        <p>Your Trusted Advisory Partner in India. Expert legal, compliance and company secretary services delivered with integrity.</p>
      </div>
      <div class="footer-col">
        <h4>Practice Areas</h4>
        <div id="footer-services-list"><!-- populated by content-loader.js from services.json --></div>
      </div>
      <div class="footer-col">
        <h4>Firm</h4>
        <a href="about.html">About Us</a>
        <a href="team.html">Our Team</a>
        <a href="insights.html">Insights</a>
        <a href="careers.html">Careers</a>
        <a href="contact.html">Contact</a>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <a href="tel:+919739382704">+91 97393 82704</a>
        <a href="mailto:admin@adverisadvisors.com">admin@adverisadvisors.com</a>
        <a href="https://www.google.com/maps/search/?api=1&query=Om+Chambers+648/A,+4th+Flr+Binnamangala+1st+stg+Indiranagar+Bengaluru+560038" target="_blank" rel="noopener">Om Chambers 648/A, Indiranagar</a>
        <a href="https://www.google.com/maps/search/?api=1&query=Om+Chambers+648/A,+4th+Flr+Binnamangala+1st+stg+Indiranagar+Bengaluru+560038" target="_blank" rel="noopener">Bengaluru — 560038</a>
        <div class="footer-socials">
          <a href="https://www.linkedin.com/company/adveris-advisors-llp/" target="_blank" rel="noopener" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Adveris Advisors LLP. All rights reserved.</span>
      <span>Bengaluru, Karnataka, India · <a href="mailto:admin@adverisadvisors.com">admin@adverisadvisors.com</a></span>
    </div>
  </div>
`;

function initSEO() {
  const pageName = document.body.getAttribute('data-page') || 'Home';
  const siteName = 'Adveris Advisors LLP';
  
  // Set default canonical if missing
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', window.location.href.split('?')[0]);

  // Set default OG tags if missing
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', window.location.href);

  let ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (!ogSiteName) {
    ogSiteName = document.createElement('meta');
    ogSiteName.setAttribute('property', 'og:site_name');
    ogSiteName.setAttribute('content', siteName);
    document.head.appendChild(ogSiteName);
  }
}

function initLayout() {
  const nav = document.getElementById('mainNav');
  const menu = document.getElementById('menuOverlay');
  const footer = document.querySelector('footer');

  if (nav) nav.innerHTML = SHARED_NAV;
  if (menu) menu.innerHTML = SHARED_MENU;
  if (footer) footer.innerHTML = SHARED_FOOTER;

  initSEO();

  // Signal that layout HTML is ready — main.js listens for this
  window.__layoutReady = true;
  document.dispatchEvent(new CustomEvent('layoutReady'));
}

document.addEventListener('DOMContentLoaded', initLayout);
