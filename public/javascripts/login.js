function showPasswrd() {
    const showpass = document.getElementById('passwords')
    if (showpass.type === 'password') {
        showpass.type = 'text';
    } else {
        showpass.type = 'password';
    }
    setTimeout(() => {
        showpass.type = 'password';
    }, 2000);
}