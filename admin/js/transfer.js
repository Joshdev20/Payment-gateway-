

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
 
const supabaseUrl = "https://eyrjnunkjivuzgquaseo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cmpudW5raml2dXpncXVhc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDE0NzcsImV4cCI6MjA3MTcxNzQ3N30.nuRyARA-wDx0FoiLTBmxX3MC5XJoqgti6yTFAt5JKtQ"; // replace with your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

document.querySelector('#editBtn').addEventListener('click', async function(e) {
    e.preventDefault();

    const tAcctName = document.querySelector('#tAcctName').value.trim();
    const tAcctNum = document.querySelector('#tAcctNum').value.trim();
    const tCurrency = document.querySelector('#tCurrency').value.trim();
    const tAmount = document.querySelector('#tAmount').value.trim();
    const tBankName = document.querySelector('#tBankName').value.trim();

    if (!tAcctName || !tAcctNum || !tCurrency || !tAmount || !tBankName) {
        Swal.fire("Error", "All fields are required", "error");
        return;
    }

    try {
        const { data, error } = await supabase
            .from('transfer')
            .upsert(
                {
                    tAcctName: tAcctName,
                    tAcctNumber: tAcctNum,
                    tCurrency: tCurrency,
                    tAmount: tAmount,
                    tBankName: tBankName
                },
                { onConflict: 'tAcctNumber' } // must match UNIQUE column
            );

        if (error) throw error;

        console.log("✅ Supabase saved:", data);

        Swal.fire("Success", "Bank transfer Account Details Uploaded", "success").then(() => {
            window.location.href = 'admin.html';
        });

    } catch (err) {
        console.error("❌ Supabase Error:", err);
        Swal.fire("Error", "Failed to save Bank transfer account", "error");
    }
});
