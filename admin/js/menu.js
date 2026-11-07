/* Admin dashboard. Guards the page, fills in the operator name and wires the
   section links and logo upload. Browser-side only. */

import { menuNav, applyLogo, setLogo, currentUser, requireAdmin, notify, backendStatus } from '../../js/store.js';

function menu(select) {
    menuNav(select, 'admin');
}

window.menu = menu;

requireAdmin();

const userEl = document.querySelector('#user');
if (userEl) userEl.textContent = currentUser();

applyLogo();

const fileInput = document.getElementById('fileInput');
if (fileInput) {
    fileInput.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });
            setLogo(dataUrl);
            applyLogo();
            notify('Success', 'Logo saved', 'success');
        } catch (err) {
            console.error(err);
            notify('Error', 'Could not read that image', 'error');
        }
    });
}

/* Show which optional backends are configured. */
const status = backendStatus();
for (const [id, on] of [['bsSupabase', status.supabase], ['bsTelegram', status.telegram]]) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.textContent = on ? 'configured' : 'not configured';
    el.className = `bs-pill ${on ? 'on' : 'off'}`;
}
