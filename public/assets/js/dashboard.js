import {
  $, $$, el, money, number, relTime, shortDate, dateTime, initials,
  statusBadge, toast, modal, countUp, uid,
} from './app.js?v=4';
import { areaChart, donutChart } from './chart.js?v=4';
import * as store from './demo-store.js?v=4';

const state = {
  view: 'overview',
  search: '',
  payoutStatus: 'all',
  payoutPage: 0,
  pageSize: 12,
};

const VIEW_META = {
  overview: { title: 'Overview', crumb: 'Dashboard' },
  payouts: { title: 'Payouts', crumb: 'Dashboard / Payouts' },
  recipients: { title: 'Recipients', crumb: 'Dashboard / Recipients' },
  checkout: { title: 'Checkout sessions', crumb: 'Dashboard / Checkout' },
  ledger: { title: 'Ledger', crumb: 'Finance / Ledger' },
  audit: { title: 'Audit log', crumb: 'Finance / Audit log' },
  webhooks: { title: 'Webhooks', crumb: 'Developers / Webhooks' },
  api: { title: 'API keys', crumb: 'Developers / API keys' },
  settings: { title: 'Settings', crumb: 'Settings' },
};

/* ==========================================================================
   Render root
   ========================================================================== */
function render() {
  const meta = VIEW_META[state.view];
  $('#viewTitle').textContent = meta.title;
  $('#crumb').textContent = meta.crumb;
  $$('#sidebarNav .nav-item').forEach((b) =>
    b.setAttribute('aria-current', b.dataset.view === state.view ? 'page' : 'false'));

  const view = $('#view');
  view.innerHTML = '';
  const renderers = {
    overview: renderOverview,
    payouts: renderPayouts,
    recipients: renderRecipients,
    checkout: renderCheckout,
    ledger: renderLedger,
    audit: renderAudit,
    webhooks: renderWebhooks,
    api: renderApi,
    settings: renderSettings,
  };
  (renderers[state.view] || renderOverview)(view);
  view.focus({ preventScroll: true });
  closeSidebar();
}

/* ==========================================================================
   Overview
   ========================================================================== */
function renderOverview(view) {
  const data = store.load();
  const balances = store.balances(data);
  const stats = store.payoutStats(data);
  const series = store.volumeSeries(data, 14);
  const usd = balances.find((b) => b.currency === 'USD');

  /* ---- Balance hero ---- */
  const hero = el('section', { class: 'balance-hero reveal' }, [
    el('div', {}, [
      el('div', { class: 'tiny muted', text: 'Available balance' }),
      el('div', { class: 'balance-value tabular', id: 'balanceValue', text: money(0, 'USD') }),
      el('div', { class: 'row gap-3 wrap', style: 'margin-top:var(--s-3)' }, [
        el('span', { class: 'badge badge-success' }, [el('span', { class: 'badge-dot' }), 'Healthy']),
        el('span', { class: 'small muted', text: `${data.business.account_id} · sandbox` }),
      ]),
      el('div', { class: 'balance-actions' }, [
        el('button', { class: 'btn btn-primary', text: 'Send a payout', onClick: openNewPayout }),
        el('button', { class: 'btn', text: 'Create checkout link', onClick: openNewCheckout }),
        el('button', { class: 'btn btn-ghost', text: 'Add funds', onClick: openTopUp }),
      ]),
    ]),
    el('div', {}, [
      el('div', { class: 'row between' }, [
        el('div', { class: 'small', style: 'font-weight:600;color:var(--text-1)', text: 'Last 14 days' }),
        el('span', { class: 'tiny muted', text: `${series.reduce((a, s) => a + s.count, 0)} payouts` }),
      ]),
      el('div', { class: 'mini-bars', style: 'margin-top:var(--s-4)' },
        series.map((s) => {
          const max = Math.max(...series.map((x) => x.paid), 1);
          return el('span', {
            style: `height:${Math.max(6, (s.paid / max) * 100)}%`,
            title: `${s.label}: ${money(s.paid, 'USD')}`,
          });
        })),
      el('div', { class: 'row between', style: 'margin-top:var(--s-3)' }, [
        el('span', { class: 'tiny muted', text: series[0].label }),
        el('span', { class: 'tiny muted', text: series[series.length - 1].label }),
      ]),
    ]),
  ]);
  view.append(hero);
  countUp($('#balanceValue'), { to: usd.amount, prefix: '$', duration: 1200, decimals: 2 });

  /* ---- Stat tiles ---- */
  const tiles = [
    { label: 'Paid out (all time)', value: stats.paid, tone: 'up', delta: '+12.4%', glyph: '↗' },
    { label: 'In flight', value: stats.pending, tone: '', delta: `${stats.byStatus.processing || 0} processing`, glyph: '◷' },
    { label: 'Failed / canceled', value: stats.failed, tone: 'down', delta: `${(stats.byStatus.failed || 0) + (stats.byStatus.canceled || 0)} payouts`, glyph: '⚠' },
    { label: 'Active recipients', value: data.recipients.filter((r) => r.status === 'active').length, money: false, tone: 'up', delta: '4 countries', glyph: '◉' },
  ];
  const tileGrid = el('section', { class: 'grid grid-4 reveal reveal-1' },
    tiles.map((t) => el('div', { class: 'card stat-card card-hover' }, [
      el('div', { class: 'row between' }, [
        el('span', { class: 'stat-label', text: t.label }),
        el('span', { class: 'stat-glyph', text: t.glyph }),
      ]),
      el('div', { class: 'stat-value tabular', text: t.money === false ? number(t.value) : money(t.value, 'USD') }),
      el('div', { class: `stat-delta ${t.tone}`, text: t.delta }),
    ])));
  view.append(tileGrid);

  /* ---- Chart + breakdown ---- */
  const chartCard = el('section', { class: 'card chart-card reveal reveal-2' }, [
    el('div', { class: 'chart-head' }, [
      el('div', {}, [
        el('h3', { class: 'h3', text: 'Payout volume' }),
        el('p', { class: 'small muted', text: 'Settled payouts by day, USD' }),
      ]),
      el('div', { class: 'segment', role: 'tablist' }, [
        el('button', { role: 'tab', 'aria-selected': 'true', text: '14D' }),
        el('button', { role: 'tab', 'aria-selected': 'false', text: '30D' }),
        el('button', { role: 'tab', 'aria-selected': 'false', text: '90D' }),
      ]),
    ]),
    el('div', { class: 'chart-wrap', id: 'volumeChart' }),
    el('div', { class: 'chart-axis' }, [
      el('span', { text: series[0].label }),
      el('span', { text: series[Math.floor(series.length / 2)].label }),
      el('span', { text: series[series.length - 1].label }),
    ]),
  ]);

  const statusSegments = [
    { label: 'Paid', value: stats.byStatus.paid || 0, color: '#10b981' },
    { label: 'Processing', value: stats.byStatus.processing || 0, color: '#22d3ee' },
    { label: 'Queued', value: stats.byStatus.queued || 0, color: '#fbbf24' },
    { label: 'Failed', value: (stats.byStatus.failed || 0) + (stats.byStatus.canceled || 0), color: '#f43f5e' },
  ];
  const breakdown = el('section', { class: 'card card-pad reveal reveal-2' }, [
    el('h3', { class: 'h3', text: 'Status breakdown' }),
    el('div', { class: 'row gap-5', style: 'margin-top:var(--s-4);align-items:center;flex-wrap:wrap' }, [
      el('div', { id: 'statusDonut' }),
      el('div', { class: 'stack gap-2 grow' },
        statusSegments.map((s) => el('div', { class: 'row between gap-3' }, [
          el('span', { class: 'row gap-2 small' }, [
            el('span', { style: `width:9px;height:9px;border-radius:3px;background:${s.color}` }),
            el('span', { text: s.label }),
          ]),
          el('span', { class: 'small tabular', style: 'color:var(--text-1);font-weight:600', text: number(s.value) }),
        ]))),
    ]),
  ]);

  view.append(el('section', { class: 'grid', id: 'analyticsRow', style: 'grid-template-columns:1.7fr 1fr' }, [chartCard, breakdown]));

  /* ---- Recent payouts ---- */
  const recent = el('section', { class: 'card reveal reveal-3' }, [
    el('div', { class: 'row between gap-4 card-pad', style: 'padding-bottom:var(--s-3)' }, [
      el('h3', { class: 'h3', text: 'Recent payouts' }),
      el('button', { class: 'btn btn-sm btn-ghost', text: 'View all', onClick: () => go('payouts') }),
    ]),
    payoutTable(data.payouts.slice(0, 6), { compact: true }),
  ]);
  view.append(recent);

  // Charts need layout to be measured.
  requestAnimationFrame(() => {
    areaChart($('#volumeChart'), series, { format: (v) => money(v, 'USD') });
    donutChart($('#statusDonut'), statusSegments.filter((s) => s.value > 0));
  });

  // Responsive: collapse the analytics row on narrow screens.
  const analyticsRow = $('#analyticsRow');
  const fix = () => { analyticsRow.style.gridTemplateColumns = window.innerWidth < 1080 ? '1fr' : '1.7fr 1fr'; };
  fix();
  window.addEventListener('resize', fix);
}

