function menuOpen() {
    document.querySelector('#menu').style.display = 'block';
};

function menuClose() {
    document.querySelector('#menu').style.display = 'none';
};

function menu(select) {

    if(select === 'card') {
      window.location.href = 'index.html';
    } else if(select === 'gcash') {
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


const paid = document.querySelectorAll('#paid');
paid.forEach(btn => {
    btn.addEventListener('click', function(e) {
    e.preventDefault();

    document.querySelector('.loading').style.display = 'block';
    setTimeout(() => {
        document.querySelector('.loading').style.display = 'none';
        window.location.href='upload-ss.html';
    },3000);
});
});

const copyBtn = document.querySelectorAll('#copy1');
copyBtn.forEach(copy => {
    copy.addEventListener('click', function(e) {
    e.preventDefault();

    const textToCopy = document.querySelector('#send-address1')?.innerText || '';

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

const copyBtn2 = document.querySelectorAll('#copy2');
copyBtn2.forEach(copy => {
    copy.addEventListener('click', function(e) {
    e.preventDefault();

    const textToCopy = document.querySelector('#send-address2')?.innerText || '';

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