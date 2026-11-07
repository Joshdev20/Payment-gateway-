const copyBitBtn = document.querySelectorAll('.bi-copy');
copyBitBtn.forEach(copy => {
    copy.addEventListener('click', function(e) {
    e.preventDefault();

    const textToCopy = document.querySelector('#send-address')?.innerText || '';

    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                alert("Copied to clipboard!");
            })
            .catch(err => {
                console.error("Failed to copy: ", err);
                alert("Failed to copy!");
            });
    } else {
        alert("Nothing to copy.");
    }
});
});


import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase config
const supabaseUrl = "https://eyrjnunkjivuzgquaseo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cmpudW5raml2dXpncXVhc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDE0NzcsImV4cCI6MjA3MTcxNzQ3N30.nuRyARA-wDx0FoiLTBmxX3MC5XJoqgti6yTFAt5JKtQ";
const supabase = createClient(supabaseUrl, supabaseKey);

async function loadWallets() {
  try {
    const { data, error } = await supabase
      .from("paymaya")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1); // ✅ only latest row

    if (error) throw error;
    if (!data || data.length === 0) {
      console.warn("⚠️ No data found in Supabase");
      return;
    }

    const row = data[0]; // get the latest wallet row

    // ✅ Select all elements (desktop + mobile)
    const payCurrencyEls = document.querySelectorAll(".js-payCurrency");
    const payNameEls = document.querySelectorAll(".js-payName");
    const payNumberEls = document.querySelectorAll(".js-payNumber");
    const payAmountEls = document.querySelectorAll(".js-payAmount");

    // ✅ Apply same value to all matching elements
    payCurrencyEls.forEach(el => el.textContent = row.payCurrency);
    payNameEls.forEach(el => el.textContent = row.payAcctName);
    payNumberEls.forEach(el => el.textContent = row.payAcctNumber);
    payAmountEls.forEach(el => el.textContent = row.payAmount);

    console.log("✅ Data loaded:", row);
  } catch (err) {
    console.error("❌ Supabase Error:", err.message);
  }
}

loadWallets();

// Load logo from Supabase and apply to all logo elements
export async function loadLogo() {
    try {
        const { data, error } = await supabase
            .from('logo')
            .select('*')
            .limit(1); // latest row

        if (error) throw error;

        if (data && data.length > 0) {
            const logoEls = document.querySelectorAll('#logo'); // select all elements with class "logo"
            logoEls.forEach(el => {
                el.src = data[0].logo;
            });
        }
    } catch (err) {
        console.error("❌ Supabase Error:", err);
    }
}

// Call on page load after DOM is ready
document.addEventListener('DOMContentLoaded', loadLogo);