/* ==========================================================================
   Payouts
   ========================================================================== */
function payoutTable(rows, { compact = false } = {}) {
  if (!rows.length) {
    return el('div', { class: 'empty' }, [
      el('div', { class: 'empty-glyph', text: '⇄' }),
      el('h3', { class: 'h3', text: 'No payouts yet' }),
      el('p', { class: 'small muted', text: 'Send your first payout to see it appear here.' }),
      el('button', { class: 'btn btn-primary btn-sm', text: 'New payout', onClick: openNewPayout }),
    ]);
  }

  return el('div', { class: 'table-wrap', style: 'border:0;border-radius:0' }, [
    el('table', {}, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', { text: 'Recipient' }),
          el('th', { text: 'Reference' }),
          !compact && el('th', { text: 'Method' }),
          el('th', { class: 'text-right', text: 'Amount' }),
          el('th', { text: 'Status' }),
          el('th', { class: 'text-right', text: 'Created' }),
        ]),
      ]),
      el('tbody', {}, rows.map((p) => el('tr', {
        style: 'cursor:pointer',
        onClick: () => openPayoutDetail(p.id),
      }, [
        el('td', {}, [
          el('div', { class: 'row gap-3' }, [
            el('span', { class: 'avatar', text: initials(p.recipient_name) }),
            el('div', {}, [
              el('div', { style: 'color:var(--text-1);font-weight:600', text: p.recipient_name }),
              el('div', { class: 'tiny muted', text: p.description || '—' }),
            ]),
          ]),
        ]),
        el('td', { class: 'mono small', text: p.reference }),
        !compact && el('td', { class: 'small', text: labelMethod(p.method) }),
        el('td', { class: 'text-right tabular', style: 'color:var(--text-1);font-weight:600' },
          `${money(p.amount, p.currency)}`),
        el('td', {}, [statusBadge(p.status)]),
        el('td', { class: 'text-right small muted', text: relTime(p.created_at) }),
      ]))),
    ]),
  ]);
}

function labelMethod(method) {
  return ({
    bank_transfer: 'Bank transfer',
    mobile_money: 'Mobile money',
    card_payout: 'Card',
    wallet_transfer: 'Wallet',
  })[method] || method;
}

