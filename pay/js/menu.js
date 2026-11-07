/* Shared navigation, receipt hand-off and copy buttons for the payment pages. */

import { enableCopy } from '../../js/store.js';

function menuOpen() {
    const el = document.querySelector('#menu');
    if (el) el.style.display = 'block';
}

function menuClose() {
    const el = document.querySelector('#menu');
    if (el) el.style.display = 'none';
}

function menu(select) {
    if (select === 'card') {
        window.location.href = 'index.html';
    } else if (select === 'gcash') {
        window.location.href = 'gcash.html';
    } else if (select === 'paymaya') {
        window.location.href = 'paymaya.html';
    } else if (select === 'bank') {
        window.location.href = 'transfer.html';
    } else if (select === 'bitcoin') {
        window.location.href = 'bitcoin.html';
    } else if (select === 'wumg') {
        window.location.href = 'wumg.html';
    }
}

// Expose for the inline onclick handlers in the markup.
window.menuOpen = menuOpen;
window.menuClose = menuClose;
window.menu = menu;

document.querySelectorAll('#paid').forEach((btn) => {
    btn.addEventListener('click', function (e) {
        e.preventDefault();
        const overlay = document.querySelector('.loading');
        if (overlay) overlay.style.display = 'block';
        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            window.location.href = 'upload-ss.html';
        }, 1200);
    });
});

enableCopy();
