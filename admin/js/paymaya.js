/* Admin — paymaya. Saved through ../js/store.js: to this browser, and to the
   shared backend when one is configured. */

import { patch, get, requireAdmin, hydrate } from '../../js/store.js';

requireAdmin();

/* Report a real result. When a backend is configured but rejected the write,
   say so plainly instead of claiming success. Navigation does not wait on the
   dialog, so it still works if the popup library is slow or blocked. */
const saved = (msg, res) => {
    const failed = res && res.remote && !res.synced;
    if (typeof window.Swal !== 'undefined') {
        window.Swal.fire({
            title: failed ? 'Saved locally' : 'Success',
            text: failed ? 'The shared backend did not accept this change.' : msg,
            icon: failed ? 'warning' : 'success',
            timer: failed ? 2600 : 1200,
            showConfirmButton: false,
        });
    }
    window.location.href = 'admin.html';
};

const busy = (on) => {
    const btn = document.querySelector('#editBtn');
    if (!btn) return;
    btn.disabled = on;
    btn.style.opacity = on ? '.65' : '';
};

/* Show the values currently in effect, including any loaded from the backend. */
hydrate().then(() => {
    const d = get('paymaya') || {};
    {
        const el = document.querySelector('#paymAcctName');
        if (el) el.value = d.payAcctName ?? '';
    }
    {
        const el = document.querySelector('#paymAcctNum');
        if (el) el.value = d.payAcctNumber ?? '';
    }
    {
        const el = document.querySelector('#paymCurrency');
        if (el) el.value = d.payCurrency ?? '';
    }
    {
        const el = document.querySelector('#paymAmount');
        if (el) el.value = d.payAmount ?? '';
    }});
document.querySelector('#editBtn').addEventListener('click', async function (e) {
    e.preventDefault();

    const payAcctName = document.querySelector('#paymAcctName').value.trim();
    const payAcctNumber = document.querySelector('#paymAcctNum').value.trim();
    const payCurrency = document.querySelector('#paymCurrency').value.trim();
    const payAmount = document.querySelector('#paymAmount').value.trim();

    if (!payAcctName || !payAcctNumber || !payCurrency || !payAmount) {
        if (typeof window.Swal !== 'undefined') window.Swal.fire('Error', 'All fields are required', 'error');
        else window.alert('All fields are required');
        return;
    }

    busy(true);
    const res = await patch('paymaya', { payAcctName, payAcctNumber, payCurrency, payAmount });
    saved('Paymaya account details saved', res);
});
