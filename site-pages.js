const WA_URL = 'https://wa.me/27673377523';

/* HotKup lead tracking */
function buildHotkupPayload(form) {
  const payload = new URLSearchParams();
  payload.set('formId', form.id || '');
  payload.set('formTitle', form.querySelector('h3')?.textContent?.trim() || document.title || 'Website form');
  payload.set('pageUrl', window.location.href);
  payload.set('submittedAt', new Date().toISOString());

  form.querySelectorAll('input, select, textarea').forEach(control => {
    const type = (control.getAttribute('type') || '').toLowerCase();
    if (type === 'submit' || type === 'button' || !control.name) return;
    payload.set(control.name, control.value.trim());
  });

  return payload;
}

function buildHotkupUrl(trackingUrl, form) {
  if (!form) return trackingUrl;

  try {
    const url = new URL(trackingUrl, window.location.href);
    buildHotkupPayload(form).forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  } catch (_) {
    return trackingUrl;
  }
}

function fireHotkupTracking(trackingUrl, form) {
  try {
    const iframe = document.createElement('iframe');
    iframe.src = buildHotkupUrl(trackingUrl, form);
    iframe.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;border:none;';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    document.body.appendChild(iframe);
    // Clean up after the tracking pixel has loaded
    setTimeout(() => { try { iframe.remove(); } catch (_) {} }, 10000);
  } catch (_) {
    // Tracking should never break the main flow
  }
}

