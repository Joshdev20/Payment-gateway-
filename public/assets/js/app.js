/* ==========================================================================
   PayoutFlow — shared UI utilities
   Pure browser code. No network calls, no storage of user input.
   ========================================================================== */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    // Skip null/undefined/false so conditional children can be inlined.
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

/* ---- Formatting --------------------------------------------------------- */
const CURRENCY_FORMAT = {
  USD: { locale: 'en-US', currency: 'USD' },
  EUR: { locale: 'de-DE', currency: 'EUR' },
  GBP: { locale: 'en-GB', currency: 'GBP' },
  NGN: { locale: 'en-NG', currency: 'NGN' },
  GHS: { locale: 'en-GH', currency: 'GHS' },
  KES: { locale: 'en-KE', currency: 'KES' },
  ZAR: { locale: 'en-ZA', currency: 'ZAR' },
  PHP: { locale: 'en-PH', currency: 'PHP' },
  INR: { locale: 'en-IN', currency: 'INR' },
  CAD: { locale: 'en-CA', currency: 'CAD' },
  AUD: { locale: 'en-AU', currency: 'AUD' },
};

export function money(amount, currency = 'USD', { compact = false } = {}) {
  const cfg = CURRENCY_FORMAT[currency] || CURRENCY_FORMAT.USD;
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.currency,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 2,
      minimumFractionDigits: compact ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

export function number(value, { decimals = 0 } = {}) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function shortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function dateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

/* ---- Status → badge ----------------------------------------------------- */
const STATUS_MAP = {
  paid: ['success', 'Paid'],
  succeeded: ['success', 'Succeeded'],
  delivered: ['success', 'Delivered'],
  processing: ['info', 'Processing'],
  pending: ['warn', 'Pending'],
  queued: ['warn', 'Queued'],
  requires_payment: ['warn', 'Awaiting payment'],
  failed: ['danger', 'Failed'],
  canceled: ['danger', 'Canceled'],
  active: ['success', 'Active'],
  archived: ['danger', 'Archived'],
  verified: ['success', 'Verified'],
  pending_kyc: ['warn', 'Pending'],
  revoked: ['danger', 'Revoked'],
};

export function statusBadge(status) {
  const [tone, label] = STATUS_MAP[status] || ['', status || 'Unknown'];
  return el('span', { class: `badge badge-${tone}` }, [
    el('span', { class: 'badge-dot' }),
    label,
  ]);
}

/* ---- Toast -------------------------------------------------------------- */
let toastWrap;
export function toast(message, { title = '', tone = 'info', timeout = 3600 } = {}) {
  if (!toastWrap) {
    toastWrap = el('div', { class: 'toast-wrap', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastWrap);
  }
  const glyph = { success: '✓', danger: '✕', warn: '!', info: 'i' }[tone] || 'i';
  const color = { success: 'var(--emerald-400)', danger: 'var(--rose-400)', warn: 'var(--amber-400)', info: 'var(--indigo-400)' }[tone];

  const node = el('div', { class: 'toast' }, [
    el('span', { class: 'toast-icon', style: `color:${color};font-weight:700`, text: glyph }),
    el('div', { class: 'grow' }, [
      title ? el('div', { class: 'toast-title', text: title }) : null,
      el('div', { class: 'toast-msg', text: message }),
    ]),
  ]);
  toastWrap.append(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s, transform .3s';
    node.style.opacity = '0';
    node.style.transform = 'translateX(20px)';
    setTimeout(() => node.remove(), 300);
  }, timeout);
}

/* ---- Modal -------------------------------------------------------------- */
export function modal({ title, body, actions = [], size = '' }) {
  const backdrop = el('div', { class: 'modal-backdrop' });
  const close = () => backdrop.remove();
  const panel = el('div', { class: `card card-lg modal ${size}` }, [
    el('div', { class: 'row between gap-4' }, [
      el('h3', { class: 'h3', text: title }),
      el('button', { class: 'btn btn-ghost btn-icon', 'aria-label': 'Close', html: '✕', onClick: close }),
    ]),
    el('div', { style: 'margin-top:var(--s-4)' }, body),
    actions.length
      ? el('div', { class: 'row gap-3', style: 'margin-top:var(--s-5);justify-content:flex-end' }, actions.map((a) =>
          el('button', { class: `btn ${a.class || ''}`, text: a.label, onClick: () => a.onClick?.(close) })))
      : null,
  ]);
  backdrop.append(panel);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
  });
  document.body.append(backdrop);
  return close;
}

/* ---- Count-up animation ------------------------------------------------- */
export function countUp(node, { to, decimals = 0, prefix = '', suffix = '', duration = 1400 } = {}) {
  if (!node) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    node.textContent = `${prefix}${number(to, { decimals })}${suffix}`;
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = `${prefix}${number(to * eased, { decimals })}${suffix}`;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---- Data helpers ------------------------------------------------------- */
export const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

export function groupBy(list, keyFn) {
  return list.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {});
}

export function sum(list, fn = (x) => x) {
  return list.reduce((acc, item) => acc + fn(item), 0);
}
