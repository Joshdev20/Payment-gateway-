
function menu(select) {

   if(select === 'gcash') {
        window.location.href = 'gcash.html';
    } else if(select === 'paymaya') {
        window.location.href = 'paymaya.html';
    } else if(select === 'bank') {
        window.location.href = 'transfer.html';
    } else if(select === 'bitcoin') {
        window.location.href = 'bitcoin.html';
    } else if(select === 'wumg') {
        window.location.href = 'wumg.html';
    }
};


const userAdmin = 'deejay';
const userPass = 'deejay';

// Get stored values
const storeUser = localStorage.getItem('user');
const storePass = localStorage.getItem('password');

// Optional: pre-fill input fields if you want
const userInput = document.querySelector('#user');
if(userInput) userInput.value = storeUser || '';

// Check if user exists and matches credentials
if(storeUser !== userAdmin || storePass !== userPass) {
    // User not logged in or wrong credentials → redirect to index.html
    window.location.href = 'index.html';
}


import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = "https://eyrjnunkjivuzgquaseo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cmpudW5raml2dXpncXVhc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDE0NzcsImV4cCI6MjA3MTcxNzQ3N30.nuRyARA-wDx0FoiLTBmxX3MC5XJoqgti6yTFAt5JKtQ"; 
const supabase = createClient(supabaseUrl, supabaseKey);

// Convert file → Base64 string
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
});

// Handle file upload
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const base64Image = await toBase64(file);

        // Check if a logo row already exists
        const { data: existing, error: selectError } = await supabase
            .from('logo')
            .select('*')
            .limit(1);

        if (selectError) throw selectError;

        let response;

        if (existing && existing.length > 0) {
            // Update the existing logo row
            response = await supabase
                .from('logo')
                .update({ logo: base64Image })
                .eq('id', existing[0].id);
        } else {
            // Insert new logo row
            response = await supabase
                .from('logo')
                .insert({ logo: base64Image });
        }

        if (response.error) throw response.error;

        Swal.fire("Success", "Logo Uploaded", "success");

        // Display logo immediately
        document.getElementById('logoDisplay').src = base64Image;

    } catch (err) {
        console.error("❌ Supabase Error:", err);
        Swal.fire("Error", "Failed to upload logo", "error");
    }
});

// Optional: Load logo on page load
export async function loadLogo() {
    try {
        const { data, error } = await supabase
            .from('logo')
            .select('*')
            .limit(1);

        if (error) throw error;
        if (data && data.length > 0) {
            document.getElementById('logoDisplay').src = data[0].logo;
        }
    } catch (err) {
        console.error("❌ Supabase Error:", err);
    }
}

// Call on page load
loadLogo();