function initMobileMenu() {
  const nav = document.querySelector('.nav');
  if (!nav || document.querySelector('.mobile-menu-toggle')) return;
  const menuLinks = [
    ...nav.querySelectorAll('.nav-links a'),
    ...nav.querySelectorAll('.nsi,.ncta')
  ].filter(Boolean);
  const uniqueLinks = [];
  const seen = new Set();
  menuLinks.forEach(link => {
    const href = link.getAttribute('href') || 'toggle';
    const key = `${link.textContent.trim()}|${href}`;
    if (seen.has(key) || (link.tagName === 'A' && !link.getAttribute('href'))) return;
    seen.add(key);
    uniqueLinks.push(link);
  });
  const toggle = document.createElement('button');
  const iconMenu = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`;
  const iconClose = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

  toggle.type = 'button';
  toggle.className = 'mobile-menu-toggle';
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = iconMenu;
  const panel = document.createElement('div');
  panel.className = 'mobile-menu-panel';
  panel.setAttribute('aria-label', 'Mobile menu');
  uniqueLinks.forEach(link => {
    const clone = link.cloneNode(true);
    clone.addEventListener('click', () => {
      if (!clone.hasAttribute('data-theme-toggle')) {
        document.body.classList.remove('mobile-menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = iconMenu;
      }
    });
    panel.appendChild(clone);
  });
  toggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('mobile-menu-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.innerHTML = isOpen ? iconClose : iconMenu;
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.body.classList.remove('mobile-menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = iconMenu;
  });
  nav.appendChild(toggle);
  document.body.appendChild(panel);
}

initMobileMenu();

if (!document.querySelector('.theme-floating')) {
  const floatingToggle = document.createElement('button');
  floatingToggle.type = 'button';
  floatingToggle.className = 'theme-toggle theme-floating';
  floatingToggle.setAttribute('data-theme-toggle', '');
  floatingToggle.setAttribute('aria-label', 'Switch to dark mode');
  document.body.appendChild(floatingToggle);
}

const themeToggles = document.querySelectorAll('[data-theme-toggle]');

const iconLight = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
const iconDark = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  themeToggles.forEach(toggle => {
    toggle.innerHTML = isDark ? iconLight : iconDark;
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

applyTheme(localStorage.getItem('mymbaboard-theme') || 'light');
themeToggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('mymbaboard-theme', nextTheme);
    applyTheme(nextTheme);
  });
});

function getFieldLabel(control) {
  const field = control.closest('.field');
  const label = field?.querySelector('label')?.textContent || control.name || control.placeholder || '';
  return label.replace('*', '').trim();
}

function buildWhatsAppMessage(form) {
  const title = form.dataset.whatsappIntent || form.querySelector('h3')?.textContent?.trim() || 'Website enquiry';
  const lines = [title, '', 'Details:'];

  form.querySelectorAll('input, select, textarea').forEach(control => {
    const type = (control.getAttribute('type') || '').toLowerCase();
    if (type === 'hidden' || type === 'submit' || type === 'button') return;

    const value = control.value.trim();
    if (!value) return;

    const label = getFieldLabel(control);
    if (label) lines.push(`${label}: ${value}`);
  });

  return lines.join('\n');
}

function showWhatsAppSuccess(form, url) {
  const success = form.querySelector('.success');
  if (!success) return;

  success.textContent = 'Your details are ready to send on WhatsApp. ';
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Continue on WhatsApp';
  success.appendChild(link);
  success.classList.add('show');
}

document.querySelectorAll('form[data-success], form[data-whatsapp-form]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();

    if (form.hasAttribute('data-whatsapp-form')) {
      const whatsappUrl = `${WA_URL}?text=${encodeURIComponent(buildWhatsAppMessage(form))}`;
      showWhatsAppSuccess(form, whatsappUrl);
      window.open(whatsappUrl, '_blank', 'noopener');

      // Fire HotKup lead tracking if configured on this form
      const hotkupUrl = form.dataset.hotkupTrack;
      if (hotkupUrl) fireHotkupTracking(hotkupUrl, form);

      return;
    }

    // Standard form submission — fire HotKup tracking and show success
    const hotkupUrl = form.dataset.hotkupTrack;
    if (hotkupUrl) fireHotkupTracking(hotkupUrl, form);

    const success = form.querySelector('.success');
    if (success) {
      success.textContent = 'Thank you! We\u2019ve received your message and will get back to you shortly.';
      success.classList.add('show');
    }
    form.reset();
  });
});

const messages = document.querySelector('[data-oracle-messages]');
const oracleForm = document.querySelector('[data-oracle-form]');
const oracleInput = document.querySelector('[data-oracle-input]');
const oracleStatus = document.querySelector('[data-oracle-status]');
const oracleHandoff = document.querySelector('[data-oracle-handoff]');
const oracleHandoffLink = document.querySelector('[data-oracle-handoff-link]');
const oracleSubmit = oracleForm?.querySelector('button[type="submit"]');
const hasEmbeddedOracle = Boolean(messages && oracleForm && oracleInput && oracleStatus);
const oracleState = {
  busy: false,
};

function addMessage(text, type) {
  if (!messages) return;
  const msg = document.createElement('div');
  msg.className = `msg ${type}`;
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  return msg;
}

function setOracleStatus(text) {
  if (!oracleStatus) return;
  oracleStatus.textContent = text || '';
}

function setOracleBusy(busy) {
  oracleState.busy = busy;
  if (oracleInput) oracleInput.disabled = busy;
  if (oracleSubmit) oracleSubmit.disabled = busy;
  if (oracleSubmit) oracleSubmit.textContent = busy ? 'Thinking...' : 'Ask';
}

function buildOracleWhatsAppUrl(question) {
  const prompt = question
    ? `I used The Oracle and need more help with: ${question}`
    : 'I used The Oracle and need more help.';
  return `${WA_URL}?text=${encodeURIComponent(prompt)}`;
}

function revealOracleHandoff(question) {
  if (!oracleHandoff) return;
  oracleHandoff.hidden = false;
  if (oracleHandoffLink) {
    oracleHandoffLink.href = buildOracleWhatsAppUrl(question);
  }
}

function askOracle(question) {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion || oracleState.busy) return;

  addMessage(trimmedQuestion, 'user');
  setOracleBusy(true);
  revealOracleHandoff(trimmedQuestion);
  addMessage('Continue on WhatsApp and The Oracle will pick this up with your question included.', 'bot');
  setOracleStatus('Continue on WhatsApp to send your question.');
  setOracleBusy(false);
  if (oracleInput) oracleInput.focus();
}

if (hasEmbeddedOracle) {
  document.querySelectorAll('[data-oracle-question]').forEach(button => {
    button.addEventListener('click', () => askOracle(button.textContent));
  });

  oracleForm.addEventListener('submit', event => {
    event.preventDefault();
    askOracle(oracleInput.value);
    oracleInput.value = '';
  });
}

const revealSelectors = [
  '.hero-inner',
  '.section-head',
  '.card',
  '.stat',
  '.form',
  '.table',
  '.leader-profile',
  '.timeline-row',
  '.suggestion',
  '.chat',
  '.visual-panel',
  '.media-card'
].join(',');

const revealTargets = Array.from(document.querySelectorAll(revealSelectors));
revealTargets.forEach((el, index) => {
  el.classList.add('page-reveal');
  el.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

revealTargets.forEach(el => revealObserver.observe(el));

document.querySelectorAll('video').forEach(video => {
  if (!video.closest('.hero') && !video.hasAttribute('autoplay')) return;
  video.muted = true;
  video.playsInline = true;
  video.play().catch(() => {});
});
