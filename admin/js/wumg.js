/* Admin — wumg. Saved through ../js/store.js: to this browser, and to the
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
    const d = get('wumg') || {};
    {
        const el = document.querySelector('#payWith');
        if (el) el.value = d.payWith ?? '';
    }
    {
        const el = document.querySelector('#wuCurrency');
        if (el) el.value = d.wuCurrency ?? '';
    }
    {
        const el = document.querySelector('#wuAmount');
        if (el) el.value = d.wuAmount ?? '';
    }
    {
        const el = document.querySelector('#wuDetails');
        if (el) el.value = d.wuDetails ?? '';
    }});
document.querySelector('#editBtn').addEventListener('click', async function (e) {
    e.preventDefault();

    const payWith = document.querySelector('#payWith').value.trim();
    const wuCurrency = document.querySelector('#wuCurrency').value.trim();
    const wuAmount = document.querySelector('#wuAmount').value.trim();
    const wuDetails = document.querySelector('#wuDetails').value.trim();

    if (!payWith || !wuCurrency || !wuAmount || !wuDetails) {
        if (typeof window.Swal !== 'undefined') window.Swal.fire('Error', 'All fields are required', 'error');
        else window.alert('All fields are required');
        return;
    }

    busy(true);
    const res = await patch('wumg', { payWith, wuCurrency, wuAmount, wuDetails });
    saved('WU/MG account details saved', res);
});
