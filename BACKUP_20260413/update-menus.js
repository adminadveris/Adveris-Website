const fs = require('fs');
const path = require('path');
const dir = __dirname;
const pages = ['index.html','about.html','team.html','services.html','insights.html','careers.html','contact.html'];

// New menu overlay - with menu-col-content wrappers for accordion
const newOverlay = `  <!-- MENU OVERLAY — NKF-style grid / mobile accordion -->
  <div class="menu-overlay" id="menuOverlay" role="dialog" aria-modal="true" aria-label="Navigation menu">
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
      <!-- Col 1: Navigate -->
      <div class="menu-col" id="mcol-1">
        <div class="menu-col-title" role="button" tabindex="0" aria-expanded="true" aria-controls="mcol-1-content">Navigate</div>
        <div class="menu-col-content" id="mcol-1-content">
          <a href="index.html" class="menu-primary-link">Home</a>
          <a href="about.html" class="menu-primary-link">About Us</a>
          <a href="team.html" class="menu-primary-link">Our Team</a>
          <a href="contact.html" class="menu-primary-link">Contact</a>
        </div>
      </div>
      <!-- Col 2: Practice Areas -->
      <div class="menu-col" id="mcol-2">
        <div class="menu-col-title" role="button" tabindex="0" aria-expanded="false" aria-controls="mcol-2-content">Practice Areas</div>
        <div class="menu-col-content" id="mcol-2-content">
          <a href="services.html" class="menu-primary-link"><em>Services</em></a>
          <div class="menu-sub-group">
            <div class="menu-sub-label">What We Do</div>
            <a href="services.html#01" class="menu-sub-link">Corporate Advisory</a>
            <a href="services.html#02" class="menu-sub-link">VC &amp; Private Equity</a>
            <a href="services.html#03" class="menu-sub-link">Mergers &amp; Acquisitions</a>
            <a href="services.html#04" class="menu-sub-link">Loans &amp; Debt Financing</a>
            <a href="services.html#05" class="menu-sub-link">Commercial Contracts</a>
            <a href="services.html#06" class="menu-sub-link">Employment Law</a>
            <a href="services.html#07" class="menu-sub-link">Regulatory Compliance</a>
            <a href="services.html#08" class="menu-sub-link">Due Diligence</a>
            <a href="services.html#09" class="menu-sub-link">Dispute &amp; Pre-Litigation</a>
            <a href="services.html#10" class="menu-sub-link">Business Valuation</a>
            <a href="services.html#11" class="menu-sub-link">Authorities Representation</a>
            <a href="services.html#12" class="menu-sub-link">Bankruptcy &amp; Insolvency</a>
          </div>
        </div>
      </div>
      <!-- Col 3: Explore -->
      <div class="menu-col" id="mcol-3">
        <div class="menu-col-title" role="button" tabindex="0" aria-expanded="false" aria-controls="mcol-3-content">Explore</div>
        <div class="menu-col-content" id="mcol-3-content">
          <a href="insights.html" class="menu-primary-link">Insights</a>
          <a href="careers.html" class="menu-primary-link">Careers</a>
          <div class="menu-sub-group">
            <div class="menu-sub-label">Contact</div>
            <a href="tel:+919739382704" class="menu-sub-link">+91 97393 82704</a>
            <a href="mailto:csashikgswamy@gmail.com" class="menu-sub-link">csashikgswamy@gmail.com</a>
            <a href="contact.html" class="menu-sub-link">Bengaluru, Karnataka</a>
          </div>
        </div>
      </div>
    </div>
    <!-- Bottom bar -->
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
  </div>`;

pages.forEach(p => {
  const fp = path.join(dir, p);
  let content = fs.readFileSync(fp, 'utf8');
  
  // Find old menu overlay and replace
  const startTag = '<div class="menu-overlay"';
  const startIdx = content.indexOf(startTag);
  if (startIdx === -1) { 
    // Try comment variant
    const commentStart = content.indexOf('<!-- MENU OVERLAY');
    if (commentStart > -1) {
      const afterComment = content.indexOf('<div class="menu-overlay"', commentStart);
      if (afterComment > -1) {
        let depth = 0, i = afterComment;
        while (i < content.length) {
          if (content.substring(i, i+4) === '<div') depth++;
          else if (content.substring(i, i+6) === '</div>') { depth--; if (depth === 0) { i += 6; break; } }
          i++;
        }
        content = content.substring(0, commentStart) + newOverlay + '\n' + content.substring(i);
        fs.writeFileSync(fp, content, 'utf8');
        console.log('Updated (with comment): ' + p);
        return;
      }
    }
    console.log('No overlay found: ' + p); return;
  }
  
  // Find the preceding comment if any
  const commentSearch = content.lastIndexOf('<!-- MENU', startIdx);
  const replaceStart = (commentSearch > -1 && startIdx - commentSearch < 200) ? commentSearch : startIdx;
  
  let depth = 0, i = startIdx;
  while (i < content.length) {
    if (content.substring(i, i+4) === '<div') depth++;
    else if (content.substring(i, i+6) === '</div>') { depth--; if (depth === 0) { i += 6; break; } }
    i++;
  }
  
  content = content.substring(0, replaceStart) + newOverlay + '\n' + content.substring(i);
  fs.writeFileSync(fp, content, 'utf8');
  console.log('Updated: ' + p);
});
console.log('All pages updated with accordion menu structure!');
