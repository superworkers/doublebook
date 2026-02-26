(() => {
  const action = window.DB_FORM_ACTION;
  if (!action) return;
  const page = location.pathname.split('/').filter(Boolean)[0] || 'assistant';
  const theme = {
    assistant: { accent: '#facc15', buttonRadius: '14px', modalRadius: '16px' },
    closeflow: { accent: '#5b8bff', buttonRadius: '16px', modalRadius: '16px' },
    notc: { accent: '#e07a5f', buttonRadius: '12px', modalRadius: '16px' },
    social: { accent: '#10b981', buttonRadius: '999px', modalRadius: '16px' }
  }[page] || { accent: '#10b981', buttonRadius: '12px', modalRadius: '16px' };
  const css = ':root{--dbm-accent:' + theme.accent + ';--dbm-bg:rgba(15,16,20,.95);--dbm-border:rgba(255,255,255,.14);--dbm-btn-radius:' + theme.buttonRadius + ';--dbm-modal-radius:' + theme.modalRadius + ';--dbm-text:#f8fafc;--dbm-muted:#aeb6c3}#db-interest-modal{background:var(--dbm-bg);border:1px solid var(--dbm-border);border-radius:var(--dbm-modal-radius);box-shadow:0 20px 70px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.02) inset;color:var(--dbm-text);left:50%;margin:0;max-height:calc(100dvh - 2rem);max-width:36rem;overflow:auto;padding:0;position:fixed;top:50%;transform:translate(-50%,-50%);width:min(36rem,calc(100vw - 2rem))}#db-interest-modal::backdrop{backdrop-filter:blur(4px);background:rgba(4,6,10,.65)}.dbm-wrap{padding:1.5rem}.dbm-head{align-items:center;display:flex;justify-content:space-between;margin-bottom:1rem}.dbm-title{font-family:inherit;font-size:1.4rem;font-weight:650;letter-spacing:.01em;margin:0}.dbm-close{background:transparent;border:0;border-radius:999px;color:var(--dbm-muted);cursor:pointer;font-size:1.5rem;height:2rem;line-height:1;padding:0;width:2rem}.dbm-close:hover{background:rgba(255,255,255,.08);color:#fff}.dbm-form{display:grid;gap:.8rem}.dbm-label{color:var(--dbm-muted);display:grid;font-size:.9rem;font-weight:500;gap:.45rem}.dbm-input,.dbm-text{background:rgba(8,10,14,.55);border:1px solid rgba(255,255,255,.16);border-radius:10px;color:var(--dbm-text);font:inherit;padding:.8rem .9rem}.dbm-input:focus,.dbm-text:focus{border-color:var(--dbm-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--dbm-accent) 18%, transparent);outline:none}.dbm-text{min-height:7.5rem;resize:vertical}.dbm-btn{background:linear-gradient(135deg,var(--dbm-accent),color-mix(in srgb,var(--dbm-accent) 72%, #111));border:0;border-radius:var(--dbm-btn-radius);color:#fff;cursor:pointer;font-weight:700;padding:.85rem 1rem}.dbm-btn:hover{filter:brightness(1.07)}.dbm-note{color:var(--dbm-muted);font-size:.78rem;margin:.1rem 0 0}@media (max-width:640px){.dbm-wrap{padding:1rem}.dbm-title{font-size:1.15rem}}';
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const dialog = document.createElement('dialog');
  dialog.id = 'db-interest-modal';
  const wrap = document.createElement('div');
  wrap.className = 'dbm-wrap';
  const head = document.createElement('div');
  head.className = 'dbm-head';
  const title = document.createElement('h2');
  title.className = 'dbm-title';
  title.textContent = 'Get Early Access';
  const close = document.createElement('button');
  close.className = 'dbm-close';
  close.id = 'dbm-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '×';
  head.appendChild(title);
  head.appendChild(close);
  const form = document.createElement('form');
  form.action = action;
  form.className = 'dbm-form';
  form.id = 'db-interest-form';
  form.method = 'POST';
  const emailLabel = document.createElement('label');
  emailLabel.className = 'dbm-label';
  emailLabel.textContent = 'Your email';
  const email = document.createElement('input');
  email.className = 'dbm-input';
  email.name = 'email';
  email.required = true;
  email.type = 'email';
  emailLabel.appendChild(email);
  const messageLabel = document.createElement('label');
  messageLabel.className = 'dbm-label';
  messageLabel.textContent = "Why you're interested in DoubleBook (optional)";
  const message = document.createElement('textarea');
  message.className = 'dbm-text';
  message.name = 'message';
  messageLabel.appendChild(message);
  const pageInput = document.createElement('input');
  pageInput.name = 'page';
  pageInput.type = 'hidden';
  pageInput.value = location.pathname;
  const submit = document.createElement('button');
  submit.className = 'dbm-btn';
  submit.type = 'submit';
  submit.textContent = 'Send';
  const note = document.createElement('p');
  note.className = 'dbm-note';
  note.textContent = "No spam. We'll only use this to follow up.";
  form.appendChild(emailLabel);
  form.appendChild(messageLabel);
  form.appendChild(pageInput);
  form.appendChild(submit);
  form.appendChild(note);
  wrap.appendChild(head);
  wrap.appendChild(form);
  dialog.appendChild(wrap);
  document.body.appendChild(dialog);

  const getPrefill = node => {
    const el = asElement(node);
    const fromForm = el && el.closest('form') && el.closest('form').querySelector('input[type="email"]');
    const href = el && el.getAttribute && el.getAttribute('href');
    const fromHash = href && href[0] === '#' && document.querySelector(href + ' input[type="email"]');
    const firstFilled = Array.from(document.querySelectorAll('input[type="email"]')).find(i => i.value && i.id !== 'db-interest-email');
    const raw = (fromForm && fromForm.value) || (fromHash && fromHash.value) || (firstFilled && firstFilled.value) || '';
    return raw.trim();
  };
  const open = prefill => {
    if (dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', 'open');
    email.value = prefill || '';
    email.focus();
    if (email.value) email.setSelectionRange(email.value.length, email.value.length);
  };
  const asElement = node => {
    if (node instanceof Element) return node;
    return node && node.parentElement ? node.parentElement : null;
  };
  const isTrigger = node => {
    const el = asElement(node);
    return el && el.closest('a.btn-primary,a.cta-button,a.nav-cta,a[href="#cta"],a[href="#request-access"],a[href="#get-access"],button.btn-primary,form button[type="submit"]');
  };

  document.addEventListener('click', e => {
    const trigger = isTrigger(e.target);
    if (!trigger) return;
    if (trigger.closest('#db-interest-form')) return;
    e.preventDefault();
    e.stopPropagation();
    open(getPrefill(e.target));
  }, true);

  document.addEventListener('submit', e => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id === 'db-interest-form') return;
    e.preventDefault();
    e.stopPropagation();
    open(getPrefill(form));
  }, true);

  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });
  close.addEventListener('click', () => dialog.close());
})();
