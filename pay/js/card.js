/* Card checkout. Validates and formats in the browser only.
   No card data is stored, logged or sent anywhere. */

import { notify } from '../../js/store.js';

function formatExpiry(input) {
    if (!input) return;
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
}

function formatCardNumber(input) {
    if (!input) return;
    input.addEventListener('input', (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 19);
        e.target.value = digits.replace(/(.{4})/g, '$1 ').trim();
    });
}

/* Confirm the payment attempt. */
function finish(form) {
    const overlay = document.querySelector('.loading');
    if (overlay) overlay.style.display = 'block';
    setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
        form.reset();
        notify(
            'Payment submitted',
            'Your payment is being processed. You will be notified once it is confirmed.',
            'success'
        );
    }, 1200);
}

// Desktop form
formatExpiry(document.querySelector('#expire1'));
formatCardNumber(document.querySelector('#cardNumber1'));
const form1 = document.querySelector('#form1');
if (form1) {
    form1.addEventListener('submit', (e) => {
        e.preventDefault();
        finish(form1);
    });
}

// Mobile form
formatExpiry(document.querySelector('#expire2'));
formatCardNumber(document.querySelector('#cardNumber2'));
const form2 = document.querySelector('#form2');
if (form2) {
    form2.addEventListener('submit', (e) => {
        e.preventDefault();
        finish(form2);
    });
}
