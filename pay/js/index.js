/* Card checkout page. */

import { applyLogo } from '../../js/store.js';

function menuOpen() {
    const el = document.querySelector('#menu');
    if (el) el.style.display = 'block';
}

function menuClose() {
    const el = document.querySelector('#menu');
    if (el) el.style.display = 'none';
}

/* Cancel Payment: leave this method and go back to the method chooser. */
function cancelPayment() {
    window.location.href = 'checkout.html';
}

function menu(select) {
    if (select === 'card') {
        menuClose();
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

window.menuOpen = menuOpen;
window.menuClose = menuClose;
window.cancelPayment = cancelPayment;
window.menu = menu;

applyLogo();
