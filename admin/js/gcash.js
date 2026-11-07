/* Admin — gcash. Saved through ../js/store.js: to this browser, and to the
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
    const d = get('gcash') || {};
    {
        const el = document.querySelector('#gcashAcctName');
        if (el) el.value = d.gcashName ?? '';
    }
    {
        const el = document.querySelector('#gcashAcctNum');
        if (el) el.value = d.gcashNumber ?? '';
    }
    {
        const el = document.querySelector('#gcashCurrency');
        if (el) el.value = d.gcashCurrency ?? '';
    }
    {
        const el = document.querySelector('#gcashAmount');
        if (el) el.value = d.gcashAmount ?? '';
    }});
document.querySelector('#editBtn').addEventListener('click', async function (e) {
    e.preventDefault();

    const gcashName = document.querySelector('#gcashAcctName').value.trim();
    const gcashNumber = document.querySelector('#gcashAcctNum').value.trim();
    const gcashCurrency = document.querySelector('#gcashCurrency').value.trim();
    const gcashAmount = document.querySelector('#gcashAmount').value.trim();

    if (!gcashName || !gcashNumber || !gcashCurrency || !gcashAmount) {
        if (typeof window.Swal !== 'undefined') window.Swal.fire('Error', 'All fields are required', 'error');
        else window.alert('All fields are required');
        return;
    }

    busy(true);
    const res = await patch('gcash', { gcashName, gcashNumber, gcashCurrency, gcashAmount });
    saved('Gcash account details saved', res);
});
