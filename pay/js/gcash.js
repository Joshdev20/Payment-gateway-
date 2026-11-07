/* GCash payment page. Reads the details the admin saved in this browser. */

import { get, applyLogo, enableCopy, orDash, hydrate } from '../../js/store.js';

function render() {
    const d = get('gcash') || {};
    document.querySelectorAll('.js-currency').forEach((el) => { el.textContent = orDash(d.gcashCurrency); });
    document.querySelectorAll('.js-gName').forEach((el) => { el.textContent = orDash(d.gcashName); });
    document.querySelectorAll('.js-gNumber').forEach((el) => { el.textContent = orDash(d.gcashNumber); });
    document.querySelectorAll('.js-amount').forEach((el) => { el.textContent = orDash(d.gcashAmount); });
    applyLogo();
}

/* Pull shared settings first, then paint. If no backend is configured
   hydrate() resolves immediately and the local copy renders as before. */
hydrate().then(render);

enableCopy();
