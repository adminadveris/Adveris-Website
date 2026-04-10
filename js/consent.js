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
        
        <div class="consent-body">
          <div class="consent-col">
            <p><strong>The Bar Council of India does not permit advertisement or solicitation by advocates in any form or manner.</strong></p>
            <p>This website is intended solely for the purpose of providing general information and does not constitute advertising or solicitation of any work, whether directly or indirectly. Adveris Advisors LLP operates strictly as an advisory firm, and the information made available herein is limited to general guidance on legal and compliance matters.</p>
            <p>By accessing this website, <a href="https://www.adverisadvisors.in" style="color:inherit;text-decoration:none;font-weight:600;">www.adverisadvisors.in</a>, you acknowledge and confirm that you are seeking information relating to Adveris Advisors LLP on your own accord. The content provided on this website is for informational purposes only and shall not be construed as legal advice or a substitute for professional consultation. The Firm disclaims all liability for any actions taken or not taken based on the content available on this website.</p>
          </div>
          <div class="consent-col">
            <p>By clicking on the “I Accept” button, the user expressly acknowledges that:</p>
            <ul>
              <li>he/she intends to obtain general information about Adveris Advisors LLP;</li>
              <li>there has been no form of solicitation, advertisement, or inducement by the Firm to secure any work through this website;</li>
              <li>he/she understands that the Firm functions in an advisory capacity; and</li>
              <li>he/she is aware that the website uses cookies to enhance functionality and performance by analysing website traffic and consents to such use.</li>
            </ul>
            <p>For further details on the use of cookies, users are advised to refer to the <a href="privacy.html" class="privacy-link">Privacy Policy</a>.</p>
            <p style="font-size: 0.75rem; color: rgba(13, 27, 62, 0.6); margin-top: 10px;">The Firm shall not be liable for any consequences arising from reliance on the information or materials available on this website. Users seeking legal or professional assistance are advised to obtain independent advice specific to their facts and circumstances.</p>
            <p style="font-size: 0.75rem; color: rgba(13, 27, 62, 0.6); border-top: 1px solid rgba(13,27,62,0.1); padding-top: 10px; margin-top: 10px;">All content on this website is the intellectual property of the Firm and shall not be reproduced, distributed, or used without prior written consent of Adveris Advisors LLP.</p>
          </div>
        </div>
        
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
    console.log("BCI Consent: Initializing...");
    
    // Safety check: ensure body exists
    if (!document.body) {
      console.log("BCI Consent: Body not found, retrying in 100ms...");
      setTimeout(init, 100);
      return;
    }

    if (!hasConsentedToday()) {
      console.log("BCI Consent: Injecting popup...");
      injectConsentPopup();
    } else {
      console.log("BCI Consent: Already consented today.");
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure other UI scripts don't conflict
    setTimeout(init, 50);
  }

})();
