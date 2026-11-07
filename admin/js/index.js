const userAdmin = 'Bigtools';
const userPass = 'Zeatan02,,';

const storeUser = localStorage.getItem('user');
const storePass = localStorage.getItem('password');

// Pre-fill input if you want
document.querySelector('#user').value = storeUser || '';
document.querySelector('#password').value = storePass || '';

// Check login
document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();

    const userInput = document.querySelector('#user').value;
    const passInput = document.querySelector('#password').value;

    if(userAdmin === userInput && userPass === passInput) {
        localStorage.setItem('user', userInput);
        localStorage.setItem('password', passInput);
        window.location.href = 'admin.html';
    } else {
        alert('Incorrect username or password');
    }
});
