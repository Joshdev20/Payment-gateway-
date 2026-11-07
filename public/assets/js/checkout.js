import { $, $$, el, money, toast, uid, dateTime } from './app.js?v=4';
import * as store from './demo-store.js?v=4';

/* ==========================================================================
   Demo checkout.

   Important: this page performs NO network requests. The card fields exist to
   demonstrate the interaction design only — values are validated in the
   browser, used to render the live card preview, and then discarded. Nothing
   is transmitted, logged or persisted anywhere.
   ========================================================================== */

const TEST_CARDS = {
  4242424242424242: 'succeeds',
  4000000000000002: 'declined',
  4000000000009995: 'declined',
};

let amount = 199;
let session = null;

/* ---- Amount from URL, e.g. checkout.html?amount=349.50&desc=Invoice%2012 */
const params = new URLSearchParams(location.search);
if (params.get('amount')) {
  const parsed = Number(params.get('amount'));
  if (Number.isFinite(parsed) && parsed > 0) amount = parsed;
}
const description = params.get('desc') || 'Order #1042';

function feeFor(value) {
  return Math.round((value * 0.029 + 0.3) * 100) / 100;
}

function renderSummary() {
  $('#summaryAmount').textContent = money(amount, 'USD');
  $('#lineSubtotal').textContent = money(amount, 'USD');
  $('#lineFee').textContent = money(feeFor(amount), 'USD');
  $('#lineTotal').textContent = money(amount, 'USD');
  $('#payBtnAmount').textContent = money(amount, 'USD');
  $('#walletAmount').textContent = `${amount.toFixed(2)} USDC`;
  $('#summaryDesc').textContent = description;
  $('#bankRef').textContent = `PF-${Math.round(amount)}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

/* ---- Card preview ------------------------------------------------------- */
function brandFor(digits) {
  if (/^4/.test(digits)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MASTERCARD';
  if (/^3[47]/.test(digits)) return 'AMEX';
  if (/^6(011|5)/.test(digits)) return 'DISCOVER';
  return 'CARD';
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function luhnValid(digits) {
  if (digits.length < 13) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function setupCardInputs() {
  const numberInput = $('#cardNumber');
  const expiryInput = $('#cardExpiry');
  const cvcInput = $('#cardCvc');
  const holderInput = $('#cardHolder');
  const emailInput = $('#cardEmail');

  numberInput.addEventListener('input', () => {
    const formatted = formatCardNumber(numberInput.value);
    numberInput.value = formatted;
    const digits = formatted.replace(/\D/g, '');
    $('#cardNumberDisplay').textContent = (digits.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim());
    $('#cardBrand').textContent = brandFor(digits);
    clearError('cardNumber');
  });

  expiryInput.addEventListener('input', () => {
    let v = expiryInput.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    expiryInput.value = v;
    $('#cardExpiryDisplay').textContent = v || 'MM/YY';
    clearError('cardExpiry');
  });

  cvcInput.addEventListener('input', () => {
    cvcInput.value = cvcInput.value.replace(/\D/g, '').slice(0, 4);
    clearError('cardCvc');
  });

  holderInput.addEventListener('input', () => {
    $('#cardHolderDisplay').textContent = (holderInput.value || 'YOUR NAME').toUpperCase();
    clearError('cardHolder');
  });

  emailInput.addEventListener('input', () => clearError('cardEmail'));

  $$('.test-card-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      numberInput.value = formatCardNumber(btn.dataset.testcard);
      numberInput.dispatchEvent(new Event('input'));
      if (!expiryInput.value) {
        expiryInput.value = '12/29';
        expiryInput.dispatchEvent(new Event('input'));
      }
      if (!cvcInput.value) cvcInput.value = '123';
      if (!holderInput.value) {
        holderInput.value = 'Ada Lovelace';
        holderInput.dispatchEvent(new Event('input'));
      }
      if (!emailInput.value) emailInput.value = 'ada@example.com';
      toast('Test card filled in', { tone: 'info' });
    });
  });
}

function setError(field, message) {
  const input = $(`#${field}`);
  const err = $(`#err${field[0].toUpperCase()}${field.slice(1)}`);
  input?.setAttribute('aria-invalid', 'true');
  if (err) err.textContent = message;
}

function clearError(field) {
  const input = $(`#${field}`);
  const err = $(`#err${field[0].toUpperCase()}${field.slice(1)}`);
  input?.removeAttribute('aria-invalid');
  if (err) err.textContent = '';
}

