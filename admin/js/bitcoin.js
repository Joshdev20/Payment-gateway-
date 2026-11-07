/* Admin — wallet address and QR. Saves to this browser's localStorage (../js/store.js).
   The QR image is stored as a data URL so the payment page can show it. */

import { patch, requireAdmin } from '../../js/store.js';

requireAdmin();

/* Confirm, then return to the dashboard. Navigation does not wait on the
   dialog, so it still works if the popup library is slow or blocked. */
const saved = (msg) => {
    if (typeof window.Swal !== 'undefined') {
        window.Swal.fire({ title: 'Success', text: msg, icon: 'success', timer: 1200, showConfirmButton: false });
    }
    window.location.href = 'admin.html';
};

const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
});

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
        patch('wallet', update);
        saved('Wallet details saved');
    } catch (err) {
        console.error(err);
        if (typeof window.Swal !== 'undefined') window.Swal.fire('Error', 'Could not read that image', 'error');
        else window.alert('Could not read that image');
    }
});
