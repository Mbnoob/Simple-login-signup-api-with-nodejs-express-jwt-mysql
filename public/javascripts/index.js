


function showPasswrd() {
    const showpass = document.getElementById('passwords')
    if (showpass.type === 'password') {
        showpass.type = 'text';
    } else {
        showpass.type = 'password';
    }
    setTimeout(() => {
        showpass.type = 'password';
    }, 3000);
}

function Showconf_pass() {
    const con_pass = document.getElementById('con_pass')
    if (con_pass.type === 'password') {
        con_pass.type = 'text';
    } else {
        con_pass.type = 'password'
    }
    setTimeout(() => {
        con_pass.type = 'password';
    }, 3000);
}

function validatePassword(){
    const showpass = document.getElementById('passwords')
    const con_pass = document.getElementById('con_pass')

    if(showpass.value != con_pass.value) {
        con_pass.setCustomValidity("Passwords Don't Match");
    } else {
        con_pass.setCustomValidity('');
    }
  }

//   function submitss() {
//     const frm = document.getElementById('form');

//     frm.addEventListener('submit', (e)=>{
//         e.preventDefault();
//     })
    
// }
