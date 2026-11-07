/* Receipt upload. The chosen image and the name/email are kept in this
   browser's localStorage so the admin dashboard can list them.
   Stored locally, and relayed when a relay is configured. */

import { addReceipt, notify } from '../../js/store.js';

const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
let selectedFile = null;
let previewUrl = '';

if (fileInput) {
    fileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        selectedFile = file;

        const reader = new FileReader();
        reader.onload = function (e) {
            previewUrl = e.target.result;
            if (preview) {
                preview.src = previewUrl;
                preview.style.display = 'block';
            }
            const imgContainer = document.querySelector('.image-container');
            if (imgContainer) imgContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
}

const form = document.getElementById('paymentForm');
if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!selectedFile) {
            notify('Error', 'Please upload an image first.', 'error');
            return;
        }

        const userName = document.getElementById('userName').value.trim();
        const userEmail = document.getElementById('userEmail').value.trim();

        if (!userName || !userEmail) {
            notify('Error', 'Please enter both name and email.', 'error');
            return;
        }

        addReceipt({ name: userName, email: userEmail, image: previewUrl });

        if (typeof window.Swal !== 'undefined') {
            window.Swal.fire({
                title: 'Receipt saved',
                text: 'Open the admin dashboard to review it.',
                icon: 'success',
                timer: 1400,
                showConfirmButton: false,
            });
        }
        window.location.href = 'index.html';
    });
}
