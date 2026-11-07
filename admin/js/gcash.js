/* Admin — GCash details. Saves to this browser's localStorage (../js/store.js). */

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

document.querySelector('#editBtn').addEventListener('click', function (e) {
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

    patch('gcash', { gcashName, gcashNumber, gcashCurrency, gcashAmount });
    saved('Gcash account details saved');
});
