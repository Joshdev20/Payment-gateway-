/* ==========================================================================
   Demo store — all data is generated locally and kept in this browser only.
   Nothing is sent anywhere. No user input is transmitted or persisted remotely.
   ========================================================================== */

import { uid } from './app.js?v=4';

const KEY = 'payoutflow.demo.v1';

const BUSINESS = {
  name: 'Northwind Labs',
  email: 'finance@northwindlabs.demo',
  country: 'US',
  currency: 'USD',
  kyc_status: 'verified',
  brand_color: '#6366f1',
  account_id: 'acct_demo_9f2c41',
};

const RECIPIENT_SEEDS = [
  { name: 'Adaeze Okafor', type: 'bank_account', country: 'NG', currency: 'NGN', details: { bank_name: 'Zenith Bank', account_number: '•••• 4821', account_name: 'Adaeze Okafor' } },
  { name: 'Marcus Reyes', type: 'mobile_money', country: 'PH', currency: 'PHP', details: { provider: 'GCash', phone: '+63 •••• 118', account_name: 'Marcus Reyes' } },
  { name: 'Lena Kowalski', type: 'wallet', country: 'PL', currency: 'EUR', details: { network: 'USDC (Polygon)', address: '0x7a2f••••9c41' } },
  { name: 'Tunde Balogun', type: 'bank_account', country: 'NG', currency: 'NGN', details: { bank_name: 'GTBank', account_number: '•••• 7730', account_name: 'Tunde Balogun' } },
  { name: 'Sofia Marchetti', type: 'bank_account', country: 'IT', currency: 'EUR', details: { bank_name: 'UniCredit', account_number: '•••• 2210', account_name: 'Sofia Marchetti' } },
  { name: 'Daniel Mwangi', type: 'mobile_money', country: 'KE', currency: 'KES', details: { provider: 'M-Pesa', phone: '+254 •••• 502', account_name: 'Daniel Mwangi' } },
  { name: 'Priya Nair', type: 'bank_account', country: 'IN', currency: 'INR', details: { bank_name: 'HDFC Bank', account_number: '•••• 9917', account_name: 'Priya Nair' } },
  { name: 'Elena Petrova', type: 'card', country: 'GB', currency: 'GBP', details: { brand: 'Visa', last4: '4242', token: 'tok_demo_••••' } },
];

const DESCRIPTIONS = [
  'Contractor invoice — March',
  'Marketplace seller payout',
  'Affiliate commission',
  'Design retainer',
  'Freelance milestone 2',
  'Creator fund distribution',
  'Supplier settlement',
  'Referral bonus batch',
];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedRecipients() {
  return RECIPIENT_SEEDS.map((r, i) => ({
    id: `rcp_demo_${String(i + 1).padStart(2, '0')}`,
    ...r,
    email: `${r.name.split(' ')[0].toLowerCase()}@example.com`,
    status: 'active',
    created_at: new Date(Date.now() - (i + 3) * 86400_000).toISOString(),
  }));
}

