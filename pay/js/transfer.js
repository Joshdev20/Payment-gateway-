/* Bank transfer payment page. Reads the details the admin saved in this browser. */

import { get, applyLogo, enableCopy, orDash } from '../../js/store.js';

function render() {
    const d = get('transfer') || {};
    document.querySelectorAll('.js-tCurrency').forEach((el) => { el.textContent = orDash(d.tCurrency); });
    document.querySelectorAll('.js-tBank').forEach((el) => { el.textContent = orDash(d.tBankName); });
    document.querySelectorAll('.js-tName').forEach((el) => { el.textContent = orDash(d.tAcctName); });
    document.querySelectorAll('.js-tNumber').forEach((el) => { el.textContent = orDash(d.tAcctNumber); });
    document.querySelectorAll('.js-tAmount').forEach((el) => { el.textContent = orDash(d.tAmount); });
    applyLogo();
}

render();
enableCopy();
