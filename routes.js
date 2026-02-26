(function () {
  const routes = [
    { label: 'Assistant', href: '/assistant/' },
    { label: 'RealtorBatch AI', href: '/email/' },
    { label: 'Overnight', href: '/overnight/' },
    { label: 'Social', href: '/social/' },
    { label: 'CloseFlow', href: '/closeflow/' },
    { label: 'Docs', href: '/docs/' },
    { label: 'Newsletter', href: '/newsletter/', badge: { text: 'New', style: 'background:rgba(244,63,94,0.18);color:#fb7185;border:1px solid rgba(244,63,94,0.35);' } },
    { label: 'Tasks', href: '/' },
    { label: 'NoTC', href: '/notc/', badge: { text: 'Kill', style: 'background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.08);' } },
  ];

  const style = document.createElement('style');
  style.textContent = `
    #concepts-menu { display: inline-block; margin-left: 1.5rem; margin-right: auto; position: relative; }
    #concepts-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.375rem;
      color: inherit;
      cursor: pointer;
      font: inherit;
      font-size: 0.875rem;
      padding: 0.5rem 0.875rem;
      white-space: nowrap;
    }
    #concepts-btn:hover { background: rgba(255, 255, 255, 0.06); }
    #concepts-panel {
      background: #111114;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.5);
      display: none;
      gap: 0.125rem;
      min-width: 11rem;
      padding: 0.375rem;
      position: absolute;
      right: 0;
      top: calc(100% + 0.5rem);
      z-index: 200;
    }
    #concepts-menu.open #concepts-panel { display: grid; }
    #concepts-panel a {
      align-items: center;
      border-radius: 0.375rem;
      color: rgba(255, 255, 255, 0.7);
      display: flex;
      font-size: 0.875rem;
      justify-content: space-between;
      padding: 0.5rem 0.625rem;
      text-decoration: none;
    }
    .concepts-badge {
      border-radius: 0.25rem;
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 0.125rem 0.375rem;
      text-transform: uppercase;
    }
    #concepts-panel a:hover { background: rgba(255, 255, 255, 0.06); color: #fff; }
    #concepts-panel a.current { color: #fff; font-weight: 600; }
  `;
  document.head.appendChild(style);

  const menu = document.createElement('div');
  menu.id = 'concepts-menu';

  const btn = document.createElement('button');
  btn.id = 'concepts-btn';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-haspopup', 'true');
  btn.type = 'button';
  btn.textContent = 'Concepts';

  const panel = document.createElement('div');
  panel.id = 'concepts-panel';

  const path = window.location.pathname;
  routes.forEach(({ label, href, badge }) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    if (path === href || (path === '/' && href === '/')) a.classList.add('current');
    if (badge) {
      const b = document.createElement('span');
      b.className = 'concepts-badge';
      b.style.cssText = badge.style;
      b.textContent = badge.text;
      a.appendChild(b);
    }
    panel.appendChild(a);
  });

  menu.appendChild(btn);
  menu.appendChild(panel);

  const close = () => { btn.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); };
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('open', !open);
  });
  document.addEventListener('click', e => !menu.contains(e.target) && close());
  document.addEventListener('keydown', e => e.key === 'Escape' && close());

  const inject = () => {
    const nav = document.querySelector('nav') || document.querySelector('header');
    if (!nav) return;
    const container = nav.firstElementChild?.tagName === 'DIV' ? nav.firstElementChild : nav;
const second = container.children[1];
    second ? container.insertBefore(menu, second) : container.appendChild(menu);
  };

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', inject) : inject();
})();
