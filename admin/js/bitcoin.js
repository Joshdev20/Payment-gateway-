import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

    // ✅ Replace with your real Supabase URL & Anon Key
    const supabase = createClient(
      "https://eyrjnunkjivuzgquaseo.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cmpudW5raml2dXpncXVhc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDE0NzcsImV4cCI6MjA3MTcxNzQ3N30.nuRyARA-wDx0FoiLTBmxX3MC5XJoqgti6yTFAt5JKtQ"
    );

    document.querySelector('#editBtn').addEventListener('click', async function(e) {
      e.preventDefault();

      const address = document.querySelector('#address').value.trim();
      const amount = document.querySelector('#amount').value.trim();
      const wallet = document.querySelector('#wallet').value.trim();
      const qrFile = document.querySelector('#qrImage').files[0];

      if (!qrFile) {
        Swal.fire("Error", "Please upload a QR image", "error");
        return;
      }

      // ✅ Convert image file → Base64 string
      const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      try {
        const qrBase64 = await toBase64(qrFile);

        // ✅ Insert everything into Supabase table
        const { data: inserted, error } = await supabase
          .from("wallets")
          .insert([{ address, amount, wallet, qrImage: qrBase64 }]);

        if (error) throw error;

        console.log("✅ Saved to Supabase:", inserted);

        Swal.fire("Success", "New Wallet Uploaded", "success").then(() => {
          window.location.href = 'admin.html';
        });

      } catch (err) {
        console.error("❌ Supabase Error:", err);
        Swal.fire("Error", "Failed to save wallet", "error");
      }
    });