function seedPayouts(recipients) {
  const rand = mulberry32(20261106);
  const payouts = [];
  const statuses = ['paid', 'paid', 'paid', 'paid', 'processing', 'queued', 'failed', 'paid', 'paid', 'canceled'];

  for (let i = 0; i < 68; i += 1) {
    const recipient = recipients[Math.floor(rand() * recipients.length)];
    const amount = Math.round((120 + rand() * 9800) * 100) / 100;
    const status = statuses[Math.floor(rand() * statuses.length)];
    const fee = Math.max(0.5, Math.min(50, amount * 0.01 + 0.3));
    const created = new Date(Date.now() - Math.floor(rand() * 45 * 86400_000));
    const events = [{ id: uid('pev'), status: 'queued', message: 'Payout created and funds reserved', created_at: created.toISOString() }];

    if (status !== 'queued') {
      events.push({ id: uid('pev'), status: 'processing', message: 'Submitted to provider', created_at: new Date(created.getTime() + 400).toISOString() });
    }
    if (status === 'paid') {
      events.push({ id: uid('pev'), status: 'paid', message: 'Funds delivered to recipient', created_at: new Date(created.getTime() + 1800).toISOString() });
    }
    if (status === 'failed') {
      events.push({ id: uid('pev'), status: 'failed', message: 'Failed: recipient bank rejected the transfer', created_at: new Date(created.getTime() + 1500).toISOString() });
    }
    if (status === 'canceled') {
      events.push({ id: uid('pev'), status: 'canceled', message: 'Canceled before delivery; funds released', created_at: new Date(created.getTime() + 900).toISOString() });
    }

    payouts.push({
      id: `po_demo_${String(i + 1).padStart(3, '0')}`,
      reference: `po_${Math.random().toString(36).slice(2, 12)}`,
      recipient_id: recipient.id,
      recipient_name: recipient.name,
      recipient_type: recipient.type,
      amount,
      fee,
      currency: recipient.currency,
      method: recipient.type === 'mobile_money' ? 'mobile_money' : recipient.type === 'wallet' ? 'wallet_transfer' : recipient.type === 'card' ? 'card_payout' : 'bank_transfer',
      status,
      provider: 'sandbox',
      provider_ref: status === 'queued' ? null : `sbx_po_${Math.random().toString(36).slice(2, 14)}`,
      description: DESCRIPTIONS[Math.floor(rand() * DESCRIPTIONS.length)],
      failure_reason: status === 'failed' ? 'Recipient bank rejected the transfer' : null,
      created_at: created.toISOString(),
      updated_at: new Date(created.getTime() + 2000).toISOString(),
      events,
    });
  }
  return payouts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function seedLedger(payouts) {
  const entries = [{
    id: uid('txn'), type: 'sandbox_topup', direction: 'credit', amount: 50000, currency: 'USD',
    description: 'Opening sandbox balance', created_at: new Date(Date.now() - 60 * 86400_000).toISOString(),
  }, {
    id: uid('txn'), type: 'payment_received', direction: 'credit', amount: 12500, currency: 'USD',
    description: 'Checkout cs_demo_1182', created_at: new Date(Date.now() - 12 * 86400_000).toISOString(),
  }, {
    id: uid('txn'), type: 'payment_received', direction: 'credit', amount: 8420.5, currency: 'USD',
    description: 'Checkout cs_demo_4471', created_at: new Date(Date.now() - 6 * 86400_000).toISOString(),
  }];

  for (const p of payouts) {
    if (p.currency !== 'USD') continue;
    if (p.status === 'failed' || p.status === 'canceled') continue;
    entries.push({
      id: uid('txn'), type: 'payout_debit', direction: 'debit', amount: p.amount + p.fee, currency: p.currency,
      description: `Payout to ${p.recipient_name}`, reference: p.reference, created_at: p.created_at,
    });
  }
  return entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function seedCheckout() {
  const rand = mulberry32(778811);
  const out = [];
  for (let i = 0; i < 24; i += 1) {
    const amount = Math.round((45 + rand() * 2400) * 100) / 100;
    const paid = rand() > 0.22;
    const created = new Date(Date.now() - Math.floor(rand() * 30 * 86400_000));
    out.push({
      id: `cs_demo_${String(i + 1).padStart(4, '0')}`,
      reference: `cs_${Math.random().toString(36).slice(2, 12)}`,
      amount,
      fee: Math.round((amount * 0.029 + 0.3) * 100) / 100,
      currency: 'USD',
      description: 'Order payment',
      customer_email: `customer${i + 1}@example.com`,
      status: paid ? 'paid' : 'requires_payment',
      created_at: created.toISOString(),
      paid_at: paid ? new Date(created.getTime() + 120000).toISOString() : null,
    });
  }
  return out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function seedWebhooks() {
  return [{
    id: 'whe_demo_01',
    url: 'https://api.northwindlabs.example/webhooks/payoutflow',
    events: ['payout.paid', 'payout.failed', 'checkout.paid'],
    active: true,
    created_at: new Date(Date.now() - 20 * 86400_000).toISOString(),
    deliveries: Array.from({ length: 8 }, (_, i) => ({
      id: `whd_demo_${String(i + 1).padStart(2, '0')}`,
      event: ['payout.paid', 'payout.failed', 'checkout.paid'][i % 3],
      status: i === 3 ? 'failed' : i === 6 ? 'pending' : 'delivered',
      attempts: i === 3 ? 6 : i === 6 ? 1 : 1,
      response_code: i === 3 ? 500 : 200,
      error: i === 3 ? 'HTTP 500' : null,
      created_at: new Date(Date.now() - i * 3600_000).toISOString(),
    })),
  }];
}

function seedAudit() {
  const actions = [
    ['org.login', 'dashboard:finance@northwindlabs.demo'],
    ['payout.created', 'api:key_demo_01'],
    ['recipient.created', 'dashboard:finance@northwindlabs.demo'],
    ['api_key.created', 'dashboard:finance@northwindlabs.demo'],
    ['kyc.verified', 'system'],
    ['webhook.created', 'dashboard:finance@northwindlabs.demo'],
    ['payout.paid', 'system'],
    ['org.updated', 'dashboard:finance@northwindlabs.demo'],
  ];
  return actions.map(([action, actor], i) => ({
    id: `aud_demo_${String(i + 1).padStart(2, '0')}`,
    action,
    actor,
    target: null,
    created_at: new Date(Date.now() - i * 5400_000).toISOString(),
    ip: '203.0.113.42',
  }));
}

function seedApiKeys() {
  return [
    { id: 'key_demo_01', name: 'Production server', mode: 'test', prefix: 'sk_test', created_at: new Date(Date.now() - 18 * 86400_000).toISOString(), last_used_at: new Date(Date.now() - 3600_000).toISOString(), revoked_at: null },
    { id: 'key_demo_02', name: 'Staging', mode: 'test', prefix: 'sk_test', created_at: new Date(Date.now() - 9 * 86400_000).toISOString(), last_used_at: new Date(Date.now() - 86400_000).toISOString(), revoked_at: null },
  ];
}

function buildInitial() {
  const recipients = seedRecipients();
  const payouts = seedPayouts(recipients);
  return {
    business: BUSINESS,
    recipients,
    payouts,
    ledger: seedLedger(payouts),
    checkout: seedCheckout(),
    webhooks: seedWebhooks(),
    audit: seedAudit(),
    api_keys: seedApiKeys(),
  };
}

let cache = null;

export function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw);
      return cache;
    }
  } catch {
    // Storage unavailable (private mode): fall back to an in-memory session.
  }
  cache = buildInitial();
  save();
  return cache;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Non-fatal: the demo keeps working from memory.
  }
}

