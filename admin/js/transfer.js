/* Admin — bank transfer details. Saves to this browser's localStorage (../js/store.js). */

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

    patch('transfer', { tBankName, tAcctName, tAcctNumber, tCurrency, tAmount });
    saved('Bank transfer account details saved');
});
