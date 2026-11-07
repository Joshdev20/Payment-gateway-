/* GCash payment page. Reads the details the admin saved in this browser. */

import { get, applyLogo, enableCopy, orDash } from '../../js/store.js';

function render() {
    const d = get('gcash') || {};
    document.querySelectorAll('.js-currency').forEach((el) => { el.textContent = orDash(d.gcashCurrency); });
    document.querySelectorAll('.js-gName').forEach((el) => { el.textContent = orDash(d.gcashName); });
    document.querySelectorAll('.js-gNumber').forEach((el) => { el.textContent = orDash(d.gcashNumber); });
    document.querySelectorAll('.js-amount').forEach((el) => { el.textContent = orDash(d.gcashAmount); });
    applyLogo();
}

render();
enableCopy();
