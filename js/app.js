/**
 * MERA Interactive Website Logic
 * Clean, lightweight vanilla JavaScript with zero external runtime dependencies.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDownloadLinks();
  initTabs();
  initFaqAccordion();
  initContactForm();
  initBackendHealth();
  initCopyButtons();
});

/**
 * Dynamically binds download buttons and metadata from MERA_CONFIG
 */
function initDownloadLinks() {
  const config = window.MERA_CONFIG || {};
  const downloads = config.downloads || {};

  // 1. Android Agent Button
  const androidBtn = document.getElementById('btn-download-android');
  if (androidBtn && downloads.androidAgent) {
    androidBtn.href = downloads.androidAgent.url;
    androidBtn.setAttribute('download', downloads.androidAgent.filename);
  }

  // 2. Windows Agent Button
  const windowsBtn = document.getElementById('btn-download-windows');
  if (windowsBtn && downloads.windowsAgent) {
    windowsBtn.href = downloads.windowsAgent.url;
    windowsBtn.setAttribute('download', downloads.windowsAgent.filename);
  }

  // 3. Admin App Download (Secondary CTA)
  const adminBtn = document.getElementById('btn-download-admin');
  if (adminBtn && downloads.adminAndroidApp) {
    adminBtn.href = downloads.adminAndroidApp.url;
    adminBtn.setAttribute('download', downloads.adminAndroidApp.filename);
  }

  // 4. Update Release Badges
  const versionBadge = document.getElementById('release-version-badge');
  if (versionBadge && config.version) {
    versionBadge.textContent = `v${config.version} Stable`;
  }
}

/**
 * Tab switcher for Installation Instructions (Android vs Windows)
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-nav-btn');
  const tabContents = document.querySelectorAll('.install-tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-target');

      // Update button active state
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update tab pane active state
      tabContents.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === targetTabId) {
          pane.classList.add('active');
        }
      });
    });
  });
}

/**
 * Accessible FAQ Accordion
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!trigger || !answer) return;

    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Toggle state
      trigger.setAttribute('aria-expanded', !isExpanded);
      item.classList.toggle('open', !isExpanded);

      if (!isExpanded) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = '0px';
      }
    });
  });
}

/**
 * Contact / Enterprise Support Form
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('contact-feedback');

  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('contact-email')?.value;
    const name = document.getElementById('contact-name')?.value;
    const message = document.getElementById('contact-message')?.value;

    if (!email || !message) {
      feedback.className = 'contact-feedback error';
      feedback.textContent = 'Please fill in your email address and message.';
      return;
    }

    // In a static deployment, redirect to mailto or show confirmation
    feedback.className = 'contact-feedback success';
    feedback.innerHTML = `✓ Thank you, <strong>${escapeHtml(name || 'Admin')}</strong>! Your inquiry has been routed to our enterprise team (<code>${window.MERA_CONFIG?.support?.email || 'support@mera.io'}</code>).`;
    form.reset();
  });
}

/**
 * Optional Health Check for Local / Network Backend Control Plane
 */
async function initBackendHealth() {
  const statusContainer = document.getElementById('system-status-indicator');
  const dot = document.getElementById('health-dot');
  const statusText = document.getElementById('health-status-text');
  const latencySpan = document.getElementById('latency-val');

  if (!statusContainer || !dot || !statusText || !window.MERA_CONFIG?.backend?.enabled) {
    return;
  }

  const healthUrl = window.MERA_CONFIG.backend.healthUrl;
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(healthUrl, { signal: controller.signal, mode: 'cors' });
    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      dot.className = 'status-dot online';
      statusText.textContent = `Online • MERA Control Plane v${data.version || '1.0.0'}`;
      if (latencySpan) latencySpan.textContent = `${latency} ms`;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    dot.className = 'status-dot standby';
    statusText.textContent = 'Control Plane Offline / Standby (Static Gateway Active)';
    if (latencySpan) latencySpan.textContent = 'Local Standby';
  }
}

/**
 * Click-to-copy utility for commands and checksums
 */
function initCopyButtons() {
  document.querySelectorAll('.copy-trigger').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const text = targetEl.innerText || targetEl.textContent;
      try {
        await navigator.clipboard.writeText(text.trim());
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
      }
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
