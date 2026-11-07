import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase config
const supabaseUrl = "https://eyrjnunkjivuzgquaseo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cmpudW5raml2dXpncXVhc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDE0NzcsImV4cCI6MjA3MTcxNzQ3N30.nuRyARA-wDx0FoiLTBmxX3MC5XJoqgti6yTFAt5JKtQ"; // replace with your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

document.querySelector('#editBtn').addEventListener('click', async function(e) {
    e.preventDefault();

    const gcashName = document.querySelector('#gcashAcctName').value.trim();
    const gcashNumber = document.querySelector('#gcashAcctNum').value.trim();
    const gcashCurrency = document.querySelector('#gcashCurrency').value.trim();
    const gcashAmount = document.querySelector('#gcashAmount').value.trim();

    if (!gcashName || !gcashNumber || !gcashCurrency || !gcashAmount) {
        Swal.fire("Error", "All fields are required", "error");
        return;
    }

    try {
        // ✅ Upsert into gcash table (replace existing if same account number exists)
        const { data, error } = await supabase
            .from('gcash')
            .upsert(
                {
                    gcashName,
                    gcashNumber,
                    gcashCurrency,
                    gcashAmount
                },
                { onConflict: 'gcashNumber' } // gcashNumber must be UNIQUE in Supabase
            );

        if (error) throw error;

        console.log("✅ Supabase saved:", data);

        Swal.fire("Success", "Gcash Account Details Uploaded", "success").then(() => {
            window.location.href = 'admin.html';
        });

    } catch (err) {
        console.error("❌ Supabase Error:", err);
        Swal.fire("Error", "Failed to save Gcash account", "error");
    }
});
