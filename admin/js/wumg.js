

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
 
const supabaseUrl = "https://eyrjnunkjivuzgquaseo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cmpudW5raml2dXpncXVhc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDE0NzcsImV4cCI6MjA3MTcxNzQ3N30.nuRyARA-wDx0FoiLTBmxX3MC5XJoqgti6yTFAt5JKtQ"; // replace with your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

document.querySelector('#editBtn').addEventListener('click', async function(e) {
    e.preventDefault();

    const payWith = document.querySelector('#payWith').value.trim();
    const wuCurrency = document.querySelector('#wuCurrency').value.trim();
    const wuAmount = document.querySelector('#wuAmount').value.trim();
    const wuDetails = document.querySelector('#wuDetails').value.trim();

    if (!payWith || !wuCurrency || !wuAmount || !wuDetails) {
        Swal.fire("Error", "All fields are required", "error");
        return;
    }

    try {
        const { data, error } = await supabase
            .from('wumg')
            .upsert(
                {
                    payWith: payWith,
                    wuCurrency: wuCurrency,
                    wuAmount: wuAmount,
                    wuDetails: wuDetails
                }
            );

        if (error) throw error;

        console.log("✅ Supabase saved:", data);

        Swal.fire("Success", "New WU/MG Account Details Uploaded", "success").then(() => {
            window.location.href = 'admin.html';
        });

    } catch (err) {
        console.error("❌ Supabase Error:", err);
        Swal.fire("Error", "Failed to save WU/MG account", "error");
    }
});