function validateCardForm() {
  let ok = true;
  const digits = $('#cardNumber').value.replace(/\D/g, '');
  const expiry = $('#cardExpiry').value;
  const cvc = $('#cardCvc').value;
  const holder = $('#cardHolder').value.trim();
  const email = $('#cardEmail').value.trim();

  if (!digits) { setError('cardNumber', 'Enter your card number'); ok = false; }
  else if (!luhnValid(digits)) { setError('cardNumber', 'That card number is not valid'); ok = false; }
  else if (!TEST_CARDS[digits]) { setError('cardNumber', 'Use a test card in sandbox mode'); ok = false; }

  if (!/^\d{2}\/\d{2}$/.test(expiry)) { setError('cardExpiry', 'Use MM/YY'); ok = false; }
  else {
    const [mm, yy] = expiry.split('/').map(Number);
    if (mm < 1 || mm > 12) { setError('cardExpiry', 'Invalid month'); ok = false; }
    else {
      const expiryDate = new Date(2000 + yy, mm, 0);
      if (expiryDate < new Date()) { setError('cardExpiry', 'Card has expired'); ok = false; }
    }
  }

  if (!/^\d{3,4}$/.test(cvc)) { setError('cardCvc', '3 or 4 digits'); ok = false; }
  if (holder.length < 2) { setError('cardHolder', 'Enter the name on the card'); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('cardEmail', 'Enter a valid email'); ok = false; }

  return ok;
}

/* ---- Method switching --------------------------------------------------- */
function selectMethod(method) {
  $$('.method').forEach((m) => m.setAttribute('aria-pressed', String(m.dataset.method === method)));
  const panes = { card: 'paneCard', bank: 'paneBank', mobile: 'paneMobile', wallet: 'paneWallet', crypto: 'paneCrypto', cash: 'paneCash' };
  Object.entries(panes).forEach(([key, id]) => { $(`#${id}`).hidden = key !== method; });

  const titles = {
    card: 'Pay with card',
    bank: 'Pay by bank transfer',
    mobile: 'Pay with mobile money',
    wallet: 'Pay with a digital wallet',
    crypto: 'Pay with crypto',
    cash: 'Pay with cash',
  };
  $('#panelTitle').textContent = titles[method];
}

/* ---- Decorative QR ------------------------------------------------------ */
function drawQr(holder) {
  if (!holder) return;
  // Deterministic pattern for visual purposes only — not a scannable code.
  const grid = el('div', { class: 'qr-grid' });
  let seed = 12345;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const isFinder = (r, c) => {
    const inBox = (br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, 14) || inBox(14, 0);
  };
  for (let r = 0; r < 21; r += 1) {
    for (let c = 0; c < 21; c += 1) {
      const cell = el('i');
      let on = false;
      if (isFinder(r, c)) {
        const br = r < 7 ? 0 : 14;
        const bc = c < 7 ? 0 : c >= 14 ? 14 : 0;
        const rr = r - br;
        const cc = c - bc;
        on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
      } else {
        on = rand() > 0.52;
      }
      if (on) cell.className = 'on';
      grid.append(cell);
    }
  }
  holder.innerHTML = '';
  holder.append(grid);
}

/* ---- Processing + receipt ---------------------------------------------- */
function showProcessing() {
  const node = el('div', { class: 'processing', id: 'processingOverlay' }, [el('div', { class: 'spinner' })]);
  document.body.append(node);
}
function hideProcessing() {
  $('#processingOverlay')?.remove();
}

