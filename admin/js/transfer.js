/* Admin — transfer. Saved through ../js/store.js: to this browser, and to the
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
    const d = get('transfer') || {};
    {
        const el = document.querySelector('#tBankName');
        if (el) el.value = d.tBankName ?? '';
    }
    {
        const el = document.querySelector('#tAcctName');
        if (el) el.value = d.tAcctName ?? '';
    }
    {
        const el = document.querySelector('#tAcctNum');
        if (el) el.value = d.tAcctNumber ?? '';
    }
    {
        const el = document.querySelector('#tCurrency');
        if (el) el.value = d.tCurrency ?? '';
    }
    {
        const el = document.querySelector('#tAmount');
        if (el) el.value = d.tAmount ?? '';
    }});
document.querySelector('#editBtn').addEventListener('click', async function (e) {
    e.preventDefault();

    const tBankName = document.querySelector('#tBankName').value.trim();
    const tAcctName = document.querySelector('#tAcctName').value.trim();
    const tAcctNumber = document.querySelector('#tAcctNum').value.trim();
    const tCurrency = document.querySelector('#tCurrency').value.trim();
    const tAmount = document.querySelector('#tAmount').value.trim();

    if (!tBankName || !tAcctName || !tAcctNumber || !tCurrency || !tAmount) {
        if (typeof window.Swal !== 'undefined') window.Swal.fire('Error', 'All fields are required', 'error');
        else window.alert('All fields are required');
        return;
    }

    busy(true);
    const res = await patch('transfer', { tBankName, tAcctName, tAcctNumber, tCurrency, tAmount });
    saved('Bank transfer account details saved', res);
});