export function reset() {
  cache = buildInitial();
  save();
  return cache;
}

/* ---- Derived values ----------------------------------------------------- */
export const PAYOUT_FEE = (amount) => Math.max(0.5, Math.min(50, Math.round((amount * 0.01 + 0.3) * 100) / 100));

export function balances(store = load()) {
  const usd = store.ledger.reduce(
    (acc, e) => acc + (e.currency === 'USD' ? (e.direction === 'credit' ? e.amount : -e.amount) : 0),
    0,
  );
  return [
    { currency: 'USD', amount: usd },
    { currency: 'NGN', amount: 8420000 },
    { currency: 'EUR', amount: 41250.75 },
  ];
}

export function payoutStats(store = load()) {
  const byStatus = {};
  let paid = 0; let pending = 0; let failed = 0;
  for (const p of store.payouts) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    if (p.status === 'paid') paid += p.amount;
    else if (p.status === 'failed' || p.status === 'canceled') failed += p.amount;
    else pending += p.amount;
  }
  return { count: store.payouts.length, paid, pending, failed, byStatus };
}

export function volumeSeries(store = load(), days = 14) {
  const buckets = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    const dayPayouts = store.payouts.filter((p) => p.created_at.slice(0, 10) === key);
    buckets.push({
      day: key,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      paid: dayPayouts.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amount, 0),
      count: dayPayouts.length,
    });
  }
  return buckets;
}

