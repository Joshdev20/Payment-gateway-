
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase config
const supabaseUrl = "https://eyrjnunkjivuzgquaseo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cmpudW5raml2dXpncXVhc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDE0NzcsImV4cCI6MjA3MTcxNzQ3N30.nuRyARA-wDx0FoiLTBmxX3MC5XJoqgti6yTFAt5JKtQ";
const supabase = createClient(supabaseUrl, supabaseKey);

async function loadWallets() {
  try {
    const { data, error } = await supabase
      .from("wumg")
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
    const wuCurrencyEls = document.querySelectorAll(".js-wuCurrency");
    const wuDetailsEls = document.querySelectorAll(".js-wuDetails");
    const payWithEls = document.querySelectorAll(".js-wuPaywith");
    const wuAmountEls = document.querySelectorAll(".js-wuAmount");

    // ✅ Apply same value to all matching elements
    wuCurrencyEls.forEach(el => el.textContent = row.wuCurrency);
    wuDetailsEls.forEach(el => el.textContent = row.wuDetails);
    payWithEls.forEach(el => el.textContent = row.payWith);
    wuAmountEls.forEach(el => el.textContent = row.wuAmount);

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
