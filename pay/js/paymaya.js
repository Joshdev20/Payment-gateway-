/* PayMaya payment page. Reads the details the admin saved in this browser. */

import { get, applyLogo, enableCopy, orDash, hydrate } from '../../js/store.js';

function render() {
    const d = get('paymaya') || {};
    document.querySelectorAll('.js-payCurrency').forEach((el) => { el.textContent = orDash(d.payCurrency); });
    document.querySelectorAll('.js-payName').forEach((el) => { el.textContent = orDash(d.payAcctName); });
    document.querySelectorAll('.js-payNumber').forEach((el) => { el.textContent = orDash(d.payAcctNumber); });
    document.querySelectorAll('.js-payAmount').forEach((el) => { el.textContent = orDash(d.payAmount); });
    applyLogo();
}

/* Pull shared settings first, then paint. If no backend is configured
   hydrate() resolves immediately and the local copy renders as before. */
hydrate().then(render);

enableCopy();
