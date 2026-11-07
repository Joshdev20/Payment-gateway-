/* Admin login. Credentials come from the shared store so this file and the
   dashboard guard can never disagree. Browser-side only. */

import { signIn, notify, ADMIN } from '../../js/store.js';

const userField = document.querySelector('#user');
const passField = document.querySelector('#password');

userField.value = '';
passField.value = '';

document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();

    const user = userField.value.trim();
    const pass = passField.value;

    if (signIn(user, pass)) {
        window.location.href = 'admin.html';
    } else {
        notify('Incorrect username or password', '', 'error');
    }
});

