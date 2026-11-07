/* Western Union / MoneyGram payment page. Reads the details the admin saved. */

import { get, applyLogo, enableCopy, orDash } from '../../js/store.js';

function render() {
    const d = get('wumg') || {};
    document.querySelectorAll('.js-wuCurrency').forEach((el) => { el.textContent = orDash(d.wuCurrency); });
    document.querySelectorAll('.js-wuAmount').forEach((el) => { el.textContent = orDash(d.wuAmount); });
    document.querySelectorAll('.js-wuPaywith').forEach((el) => { el.textContent = orDash(d.payWith); });
    document.querySelectorAll('.js-wuDetails').forEach((el) => {
        el.innerHTML = '';
        String(d.wuDetails || '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
                const [label, ...rest] = line.split(':');
                const row = document.createElement('div');
                row.className = 'con-flex';
                const left = document.createElement('div');
                const lab = document.createElement('div');
                lab.className = 'con-label';
                lab.textContent = rest.length ? label.trim() : '';
                const val = document.createElement('div');
                val.className = 'con-value';
                val.textContent = rest.length ? rest.join(':').trim() : line;
                left.append(lab, val);
                row.append(left, document.createElement('div'));
                el.append(row);
            });
    });
    applyLogo();
}

render();
enableCopy();