export function createPayout({ recipientId, amount, description }) {
  const store = load();
  const recipient = store.recipients.find((r) => r.id === recipientId);
  if (!recipient) throw new Error('Recipient not found');
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) throw new Error('Enter a valid amount');
  const fee = PAYOUT_FEE(numeric);

  const usd = balances(store).find((b) => b.currency === 'USD').amount;
  if (recipient.currency === 'USD' && usd < numeric + fee) {
    throw new Error('Insufficient available balance for this payout');
  }

  const now = new Date().toISOString();
  const payout = {
    id: uid('po_demo'),
    reference: `po_${Math.random().toString(36).slice(2, 12)}`,
    recipient_id: recipient.id,
    recipient_name: recipient.name,
    recipient_type: recipient.type,
    amount: numeric,
    fee,
    currency: recipient.currency,
    method: recipient.type === 'mobile_money' ? 'mobile_money' : recipient.type === 'wallet' ? 'wallet_transfer' : recipient.type === 'card' ? 'card_payout' : 'bank_transfer',
    status: 'processing',
    provider: 'sandbox',
    provider_ref: `sbx_po_${Math.random().toString(36).slice(2, 14)}`,
    description: description || 'Payout',
    failure_reason: null,
    created_at: now,
    updated_at: now,
    events: [
      { id: uid('pev'), status: 'queued', message: 'Payout created and funds reserved', created_at: now },
      { id: uid('pev'), status: 'processing', message: 'Submitted to provider', created_at: now },
    ],
  };

  store.payouts.unshift(payout);
  store.ledger.unshift({
    id: uid('txn'), type: 'payout_debit', direction: 'debit',
    amount: numeric + fee, currency: recipient.currency,
    description: `Payout to ${recipient.name}`, reference: payout.reference, created_at: now,
  });

  // Simulate asynchronous settlement shortly after submission.
  setTimeout(() => {
    const s = load();
    const target = s.payouts.find((p) => p.id === payout.id);
    if (!target || target.status !== 'processing') return;
    target.status = 'paid';
    target.updated_at = new Date().toISOString();
    target.events.push({
      id: uid('pev'), status: 'paid', message: 'Funds delivered to recipient',
      created_at: target.updated_at,
    });
    save();
    window.dispatchEvent(new CustomEvent('payoutflow:updated'));
  }, 2200);

  save();
  return payout;
}

export function addRecipient({ name, type, country, currency, details }) {
  const store = load();
  const recipient = {
    id: uid('rcp_demo'),
    name,
    type,
    country,
    currency,
    details,
    email: null,
    status: 'active',
    created_at: new Date().toISOString(),
  };
  store.recipients.unshift(recipient);
  save();
  return recipient;
}

export function addApiKey({ name, mode = 'test' }) {
  const store = load();
  const secret = `sk_${mode}_${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`;
  const key = {
    id: uid('key_demo'),
    name,
    mode,
    prefix: `sk_${mode}`,
    created_at: new Date().toISOString(),
    last_used_at: null,
    revoked_at: null,
    secret,
  };
  store.api_keys.unshift(key);
  save();
  return key;
}

export function revokeApiKey(id) {
  const store = load();
  const key = store.api_keys.find((k) => k.id === id);
  if (key) key.revoked_at = new Date().toISOString();
  save();
  return key;
}

export function addWebhookEndpoint({ url, events }) {
  const store = load();
  const endpoint = {
    id: uid('whe_demo'),
    url,
    events,
    active: true,
    created_at: new Date().toISOString(),
    secret: `whsec_${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 10)}`,
    deliveries: [],
  };
  store.webhooks.unshift(endpoint);
  save();
  return endpoint;
}

export function logAudit(action, target = null) {
  const store = load();
  store.audit.unshift({
    id: uid('aud_demo'),
    action,
    actor: `dashboard:${store.business.email}`,
    target,
    created_at: new Date().toISOString(),
    ip: '203.0.113.42',
  });
  save();
}

export function createCheckoutSession({ amount, currency = 'USD', description, customerEmail }) {
  const store = load();
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) throw new Error('Enter a valid amount');
  const session = {
    id: uid('cs_demo'),
    reference: `cs_${Math.random().toString(36).slice(2, 12)}`,
    amount: numeric,
    fee: Math.round((numeric * 0.029 + 0.3) * 100) / 100,
    currency,
    description: description || 'Order payment',
    customer_email: customerEmail || 'customer@example.com',
    status: 'requires_payment',
    created_at: new Date().toISOString(),
    paid_at: null,
  };
  store.checkout.unshift(session);
  save();
  return session;
}

export function markCheckoutPaid(id) {
  const store = load();
  const session = store.checkout.find((s) => s.id === id);
  if (!session) return null;
  if (session.status === 'paid') return session;
  session.status = 'paid';
  session.paid_at = new Date().toISOString();
  store.ledger.unshift({
    id: uid('txn'), type: 'payment_received', direction: 'credit',
    amount: session.amount - session.fee, currency: session.currency,
    description: `Checkout ${session.reference}`, reference: session.reference,
    created_at: session.paid_at,
  });
  save();
  window.dispatchEvent(new CustomEvent('payoutflow:updated'));
  return session;
}

export const BUSINESS_INFO = BUSINESS;
