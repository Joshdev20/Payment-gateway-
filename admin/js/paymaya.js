/* Admin — PayMaya details. Saves to this browser's localStorage (../js/store.js). */

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

    const payAcctName = document.querySelector('#paymAcctName').value.trim();
    const payAcctNumber = document.querySelector('#paymAcctNum').value.trim();
    const payCurrency = document.querySelector('#paymCurrency').value.trim();
    const payAmount = document.querySelector('#paymAmount').value.trim();

    if (!payAcctName || !payAcctNumber || !payCurrency || !payAmount) {
        if (typeof window.Swal !== 'undefined') window.Swal.fire('Error', 'All fields are required', 'error');
        else window.alert('All fields are required');
        return;
    }

    patch('paymaya', { payAcctName, payAcctNumber, payCurrency, payAmount });
    saved('Paymaya account details saved');
});