function renderPayouts(view) {
  const data = store.load();
  const filtered = data.payouts.filter((p) => {
    if (state.payoutStatus !== 'all' && p.status !== state.payoutStatus) return false;
    if (state.search) {
      const q = state.search.toLowerCase();
      return p.recipient_name.toLowerCase().includes(q)
        || p.reference.toLowerCase().includes(q)
        || (p.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  state.payoutPage = Math.min(state.payoutPage, totalPages - 1);
  const page = filtered.slice(state.payoutPage * state.pageSize, (state.payoutPage + 1) * state.pageSize);

  view.append(el('section', { class: 'toolbar reveal' }, [
    el('div', { class: 'segment grow', role: 'tablist', id: 'statusFilter' },
      ['all', 'paid', 'processing', 'queued', 'failed'].map((s) =>
        el('button', {
          role: 'tab',
          'aria-selected': String(state.payoutStatus === s),
          text: s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1),
          onClick: () => { state.payoutStatus = s; state.payoutPage = 0; render(); },
        }))),
    el('div', { class: 'grow' }),
    el('span', { class: 'small muted', text: `${filtered.length} payout${filtered.length === 1 ? '' : 's'}` }),
  ]));

  view.append(el('section', { class: 'card reveal reveal-1' }, [payoutTable(page)]));

  if (totalPages > 1) {
    view.append(el('section', { class: 'row between gap-4' }, [
      el('span', { class: 'small muted', text: `Page ${state.payoutPage + 1} of ${totalPages}` }),
      el('div', { class: 'row gap-2' }, [
        el('button', {
          class: 'btn btn-sm', text: 'Previous', disabled: state.payoutPage === 0 ? '' : null,
          onClick: () => { state.payoutPage -= 1; render(); },
        }),
        el('button', {
          class: 'btn btn-sm', text: 'Next', disabled: state.payoutPage >= totalPages - 1 ? '' : null,
          onClick: () => { state.payoutPage += 1; render(); },
        }),
      ]),
    ]));
  }
}

/* ==========================================================================
   Recipients
   ========================================================================== */
function renderRecipients(view) {
  const data = store.load();
  const list = data.recipients.filter((r) => !state.search
    || r.name.toLowerCase().includes(state.search.toLowerCase())
    || r.currency.toLowerCase().includes(state.search.toLowerCase()));

  view.append(el('section', { class: 'view-head reveal' }, [
    el('div', {}, [
      el('h2', { class: 'h3', text: 'Payout recipients' }),
      el('p', { class: 'small muted', text: 'Saved destinations for bank, mobile money, card and wallet payouts.' }),
    ]),
    el('button', { class: 'btn btn-primary', text: 'Add recipient', onClick: openNewRecipient }),
  ]));

  if (!list.length) {
    view.append(el('section', { class: 'card empty' }, [
      el('div', { class: 'empty-glyph', text: '◉' }),
      el('h3', { class: 'h3', text: 'No recipients found' }),
      el('p', { class: 'small muted', text: 'Add a recipient to start sending payouts.' }),
    ]));
    return;
  }

  view.append(el('section', { class: 'grid auto-fit reveal reveal-1' }, list.map((r) => el('article', { class: 'card card-pad card-hover' }, [
    el('div', { class: 'row gap-3' }, [
      el('span', { class: 'avatar avatar-lg', text: initials(r.name) }),
      el('div', { class: 'grow', style: 'min-width:0' }, [
        el('div', { style: 'color:var(--text-1);font-weight:650', text: r.name }),
        el('div', { class: 'tiny muted', text: r.email || '—' }),
      ]),
      statusBadge(r.status),
    ]),
    el('div', { style: 'margin-top:var(--s-4)' }, [
      el('div', { class: 'detail-row' }, [
        el('span', { class: 'detail-key', text: 'Type' }),
        el('span', { class: 'detail-val', text: labelType(r.type) }),
      ]),
      el('div', { class: 'detail-row' }, [
        el('span', { class: 'detail-key', text: 'Destination' }),
        el('span', { class: 'detail-val mono small', text: destinationSummary(r) }),
      ]),
      el('div', { class: 'detail-row' }, [
        el('span', { class: 'detail-key', text: 'Currency' }),
        el('span', { class: 'detail-val', text: `${r.currency} · ${r.country}` }),
      ]),
    ]),
    el('div', { class: 'row gap-2', style: 'margin-top:var(--s-4)' }, [
      el('button', {
        class: 'btn btn-sm grow', text: 'Send payout',
        onClick: () => openNewPayout(r.id),
      }),
      el('button', {
        class: 'btn btn-sm btn-ghost', text: 'Remove',
        onClick: () => confirmRemoveRecipient(r),
      }),
    ]),
  ]))));
}

function labelType(type) {
  return ({
    bank_account: 'Bank account', mobile_money: 'Mobile money', card: 'Card', wallet: 'Wallet',
  })[type] || type;
}

function destinationSummary(r) {
  const d = r.details || {};
  if (r.type === 'bank_account') return `${d.bank_name} ${d.account_number}`;
  if (r.type === 'mobile_money') return `${d.provider} ${d.phone}`;
  if (r.type === 'wallet') return `${d.network}`;
  if (r.type === 'card') return `${d.brand} •••• ${d.last4}`;
  return '—';
}

function confirmRemoveRecipient(recipient) {
  modal({
    title: 'Archive recipient?',
    body: el('p', { class: 'small muted', text: `${recipient.name} will no longer be selectable for new payouts. Existing payout history is kept.` }),
    actions: [
      { label: 'Cancel', class: 'btn-ghost' },
      {
        label: 'Archive',
        class: 'btn-danger',
        onClick: (close) => {
          const data = store.load();
          const target = data.recipients.find((x) => x.id === recipient.id);
          if (target) target.status = 'archived';
          store.save();
          store.logAudit('recipient.archived', recipient.id);
          close();
          toast(`${recipient.name} archived`, { tone: 'success', title: 'Recipient updated' });
          render();
        },
      },
    ],
  });
}

/* ==========================================================================
   Checkout
   ========================================================================== */
function renderCheckout(view) {
  const data = store.load();
  const paid = data.checkout.filter((s) => s.status === 'paid');
  const volume = paid.reduce((a, s) => a + s.amount, 0);
  const fees = paid.reduce((a, s) => a + s.fee, 0);

  view.append(el('section', { class: 'grid grid-3 reveal' }, [
    statCard('Checkout volume', money(volume, 'USD'), `${paid.length} paid sessions`),
    statCard('Processing fees', money(fees, 'USD'), '2.9% + 30¢ per payment'),
    statCard('Net to balance', money(volume - fees, 'USD'), 'Settled to available'),
  ]));

  view.append(el('section', { class: 'card reveal reveal-1' }, [
    el('div', { class: 'row between gap-4 card-pad', style: 'padding-bottom:var(--s-3)' }, [
      el('h3', { class: 'h3', text: 'Sessions' }),
      el('div', { class: 'row gap-2' }, [
        el('a', { class: 'btn btn-sm', href: 'checkout.html', text: 'Open demo checkout' }),
        el('button', { class: 'btn btn-sm btn-primary', text: 'New session', onClick: openNewCheckout }),
      ]),
    ]),
    el('div', { class: 'table-wrap', style: 'border:0;border-radius:0' }, [
      el('table', {}, [
        el('thead', {}, [el('tr', {}, [
          el('th', { text: 'Session' }), el('th', { text: 'Customer' }),
          el('th', { class: 'text-right', text: 'Amount' }),
          el('th', { class: 'text-right', text: 'Fee' }),
          el('th', { text: 'Status' }), el('th', { class: 'text-right', text: 'Created' }),
        ])]),
        el('tbody', {}, data.checkout.slice(0, 15).map((s) => el('tr', {}, [
          el('td', { class: 'mono small', text: s.reference }),
          el('td', { class: 'small', text: s.customer_email }),
          el('td', { class: 'text-right tabular', style: 'color:var(--text-1);font-weight:600', text: money(s.amount, s.currency) }),
          el('td', { class: 'text-right tabular small muted', text: money(s.fee, s.currency) }),
          el('td', {}, [statusBadge(s.status)]),
          el('td', { class: 'text-right small muted', text: relTime(s.created_at) }),
        ]))),
      ]),
    ]),
  ]));
}

function statCard(label, value, delta) {
  return el('div', { class: 'card stat-card' }, [
    el('span', { class: 'stat-label', text: label }),
    el('span', { class: 'stat-value tabular', text: value }),
    el('span', { class: 'small muted', text: delta }),
  ]);
}

/* ==========================================================================
   Ledger
   ========================================================================== */
function renderLedger(view) {
  const data = store.load();
  const balances = store.balances(data);

  view.append(el('section', { class: 'grid grid-3 reveal' }, balances.map((b) =>
    el('div', { class: 'card stat-card' }, [
      el('span', { class: 'stat-label', text: `${b.currency} available` }),
      el('span', { class: 'stat-value tabular', text: money(b.amount, b.currency) }),
      el('span', { class: 'small muted', text: 'Derived from ledger history' }),
    ]))));

  const running = [];
  let bal = 0;
  [...data.ledger].reverse().forEach((e) => {
    bal += e.direction === 'credit' ? e.amount : -e.amount;
    running.unshift({ ...e, balance: bal });
  });

  view.append(el('section', { class: 'card reveal reveal-1' }, [
    el('div', { class: 'card-pad', style: 'padding-bottom:0' }, [
      el('h3', { class: 'h3', text: 'Transaction ledger' }),
      el('p', { class: 'small muted', text: 'Every balance change is an immutable entry. The balance column is derived, never stored.' }),
    ]),
    el('div', { class: 'table-wrap', style: 'border:0;border-radius:0;margin-top:var(--s-4)' }, [
      el('table', {}, [
        el('thead', {}, [el('tr', {}, [
          el('th', { text: 'Description' }), el('th', { text: 'Type' }),
          el('th', { class: 'text-right', text: 'Amount' }),
          el('th', { class: 'text-right', text: 'Balance' }),
          el('th', { class: 'text-right', text: 'Date' }),
        ])]),
        el('tbody', {}, running.slice(0, 40).map((e) => el('tr', {}, [
          el('td', {}, [
            el('div', { style: 'color:var(--text-1);font-weight:550', text: e.description || e.type }),
            e.reference ? el('div', { class: 'tiny muted mono', text: e.reference }) : null,
          ]),
          el('td', {}, [el('span', { class: `badge ${e.direction === 'credit' ? 'badge-success' : 'badge-info'}`, text: e.direction === 'credit' ? 'Credit' : 'Debit' })]),
          el('td', { class: 'text-right tabular', style: `font-weight:600;color:${e.direction === 'credit' ? 'var(--emerald-400)' : 'var(--text-1)'}` },
            `${e.direction === 'credit' ? '+' : '−'}${money(e.amount, e.currency)}`),
          el('td', { class: 'text-right tabular small muted', text: money(e.balance, e.currency) }),
          el('td', { class: 'text-right small muted', text: dateTime(e.created_at) }),
        ]))),
      ]),
    ]),
  ]));
}

/* ==========================================================================
   Audit
   ========================================================================== */
function renderAudit(view) {
  const data = store.load();
  view.append(el('section', { class: 'card reveal' }, [
    el('div', { class: 'card-pad', style: 'padding-bottom:0' }, [
      el('h3', { class: 'h3', text: 'Audit log' }),
      el('p', { class: 'small muted', text: 'Immutable record of every action, with actor, target, time and IP.' }),
    ]),
    el('div', { class: 'table-wrap', style: 'border:0;border-radius:0;margin-top:var(--s-4)' }, [
      el('table', {}, [
        el('thead', {}, [el('tr', {}, [
          el('th', { text: 'Action' }), el('th', { text: 'Actor' }),
          el('th', { text: 'Target' }), el('th', { text: 'IP' }),
          el('th', { class: 'text-right', text: 'When' }),
        ])]),
        el('tbody', {}, data.audit.map((a) => el('tr', {}, [
          el('td', {}, [el('span', { class: 'badge badge-brand mono', text: a.action })]),
          el('td', { class: 'small mono', text: a.actor }),
          el('td', { class: 'small mono muted', text: a.target || '—' }),
          el('td', { class: 'small mono muted', text: a.ip }),
          el('td', { class: 'text-right small muted', text: dateTime(a.created_at) }),
        ]))),
      ]),
    ]),
  ]));
}

/* ==========================================================================
   Webhooks
   ========================================================================== */
function renderWebhooks(view) {
  const data = store.load();
  const deliveries = data.webhooks.flatMap((w) => w.deliveries.map((d) => ({ ...d, url: w.url })));

  view.append(el('section', { class: 'view-head reveal' }, [
    el('div', {}, [
      el('h2', { class: 'h3', text: 'Webhook endpoints' }),
      el('p', { class: 'small muted', text: 'Receive signed events when payouts and payments change state.' }),
    ]),
    el('button', { class: 'btn btn-primary', text: 'Add endpoint', onClick: openNewWebhook }),
  ]));

  view.append(el('section', { class: 'grid auto-fit reveal reveal-1' }, data.webhooks.map((w) => el('article', { class: 'card card-pad' }, [
    el('div', { class: 'row between gap-3' }, [
      el('span', { class: 'mono small', style: 'color:var(--text-1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap', text: w.url }),
      el('span', { class: 'badge badge-success' }, [el('span', { class: 'badge-dot' }), 'Active']),
    ]),
    el('div', { class: 'row gap-2 wrap', style: 'margin-top:var(--s-4)' },
      w.events.map((e) => el('span', { class: 'chip tiny mono', text: e }))),
    el('div', { class: 'detail-row', style: 'margin-top:var(--s-4)' }, [
      el('span', { class: 'detail-key', text: 'Signing secret' }),
      el('span', { class: 'detail-val mono small', text: 'whsec_••••••••••••' }),
    ]),
  ]))));

  view.append(el('section', { class: 'card reveal reveal-2' }, [
    el('div', { class: 'card-pad', style: 'padding-bottom:0' }, [
      el('h3', { class: 'h3', text: 'Recent deliveries' }),
      el('p', { class: 'small muted', text: 'Failed deliveries retry with exponential backoff.' }),
    ]),
    el('div', { class: 'table-wrap', style: 'border:0;border-radius:0;margin-top:var(--s-4)' }, [
      el('table', {}, [
        el('thead', {}, [el('tr', {}, [
          el('th', { text: 'Event' }), el('th', { text: 'Endpoint' }),
          el('th', { class: 'text-right', text: 'Attempts' }),
          el('th', { text: 'Status' }), el('th', { class: 'text-right', text: 'When' }),
        ])]),
        el('tbody', {}, deliveries.map((d) => el('tr', {}, [
          el('td', {}, [el('span', { class: 'badge badge-brand mono', text: d.event })]),
          el('td', { class: 'small mono muted', style: 'max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', text: d.url }),
          el('td', { class: 'text-right tabular small', text: d.attempts }),
          el('td', {}, [statusBadge(d.status)]),
          el('td', { class: 'text-right small muted', text: relTime(d.created_at) }),
        ]))),
      ]),
    ]),
  ]));
}

/* ==========================================================================
   API keys
   ========================================================================== */
function renderApi(view) {
  const data = store.load();
  view.append(el('section', { class: 'view-head reveal' }, [
    el('div', {}, [
      el('h2', { class: 'h3', text: 'API keys' }),
      el('p', { class: 'small muted', text: 'Authenticate server-side requests with a bearer key. Never expose keys in client code.' }),
    ]),
    el('button', { class: 'btn btn-primary', text: 'Create key', onClick: openNewKey }),
  ]));

  view.append(el('section', { class: 'card reveal reveal-1' }, [
    el('div', { class: 'table-wrap', style: 'border:0;border-radius:0' }, [
      el('table', {}, [
        el('thead', {}, [el('tr', {}, [
          el('th', { text: 'Name' }), el('th', { text: 'Key' }),
          el('th', { text: 'Mode' }), el('th', { text: 'Last used' }),
          el('th', { text: 'Status' }), el('th', { class: 'text-right', text: '' }),
        ])]),
        el('tbody', {}, data.api_keys.map((k) => el('tr', {}, [
          el('td', { style: 'color:var(--text-1);font-weight:600', text: k.name }),
          el('td', { class: 'mono small', text: `${k.prefix}_••••••••${(k.id || '').slice(-4)}` }),
          el('td', {}, [el('span', { class: `badge ${k.mode === 'live' ? 'badge-danger' : 'badge-info'}`, text: k.mode === 'live' ? 'Live' : 'Test' })]),
          el('td', { class: 'small muted', text: k.last_used_at ? relTime(k.last_used_at) : 'Never' }),
          el('td', {}, [k.revoked_at ? statusBadge('revoked') : statusBadge('active')]),
          el('td', { class: 'text-right' }, [
            k.revoked_at ? null : el('button', {
              class: 'btn btn-sm btn-ghost', text: 'Revoke',
              onClick: () => revokeKey(k),
            }),
          ]),
        ]))),
      ]),
    ]),
  ]));

  view.append(el('section', { class: 'card card-pad reveal reveal-2' }, [
    el('h3', { class: 'h3', text: 'Quickstart' }),
    el('p', { class: 'small muted', style: 'margin-top:var(--s-2)', text: 'Create a payout with an idempotency key so retries never double-pay.' }),
    el('div', { class: 'code', style: 'margin-top:var(--s-4)' }, [
      el('span', { class: 'c-cmt', text: '# Create a payout\n' }),
      el('span', { class: 'c-key', text: 'curl' }),
      ' -X POST https://api.payoutflow.dev/v1/payouts \\\n',
      '  -H ', el('span', { class: 'c-str', text: '"Authorization: Bearer $PAYOUTFLOW_KEY"' }), ' \\\n',
      '  -H ', el('span', { class: 'c-str', text: '"Idempotency-Key: 8f2c41-001"' }), ' \\\n',
      '  -d ', el('span', { class: 'c-str', text: '\'{ "recipient_id": "rcp_demo_01", "amount": 250.00, "currency": "USD" }\'' }),
    ]),
  ]));
}

function revokeKey(key) {
  modal({
    title: 'Revoke API key?',
    body: el('p', { class: 'small muted', text: `Requests using “${key.name}” will start failing immediately. This cannot be undone.` }),
    actions: [
      { label: 'Cancel', class: 'btn-ghost' },
      {
        label: 'Revoke key',
        class: 'btn-danger',
        onClick: (close) => {
          store.revokeApiKey(key.id);
          store.logAudit('api_key.revoked', key.id);
          close();
          toast('API key revoked', { tone: 'success' });
          render();
        },
      },
    ],
  });
}

/* ==========================================================================
   Settings
   ========================================================================== */
function renderSettings(view) {
  const data = store.load();
  const b = data.business;

  view.append(el('section', { class: 'grid', style: 'grid-template-columns:1fr 1fr' }, [
    el('div', { class: 'card card-pad reveal' }, [
      el('h3', { class: 'h3', text: 'Business profile' }),
      el('div', { style: 'margin-top:var(--s-4)' }, [
        detailRow('Business name', b.name),
        detailRow('Billing email', b.email),
        detailRow('Account ID', b.account_id, true),
        detailRow('Country', b.country),
        detailRow('Default currency', b.currency),
        detailRow('KYC status', b.kyc_status),
      ]),
    ]),
    el('div', { class: 'card card-pad reveal reveal-1' }, [
      el('h3', { class: 'h3', text: 'Compliance' }),
      el('p', { class: 'small muted', style: 'margin-top:var(--s-2)' },
        'In a production deployment this is where identity verification, sanctions screening and transaction monitoring live. This demo is pre-verified and moves no real money.'),
      el('div', { class: 'row gap-2 wrap', style: 'margin-top:var(--s-4)' }, [
        el('span', { class: 'badge badge-success' }, [el('span', { class: 'badge-dot' }), 'KYC verified']),
        el('span', { class: 'badge', text: 'Sanctions: clear' }),
        el('span', { class: 'badge', text: 'AML monitoring: on' }),
      ]),
      el('div', { class: 'hairline', style: 'margin:var(--s-5) 0' }),
      el('h3', { class: 'h3', text: 'Demo data' }),
      el('p', { class: 'small muted', style: 'margin-top:var(--s-2)' }, 'Reset the seeded demo dataset in this browser. Nothing leaves your device.'),
      el('button', {
        class: 'btn btn-danger', style: 'margin-top:var(--s-4)', text: 'Reset demo data',
        onClick: () => {
          store.reset();
          toast('Demo data reset', { tone: 'success' });
          render();
        },
      }),
    ]),
  ]));

  const fix = () => { view.firstChild.style.gridTemplateColumns = window.innerWidth < 900 ? '1fr' : '1fr 1fr'; };
  fix();
  window.addEventListener('resize', fix);
}

function detailRow(key, value, mono = false) {
  return el('div', { class: 'detail-row' }, [
    el('span', { class: 'detail-key', text: key }),
    el('span', { class: `detail-val ${mono ? 'mono' : ''}`, text: value }),
  ]);
}

/* ==========================================================================
   Modals / flows
   ========================================================================== */
function openNewPayout(preselectId) {
  const data = store.load();
  const active = data.recipients.filter((r) => r.status === 'active');
  if (!active.length) {
    toast('Add a recipient first', { tone: 'warn', title: 'No recipients' });
    return;
  }
  const balances = store.balances(data);

  const select = el('select', { class: 'select', id: 'poRecipient' },
    active.map((r) => el('option', { value: r.id, selected: r.id === preselectId ? '' : null },
      `${r.name} · ${r.currency}`)));

  const amountInput = el('input', { class: 'input', id: 'poAmount', type: 'number', min: '1', step: '0.01', placeholder: '0.00', value: '250.00' });
  const descInput = el('input', { class: 'input', id: 'poDesc', type: 'text', placeholder: 'Contractor invoice — March', value: 'Contractor invoice' });
  const feeLine = el('span', { class: 'small muted', text: '' });
  const totalLine = el('span', { class: 'tabular', style: 'color:var(--text-1);font-weight:650', text: '' });

  const updateFee = () => {
    const amount = Number(amountInput.value) || 0;
    const fee = store.PAYOUT_FEE(amount);
    feeLine.textContent = `${money(fee, 'USD')} (1% + 30¢)`;
    totalLine.textContent = money(amount + fee, 'USD');
  };
  amountInput.addEventListener('input', updateFee);
  updateFee();

  modal({
    title: 'Send a payout',
    body: el('div', { class: 'stack gap-4' }, [
      el('div', { class: 'field' }, [el('label', { class: 'label', for: 'poRecipient', text: 'Recipient' }), select]),
      el('div', { class: 'field' }, [
        el('label', { class: 'label', for: 'poAmount', text: 'Amount' }),
        el('div', { class: 'input-group' }, [el('span', { class: 'adorn', text: '$' }), amountInput]),
      ]),
      el('div', { class: 'field' }, [el('label', { class: 'label', for: 'poDesc', text: 'Description' }), descInput]),
      el('div', { class: 'card card-pad', style: 'background:rgba(4,5,10,.5)' }, [
        el('div', { class: 'row between' }, [el('span', { class: 'small muted', text: 'Processing fee' }), feeLine]),
        el('div', { class: 'row between', style: 'margin-top:var(--s-3)' }, [el('span', { class: 'small', text: 'Total debited' }), totalLine]),
      ]),
      el('p', { class: 'tiny muted', text: `Available: ${money(balances.find((x) => x.currency === 'USD').amount, 'USD')}` }),
    ]),
    actions: [
      { label: 'Cancel', class: 'btn-ghost' },
      {
        label: 'Send payout',
        class: 'btn-primary',
        onClick: (close) => {
          try {
            const payout = store.createPayout({
              recipientId: select.value,
              amount: amountInput.value,
              description: descInput.value,
            });
            store.logAudit('payout.created', payout.id);
            close();
            toast(`${money(payout.amount, payout.currency)} to ${payout.recipient_name}`, {
              tone: 'success', title: 'Payout submitted',
            });
            state.view = 'payouts';
            render();
          } catch (err) {
            toast(err.message, { tone: 'danger', title: 'Could not send payout' });
          }
        },
      },
    ],
  });
}

function openPayoutDetail(id) {
  const data = store.load();
  const p = data.payouts.find((x) => x.id === id);
  if (!p) return;

  const dotFor = (status) => (status === 'paid' ? 'done' : status === 'failed' || status === 'canceled' ? 'fail' : 'active');
  const glyphFor = (status) => (status === 'paid' ? '✓' : status === 'failed' ? '✕' : status === 'canceled' ? '–' : '•');

  modal({
    title: 'Payout detail',
    size: 'modal-lg',
    body: el('div', { class: 'stack gap-5' }, [
      el('div', { class: 'row between gap-4 wrap' }, [
        el('div', { class: 'row gap-3' }, [
          el('span', { class: 'avatar avatar-lg', text: initials(p.recipient_name) }),
          el('div', {}, [
            el('div', { style: 'color:var(--text-1);font-weight:650', text: p.recipient_name }),
            el('div', { class: 'tiny muted mono', text: p.reference }),
          ]),
        ]),
        statusBadge(p.status),
      ]),
      el('div', { class: 'grid grid-2' }, [
        el('div', {}, [
          detailRow('Amount', money(p.amount, p.currency)),
          detailRow('Fee', money(p.fee, p.currency)),
          detailRow('Total', money(p.amount + p.fee, p.currency)),
          detailRow('Method', labelMethod(p.method)),
        ]),
        el('div', {}, [
          detailRow('Provider', p.provider),
          detailRow('Provider ref', p.provider_ref || '—', true),
          detailRow('Created', dateTime(p.created_at)),
          detailRow('Updated', dateTime(p.updated_at)),
        ]),
      ]),
      el('div', {}, [
        el('h4', { class: 'small', style: 'color:var(--text-1);font-weight:650;margin-bottom:var(--s-4)', text: 'Timeline' }),
        el('div', { class: 'timeline' }, p.events.map((e) => el('div', { class: 'tl-item' }, [
          el('span', { class: `tl-dot ${dotFor(e.status)}`, text: glyphFor(e.status) }),
          el('div', {}, [
            el('div', { class: 'tl-title', text: e.status[0].toUpperCase() + e.status.slice(1) }),
            el('div', { class: 'tl-meta', text: `${e.message} · ${dateTime(e.created_at)}` }),
          ]),
        ]))),
      ]),
    ]),
    actions: p.status === 'paid' || p.status === 'failed'
      ? [{ label: 'Close', class: 'btn-primary' }]
      : [
          { label: 'Close', class: 'btn-ghost' },
          {
            label: 'Cancel payout',
            class: 'btn-danger',
            onClick: (close) => {
              const s = store.load();
              const target = s.payouts.find((x) => x.id === id);
              if (target && (target.status === 'queued' || target.status === 'processing')) {
                target.status = 'canceled';
                target.updated_at = new Date().toISOString();
                target.events.push({ id: uid('pev'), status: 'canceled', message: 'Canceled before delivery; funds released', created_at: target.updated_at });
                store.save();
                store.logAudit('payout.canceled', id);
                toast('Payout canceled and funds released', { tone: 'success' });
              }
              close();
              render();
            },
          },
        ],
  });
}

function openNewRecipient() {
  const nameInput = el('input', { class: 'input', placeholder: 'Adaeze Okafor' });
  const typeSelect = el('select', { class: 'select' }, [
    el('option', { value: 'bank_account', text: 'Bank account' }),
    el('option', { value: 'mobile_money', text: 'Mobile money' }),
    el('option', { value: 'wallet', text: 'Wallet' }),
    el('option', { value: 'card', text: 'Card (tokenized)' }),
  ]);
  const currencySelect = el('select', { class: 'select' },
    ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'PHP', 'INR'].map((c) => el('option', { value: c, text: c })));
  const countryInput = el('input', { class: 'input', placeholder: 'NG', maxlength: '2' });
  const bankInput = el('input', { class: 'input', placeholder: 'Bank name' });
  const acctInput = el('input', { class: 'input', placeholder: 'Account number' });

  modal({
    title: 'Add recipient',
    body: el('div', { class: 'stack gap-4' }, [
      el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Full name' }), nameInput]),
      el('div', { class: 'grid grid-2' }, [
        el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Type' }), typeSelect]),
        el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Currency' }), currencySelect]),
      ]),
      el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Country (ISO-2)' }), countryInput]),
      el('div', { class: 'grid grid-2' }, [
        el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Bank name' }), bankInput]),
        el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Account number' }), acctInput]),
      ]),
      el('p', { class: 'tiny muted', text: 'Demo only — details are stored in your browser and never transmitted.' }),
    ]),
    actions: [
      { label: 'Cancel', class: 'btn-ghost' },
      {
        label: 'Add recipient',
        class: 'btn-primary',
        onClick: (close) => {
          if (!nameInput.value.trim()) return toast('Enter a recipient name', { tone: 'warn' });
          const recipient = store.addRecipient({
            name: nameInput.value.trim(),
            type: typeSelect.value,
            country: (countryInput.value || 'US').toUpperCase(),
            currency: currencySelect.value,
            details: {
              bank_name: bankInput.value || '—',
              account_number: acctInput.value || '•••• 0000',
              account_name: nameInput.value.trim(),
            },
          });
          store.logAudit('recipient.created', recipient.id);
          close();
          toast(`${recipient.name} added`, { tone: 'success', title: 'Recipient created' });
          render();
        },
      },
    ],
  });
}

function openNewCheckout() {
  const amountInput = el('input', { class: 'input', type: 'number', min: '1', step: '0.01', value: '199.00' });
  const descInput = el('input', { class: 'input', type: 'text', value: 'Order #1042' });
  const emailInput = el('input', { class: 'input', type: 'email', placeholder: 'customer@example.com' });

  modal({
    title: 'Create checkout session',
    body: el('div', { class: 'stack gap-4' }, [
      el('div', { class: 'field' }, [
        el('label', { class: 'label', text: 'Amount (USD)' }),
        el('div', { class: 'input-group' }, [el('span', { class: 'adorn', text: '$' }), amountInput]),
      ]),
      el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Description' }), descInput]),
      el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Customer email' }), emailInput]),
      el('p', { class: 'tiny muted', text: 'A hosted payment page URL is generated for the customer.' }),
    ]),
    actions: [
      { label: 'Cancel', class: 'btn-ghost' },
      {
        label: 'Create session',
        class: 'btn-primary',
        onClick: (close) => {
          try {
            const session = store.createCheckoutSession({
              amount: amountInput.value,
              description: descInput.value,
              customerEmail: emailInput.value,
            });
            store.logAudit('checkout.created', session.id);
            close();
            toast(`${money(session.amount, session.currency)} · ${session.reference}`, {
              tone: 'success', title: 'Checkout session created',
            });
            state.view = 'checkout';
            render();
          } catch (err) {
            toast(err.message, { tone: 'danger' });
          }
        },
      },
    ],
  });
}

function openNewWebhook() {
  const urlInput = el('input', { class: 'input', type: 'url', placeholder: 'https://api.example.com/webhooks' });
  const events = ['payout.paid', 'payout.failed', 'payout.canceled', 'checkout.paid', 'checkout.failed'];
  const boxes = events.map((e) => el('label', { class: 'checkbox' }, [
    el('input', { type: 'checkbox', checked: e.startsWith('payout') ? '' : null, value: e }),
    el('span', { class: 'mono small', text: e }),
  ]));

  modal({
    title: 'Add webhook endpoint',
    body: el('div', { class: 'stack gap-4' }, [
      el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Endpoint URL' }), urlInput]),
      el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Subscribe to events' }), el('div', { class: 'stack gap-2' }, boxes)]),
      el('p', { class: 'tiny muted', text: 'Payloads are signed with HMAC-SHA256 in the X-PayoutFlow-Signature header.' }),
    ]),
    actions: [
      { label: 'Cancel', class: 'btn-ghost' },
      {
        label: 'Add endpoint',
        class: 'btn-primary',
        onClick: (close) => {
          if (!/^https?:\/\//.test(urlInput.value)) return toast('Enter a valid http(s) URL', { tone: 'warn' });
          const selected = boxes.filter((b) => b.querySelector('input').checked).map((b) => b.querySelector('input').value);
          store.addWebhookEndpoint({ url: urlInput.value, events: selected.length ? selected : events });
          store.logAudit('webhook.created');
          close();
          toast('Endpoint added', { tone: 'success', title: 'Webhook created' });
          render();
        },
      },
    ],
  });
}

function openNewKey() {
  const nameInput = el('input', { class: 'input', placeholder: 'Production server' });
  const modeSelect = el('select', { class: 'select' }, [
    el('option', { value: 'test', text: 'Test' }),
    el('option', { value: 'live', text: 'Live' }),
  ]);

  modal({
    title: 'Create API key',
    body: el('div', { class: 'stack gap-4' }, [
      el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Key name' }), nameInput]),
      el('div', { class: 'field' }, [el('label', { class: 'label', text: 'Mode' }), modeSelect]),
      el('p', { class: 'tiny muted', text: 'The secret is shown once. Store it in your server environment, never in client code.' }),
    ]),
    actions: [
      { label: 'Cancel', class: 'btn-ghost' },
      {
        label: 'Create key',
        class: 'btn-primary',
        onClick: (close) => {
          if (!nameInput.value.trim()) return toast('Enter a key name', { tone: 'warn' });
          const key = store.addApiKey({ name: nameInput.value.trim(), mode: modeSelect.value });
          store.logAudit('api_key.created', key.id);
          close();
          showSecret(key.secret);
          render();
        },
      },
    ],
  });
}

function showSecret(secret) {
  modal({
    title: 'Save your API key',
    body: el('div', { class: 'stack gap-4' }, [
      el('p', { class: 'small muted', text: 'Copy this key now — it will not be shown again.' }),
      el('div', { class: 'copy-field' }, [el('span', { text: secret })]),
      el('button', {
        class: 'btn btn-block', text: 'Copy to clipboard',
        onClick: () => navigator.clipboard?.writeText(secret)
          .then(() => toast('Copied to clipboard', { tone: 'success' }))
          .catch(() => toast('Copy failed — select manually', { tone: 'warn' })),
      }),
    ]),
    actions: [{ label: 'Done', class: 'btn-primary' }],
  });
}

function openTopUp() {
  const amountInput = el('input', { class: 'input', type: 'number', min: '10', step: '10', value: '10000' });
  modal({
    title: 'Add sandbox funds',
    body: el('div', { class: 'stack gap-4' }, [
      el('p', { class: 'small muted', text: 'Credit your sandbox balance to test payouts. No real money moves.' }),
      el('div', { class: 'field' }, [
        el('label', { class: 'label', text: 'Amount (USD)' }),
        el('div', { class: 'input-group' }, [el('span', { class: 'adorn', text: '$' }), amountInput]),
      ]),
    ]),
    actions: [
      { label: 'Cancel', class: 'btn-ghost' },
      {
        label: 'Add funds',
        class: 'btn-primary',
        onClick: (close) => {
          const amount = Number(amountInput.value);
          if (!Number.isFinite(amount) || amount <= 0) return toast('Enter a valid amount', { tone: 'warn' });
          const data = store.load();
          data.ledger.unshift({
            id: uid('txn'), type: 'sandbox_topup', direction: 'credit', amount, currency: 'USD',
            description: 'Sandbox funding', created_at: new Date().toISOString(),
          });
          store.save();
          store.logAudit('sandbox.funded');
          close();
          toast(`${money(amount, 'USD')} added`, { tone: 'success', title: 'Balance funded' });
          render();
        },
      },
    ],
  });
}

/* ==========================================================================
   Shell wiring
   ========================================================================== */
function go(viewName) {
  state.view = viewName;
  state.search = '';
  state.payoutPage = 0;
  const search = $('#globalSearch');
  if (search) search.value = '';
  if (location.hash !== `#${viewName}`) history.replaceState(null, '', `#${viewName}`);
  render();
}

function closeSidebar() {
  $('#sidebar')?.classList.remove('open');
  $('#sidebarBackdrop')?.classList.remove('show');
}

function init() {
  const data = store.load();
  $('#bizName').textContent = data.business.name;
  $('#bizAvatar').textContent = initials(data.business.name);

  const updateCounts = () => {
    const d = store.load();
    $('#navPayoutCount').textContent = number(d.payouts.length);
    $('#navRecipientCount').textContent = number(d.recipients.filter((r) => r.status === 'active').length);
  };
  updateCounts();

  $('#sidebarNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (btn) go(btn.dataset.view);
  });

  $('#menuBtn').addEventListener('click', () => {
    $('#sidebar').classList.toggle('open');
    $('#sidebarBackdrop').classList.toggle('show');
  });
  $('#sidebarBackdrop').addEventListener('click', closeSidebar);

  $('#newPayoutBtn').addEventListener('click', () => openNewPayout());

  let searchTimer;
  $('#globalSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = e.target.value.trim();
      state.payoutPage = 0;
      if (state.view !== 'payouts' && state.view !== 'recipients') state.view = 'payouts';
      render();
    }, 180);
  });

  window.addEventListener('payoutflow:updated', () => {
    updateCounts();
    if (state.view === 'overview' || state.view === 'payouts') render();
  });

  // Deep link: dashboard.html#webhooks
  const fromHash = () => location.hash.replace('#', '');
  if (VIEW_META[fromHash()]) state.view = fromHash();

  window.addEventListener('hashchange', () => {
    const target = fromHash();
    if (VIEW_META[target] && target !== state.view) {
      state.view = target;
      render();
    }
  });

  render();
}

document.addEventListener('DOMContentLoaded', init);
