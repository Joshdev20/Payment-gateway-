/* Admin — receipts submitted from the upload page, stored in this browser. */

import { getReceipts, requireAdmin, hydrate } from '../../js/store.js';

requireAdmin();

const list = document.getElementById('receiptList');

const escapeHtml = (value) =>
    String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));

function render() {
    const receipts = getReceipts();
    list.innerHTML = '';

    if (!receipts.length) {
        const empty = document.createElement('p');
        empty.className = 'receipt-empty';
        empty.textContent = 'No receipts yet. They appear here after someone uploads one.';
        list.append(empty);
        return;
    }

    receipts.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'receipt-card';

        const meta = document.createElement('div');
        meta.className = 'receipt-meta';
        const name = document.createElement('div');
        name.className = 'receipt-name';
        name.textContent = r.name || 'Unnamed';
        const email = document.createElement('div');
        email.className = 'receipt-email';
        email.textContent = r.email || '';
        const when = document.createElement('div');
        when.className = 'receipt-when';
        when.textContent = r.at ? new Date(r.at).toLocaleString() : '';
        meta.append(name, email, when);

        card.append(meta);

        if (r.image) {
            const img = document.createElement('img');
            img.className = 'receipt-thumb';
            img.src = r.image;
            img.alt = `Receipt from ${escapeHtml(r.name || 'user')}`;
            card.append(img);
        }

        list.append(card);
    });
}

/* Pull shared settings first, so receipts uploaded elsewhere appear here. */
hydrate().then(render);
