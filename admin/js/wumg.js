/* Admin — Western Union / MoneyGram details. Saves to localStorage (../js/store.js). */

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

    const payWith = document.querySelector('#payWith').value.trim();
    const wuCurrency = document.querySelector('#wuCurrency').value.trim();
    const wuAmount = document.querySelector('#wuAmount').value.trim();
    const wuDetails = document.querySelector('#wuDetails').value.trim();

    if (!payWith || !wuCurrency || !wuAmount || !wuDetails) {
        if (typeof window.Swal !== 'undefined') window.Swal.fire('Error', 'All fields are required', 'error');
        else window.alert('All fields are required');
        return;
    }

    patch('wumg', { payWith, wuCurrency, wuAmount, wuDetails });
    saved('WU/MG account details saved');
});