function showReceipt(status, { reason = null } = {}) {
  session = store.createCheckoutSession({ amount, description, customerEmail: $('#cardEmail')?.value || 'customer@example.com' });
  if (status === 'paid') store.markCheckoutPaid(session.id);

  const shell = $('.checkout-shell');
  shell.innerHTML = `
    <div class="container" style="padding-block:var(--s-6)">
      <header class="checkout-top">
        <div class="merchant">
          <span class="merchant-mark">NL</span>
          <div>
            <div class="merchant-name">Northwind Labs</div>
            <div class="tiny muted">Sandbox checkout · test mode</div>
          </div>
        </div>
        <a href="index.html" class="btn btn-ghost btn-sm">Exit</a>
      </header>
    </div>

    <main class="checkout-main">
      <div class="container">
        <div class="receipt">
          <div class="success-ring" style="${status === 'paid' ? '' : 'background:rgba(244,63,94,.14);border-color:rgba(251,113,133,.4);color:var(--rose-400)'}">
            ${status === 'paid' ? '✓' : '✕'}
          </div>

          <div>
            <h1 class="h2">${status === 'paid' ? 'Payment successful' : 'Payment declined'}</h1>
            <p class="lead" style="margin-top:var(--s-3)">
              ${status === 'paid'
                ? `We received ${money(amount, 'USD')}. A receipt has been sent to your email.`
                : `We could not authorise this payment${reason ? `: ${reason}` : ''}. No funds were taken.`}
            </p>
          </div>

          <div class="card card-pad receipt-card">
            <div class="row between gap-4">
              <span class="small muted">Amount</span>
              <span class="tabular" style="color:var(--text-1);font-weight:650">${money(amount, 'USD')}</span>
            </div>
            <div class="receipt-dashed"></div>
            <div class="row between gap-4">
              <span class="small muted">Status</span>
              <span class="badge ${status === 'paid' ? 'badge-success' : 'badge-danger'}"><span class="badge-dot"></span>${status === 'paid' ? 'Paid' : 'Declined'}</span>
            </div>
            <div class="row between gap-4" style="margin-top:var(--s-3)">
              <span class="small muted">Reference</span>
              <span class="mono small">${session.reference}</span>
            </div>
            <div class="row between gap-4" style="margin-top:var(--s-3)">
              <span class="small muted">Date</span>
              <span class="small">${dateTime(new Date().toISOString())}</span>
            </div>
            <div class="row between gap-4" style="margin-top:var(--s-3)">
              <span class="small muted">Description</span>
              <span class="small">${description}</span>
            </div>
          </div>

          <div class="row gap-3 wrap center">
            ${status === 'paid'
              ? '<a class="btn btn-primary" href="dashboard.html">View in dashboard</a>'
              : '<button class="btn btn-primary" id="retryBtn">Try another card</button>'}
            <a class="btn" href="index.html">Back to home</a>
          </div>

          <p class="tiny muted" style="max-width:44ch">
            This is a demonstration. No real payment was processed and no card data was stored or transmitted.
          </p>
        </div>
      </div>
    </main>`;

  if (status !== 'paid') {
    $('#retryBtn')?.addEventListener('click', () => location.reload());
  }
  store.logAudit(status === 'paid' ? 'checkout.paid' : 'checkout.failed', session.id);
}

/* ---- Submit handlers ---------------------------------------------------- */
function handleCardSubmit(e) {
  e.preventDefault();
  if (!validateCardForm()) {
    toast('Please fix the highlighted fields', { tone: 'warn', title: 'Check your details' });
    return;
  }
  const digits = $('#cardNumber').value.replace(/\D/g, '');
  const scenario = TEST_CARDS[digits];

  showProcessing();
  // Simulated processor round-trip. No data leaves the browser.
  setTimeout(() => {
    hideProcessing();
    if (scenario === 'succeeds') showReceipt('paid');
    else showReceipt('failed', { reason: 'the card issuer declined the transaction' });
  }, 1500);
}

function handleManualPayment(label) {
  showProcessing();
  setTimeout(() => {
    hideProcessing();
    toast('Thanks — we are verifying your payment', { tone: 'success', title: 'Submitted' });
    showReceipt('paid');
  }, 1300);
}

/* ---- Init --------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  renderSummary();
  setupCardInputs();
  drawQr($('#qrHolder'));
  drawQr($('#qrHolder2'));

  $$('.method').forEach((m) => m.addEventListener('click', () => selectMethod(m.dataset.method)));
  $('#cardForm').addEventListener('submit', handleCardSubmit);
  $('#bankPaidBtn').addEventListener('click', () => handleManualPayment('bank'));
  $('#mobilePaidBtn').addEventListener('click', () => handleManualPayment('mobile'));
  $('#walletPaidBtn').addEventListener('click', () => handleManualPayment('wallet'));
  $('#cryptoPaidBtn').addEventListener('click', () => handleManualPayment('crypto'));
  $('#cashPaidBtn').addEventListener('click', () => handleManualPayment('cash'));

  $('#merchantName').textContent = store.BUSINESS_INFO.name;
  $('#merchantMark').textContent = store.BUSINESS_INFO.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
});
