function menuOpen() {
    document.querySelector('#menu').style.display = 'block';
};

function menuClose() {
    document.querySelector('#menu').style.display = 'none';
};

function menu(select) {

    if(select === 'card') {
      document.querySelector('#menu').style.display = 'none';
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