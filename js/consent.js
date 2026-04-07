/* ============================================================
   CONSENT POPUP (Bar Council of India Mandate)
   ============================================================ */
(function() {
  'use strict';

  const CONSENT_KEY = 'adveris_consent_date';

  // Check if consent was already given today
  function hasConsentedToday() {
    const consentDate = localStorage.getItem(CONSENT_KEY);
    const today = new Date().toDateString();
    return consentDate === today;
  }

  // Force scroll prevention even if HTML removed
  let forceScrollPreventionInterval = null;

  function preventScroll() {
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    if (typeof window.__lenisStop === 'function') {
      window.__lenisStop();
    }
  }

  function allowScroll() {
    if (forceScrollPreventionInterval) {
      clearInterval(forceScrollPreventionInterval);
      forceScrollPreventionInterval = null;
    }
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (typeof window.__lenisStart === 'function') {
      window.__lenisStart();
    }
  }

  function injectConsentPopup() {
    // Create the overlay container
    const overlay = document.createElement('div');
    overlay.className = 'consent-overlay';
    overlay.id = 'adverisConsentOverlay';
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');

    // Create popup HTML
    const htmlContent = `
      <div class="consent-card">
        <h2>Disclaimer &amp; Consent</h2>
        
        <p>The Bar Council of India does not permit advertisement or solicitation by advocates in any form or manner.</p>
        
        <p>This website is meant solely for the purpose of providing general information and not for advertising or soliciting any work whether directly or indirectly. By accessing this website, www.adverisadvisors.in, you acknowledge and confirm that you are seeking information relating to Adveris Advisors LLP of your own accord. Further, any content provided in this website should not be construed as legal advice. We disclaim all liability for any consequences of any action taken by the user relying on content provided on the website.</p>
        
        <p>By clicking on the "I Accept" button, the user acknowledges that:</p>
        
        <ul>
          <li>she/he wishes to gain more information about Adveris Advisors LLP;</li>
          <li>there has been no invitation, inducement or advertisement of any sort whatsoever to solicit any work through this website; and</li>
          <li>she/he is aware that our website uses cookies to improve functionality and performance by analysing traffic to the website and she/he agrees to our use of cookies.</li>
        </ul>
        
        <p>To learn more about how we use cookies, please read our <a href="#" class="privacy-link">Privacy Policy</a>.</p>
        
        <div class="consent-actions">
          <button id="adverisConsentBtn" class="consent-btn">I Accept</button>
        </div>
      </div>
    `;

    overlay.innerHTML = htmlContent;
    document.body.appendChild(overlay);

    preventScroll();
    
    // Aggressively prevent scrolling to stop circumvention via devtools
    forceScrollPreventionInterval = setInterval(() => {
      // If the user deleted the node via devtools, recreate it
      if (!document.getElementById('adverisConsentOverlay')) {
        document.body.appendChild(overlay);
      }
      preventScroll();
    }, 100);

    // Accept button logic
    const acceptBtn = document.getElementById('adverisConsentBtn');
    acceptBtn.addEventListener('click', function() {
      // Save today's date in localStorage
      localStorage.setItem(CONSENT_KEY, new Date().toDateString());
      
      // Stop checking for circumvention
      if (forceScrollPreventionInterval) {
        clearInterval(forceScrollPreventionInterval);
        forceScrollPreventionInterval = null;
      }
      
      // Animate out
      overlay.classList.add('hidden');
      allowScroll();
      
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 600);
    });
  }

  // Initialize on load
  function init() {
    if (!hasConsentedToday()) {
      injectConsentPopup();
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
