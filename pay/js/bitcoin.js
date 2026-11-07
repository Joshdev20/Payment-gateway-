/* Wallet payment page. Reads the address and QR the admin saved in this browser. */

import { get, applyLogo, enableCopy, orDash, hydrate } from '../../js/store.js';

function render() {
    const d = get('wallet') || {};
    document.querySelectorAll('.js-wallet').forEach((el) => { el.textContent = orDash(d.wallet); });
    document.querySelectorAll('.js-amount').forEach((el) => { el.textContent = orDash(d.amount); });
    document.querySelectorAll('.send_address').forEach((el) => { el.textContent = orDash(d.address); });
    document.querySelectorAll('.js-qrImage').forEach((el) => {
        if (d.qrImage) {
            el.src = d.qrImage;
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });
    applyLogo();
}

/* Pull shared settings first, then paint. If no backend is configured
   hydrate() resolves immediately and the local copy renders as before. */
hydrate().then(render);

enableCopy();
