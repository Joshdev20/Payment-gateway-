/* Admin dashboard. Guards the page, fills in the operator name, wires the
   section links and logo upload, and reports the state of the shared backend. */

import {
    menuNav, applyLogo, setLogo, currentUser, requireAdmin, notify,
    backendStatus, hydrate, lastSync,
} from '../../js/store.js';

function menu(select) {
    menuNav(select, 'admin');
}

window.menu = menu;

requireAdmin();

const userEl = document.querySelector('#user');
if (userEl) userEl.textContent = currentUser();

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
            const res = await setLogo(dataUrl);
            applyLogo();
            notify(res.remote && !res.synced ? 'Warning' : 'Success',
                   res.remote && !res.synced ? 'Logo saved locally only' : 'Logo saved',
                   res.remote && !res.synced ? 'warning' : 'success');
        } catch (err) {
            console.error(err);
            notify('Error', 'Could not read that image', 'error');
        }
    });
}

const pill = (id, text, tone) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = `bs-pill ${tone}`;
};

/* Backends: report the configuration first, then the live result of a pull. */
const status = backendStatus();
pill('bsSupabase', status.supabase ? 'configured' : 'not configured',
     status.supabase ? 'on' : 'off');
pill('bsTelegram', status.telegram ? 'configured' : 'not configured',
     status.telegram ? 'on' : 'off');

function paintSync(ok) {
    const s = lastSync();
    const when = s.at ? new Date(s.at).toLocaleTimeString() : '';
    pill('bsSync', ok ? `synced ${when}` : 'not reachable', ok ? 'on' : 'off');
}

if (status.supabase) {
    hydrate().then((ok) => {
        paintSync(ok);
        applyLogo();
        if (ok) notify('Sync', 'Settings loaded from the shared backend', 'success');
    });
} else {
    paintSync(false);
    resetLogo();
}

function resetLogo() {
    const el = document.getElementById('logoDisplay');
    if (el) el.setAttribute('src', '');
}

/* Pull again on demand. */
const syncBtn = document.getElementById('syncNow');
if (syncBtn) {
    if (!status.supabase) syncBtn.disabled = true;
    syncBtn.addEventListener('click', async () => {
        if (!status.supabase) return;
        syncBtn.disabled = true;
        syncBtn.textContent = 'Syncing\u2026';
        const ok = await hydrate();
        paintSync(ok);
        applyLogo();
        syncBtn.textContent = 'Sync now';
        syncBtn.disabled = false;
        notify(ok ? 'Sync' : 'Error',
               ok ? 'Settings refreshed from the shared backend'
                  : 'Could not reach the shared backend',
               ok ? 'success' : 'error');
    });
}
