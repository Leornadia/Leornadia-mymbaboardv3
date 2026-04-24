(function initOracleWidget() {
  if (window.__oracleWidgetInitialized) return;
  window.__oracleWidgetInitialized = true;

  const WA_URL = 'https://wa.me/27673377523';
  const ORACLE_PAGE = 'oracle.html';

  const path = window.location.pathname || '';
  const isOraclePage = path.endsWith(`/${ORACLE_PAGE}`) || path.endsWith(ORACLE_PAGE);

  if (!document.querySelector('link[data-oracle-widget-style]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'oracle-widget.css';
    link.setAttribute('data-oracle-widget-style', '');
    document.head.appendChild(link);
  }

  const widgetRoot = document.createElement('section');
  widgetRoot.className = 'oracle-widget-root';
  widgetRoot.dataset.open = 'false';
  widgetRoot.innerHTML = `
    <button type="button" class="oracle-widget-launcher" aria-expanded="false" aria-controls="oracle-widget-panel">
      <span class="oracle-widget-launcher-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3z"/>
          <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/>
        </svg>
      </span>
      <span class="oracle-widget-launcher-label">Message The Oracle</span>
    </button>
    <div class="oracle-widget-panel" id="oracle-widget-panel" aria-hidden="true">
      <div class="oracle-widget-band">
        <button type="button" class="oracle-widget-close" aria-label="Close The Oracle">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="oracle-widget-card">
        <div class="oracle-widget-avatar" aria-hidden="true">
          <span class="oracle-widget-avatar-icon">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3z"/>
              <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/>
              <path d="M6 14l.9 2.1L9 17l-2.1.9L6 20l-.9-2.1L3 17l2.1-.9L6 14z"/>
            </svg>
          </span>
        </div>
        <h2 class="oracle-widget-heading">Hi, I'm&nbsp;<span class="oracle-widget-name">The Oracle</span></h2>
        <p class="oracle-widget-copy">Ask a business question and continue through WhatsApp for support on compliance, cash flow, pricing, growth, operations, and startup admin in South Africa.</p>
        <div class="oracle-widget-suggestions">
          <button type="button" class="oracle-widget-suggestion">How do I register my business with CIPC?</button>
          <button type="button" class="oracle-widget-suggestion">What compliance do I need for a small business in SA?</button>
          <button type="button" class="oracle-widget-suggestion">How can I improve my cash flow?</button>
        </div>
        <div class="oracle-widget-messages" aria-live="polite"></div>
        <div class="oracle-widget-status"></div>
        <form class="oracle-widget-form">
          <input type="text" placeholder="How can I help you?" aria-label="Message The Oracle">
          <button class="oracle-widget-submit" type="submit" aria-label="Send message">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22l-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </form>
        <div class="oracle-widget-handoff" hidden>
          <strong>Need tailored support?</strong>
          <p>Use WhatsApp for document review, company-specific next steps, or anything that needs your exact business context.</p>
          <a href="https://wa.me/27673377523?text=I%20used%20The%20Oracle%20and%20need%20more%20help" class="oracle-widget-button">Continue on WhatsApp</a>
        </div>
      </div>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'oracle-widget-overlay';

  document.body.append(widgetRoot, overlay);

  const launcher = widgetRoot.querySelector('.oracle-widget-launcher');
  const panel = widgetRoot.querySelector('.oracle-widget-panel');
  const closeButton = widgetRoot.querySelector('.oracle-widget-close');
  const messages = widgetRoot.querySelector('.oracle-widget-messages');
  const status = widgetRoot.querySelector('.oracle-widget-status');
  const form = widgetRoot.querySelector('.oracle-widget-form');
  const input = widgetRoot.querySelector('input');
  const submit = widgetRoot.querySelector('.oracle-widget-submit');
  const handoff = widgetRoot.querySelector('.oracle-widget-handoff');
  const handoffLink = handoff.querySelector('a');
  const suggestions = widgetRoot.querySelectorAll('.oracle-widget-suggestion');

  const state = {
    busy: false,
  };

  function buildWhatsAppUrl(question) {
    const prompt = question
      ? `I used The Oracle and need more help with: ${question}`
      : 'I used The Oracle and need more help.';
    return `${WA_URL}?text=${encodeURIComponent(prompt)}`;
  }

  function addMessage(text, type) {
    const message = document.createElement('div');
    message.className = `oracle-widget-msg ${type}`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  }

  function setStatus(text) {
    status.textContent = text || '';
  }

  function setBusy(busy) {
    state.busy = busy;
    input.disabled = busy;
    submit.disabled = busy;
  }

  function openWidget(options = {}) {
    const { focus = true } = options;
    widgetRoot.dataset.open = 'true';
    launcher.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    if (focus) {
      window.setTimeout(() => input.focus(), 80);
    }
  }

  function closeWidget() {
    widgetRoot.dataset.open = 'false';
    launcher.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
  }

  function revealHandoff(question) {
    handoff.hidden = false;
    handoffLink.href = buildWhatsAppUrl(question);
  }

  function askOracle(question) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || state.busy) return;

    openWidget();
    addMessage(trimmedQuestion, 'user');
    setBusy(true);
    revealHandoff(trimmedQuestion);

    addMessage('Continue on WhatsApp and The Oracle will pick this up with your question included.', 'bot');
    setStatus('Continue on WhatsApp to send your question.');
    setBusy(false);
    input.focus();
  }

  launcher.addEventListener('click', () => {
    const isOpen = widgetRoot.dataset.open === 'true';
    if (isOpen) closeWidget();
    else openWidget();
  });

  closeButton.addEventListener('click', closeWidget);
  overlay.addEventListener('click', closeWidget);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && widgetRoot.dataset.open === 'true') {
      closeWidget();
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    askOracle(input.value);
    input.value = '';
  });

  suggestions.forEach(button => {
    button.addEventListener('click', () => askOracle(button.textContent || ''));
  });

  document.querySelectorAll('[data-oracle-trigger]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      openWidget();
    });
  });

  document.querySelectorAll('[data-oracle-question]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      askOracle(trigger.textContent || '');
    });
  });

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || !href.includes(ORACLE_PAGE)) return;
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target && link.target !== '_self') return;
      event.preventDefault();
      openWidget();
    });
  });

  window.openOracleWidget = question => {
    if (typeof question === 'string' && question.trim()) {
      askOracle(question);
      return;
    }

    openWidget();
  };

  if (isOraclePage) {
    window.setTimeout(() => openWidget({ focus: false }), 120);
  }
})();
