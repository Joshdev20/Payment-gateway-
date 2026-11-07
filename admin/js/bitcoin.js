/* Admin — bitcoin. Saved through ../js/store.js: to this browser, and to the
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
    const d = get('wallet') || {};
    {
        const el = document.querySelector('#address');
        if (el) el.value = d.address ?? '';
    }
    {
        const el = document.querySelector('#amount');
        if (el) el.value = d.amount ?? '';
    }});
document.querySelector('#editBtn').addEventListener('click', async function (e) {
    e.preventDefault();

    const address = document.querySelector('#address').value.trim();
    const amount = document.querySelector('#amount').value.trim();
    const wallet = document.querySelector('#wallet').value;
    const qrFile = document.querySelector('#qrImage').files[0];

    if (!address || !amount || !wallet) {
        if (typeof window.Swal !== 'undefined') window.Swal.fire('Error', 'All fields are required', 'error');
        else window.alert('All fields are required');
        return;
    }

    try {
        const update = { address, amount, wallet };
        if (qrFile) update.qrImage = await toBase64(qrFile);
        busy(true);
        const res = await patch('wallet', update);
        saved('Wallet details saved', res);
    } catch (err) {
        console.error(err);
        if (typeof window.Swal !== 'undefined') window.Swal.fire('Error', 'Could not read that image', 'error');
        else window.alert('Could not read that image');
    }
});
