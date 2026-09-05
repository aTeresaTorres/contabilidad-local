// Manejo de autenticación
let currentUser = null;

// Verificar sesión al cargar
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        showDashboard();
        loadMovements();
    } else {
        showLoginScreen();
    }
});

function showLogin() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('registerScreen').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'block';
}

function showLoginScreen() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('registerScreen').style.display = 'none';
}

function showDashboard() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'none';
}

// Login con email/contraseña
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Por favor, ingresa email y contraseña');
        return;
    }
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// 👇 NUEVA FUNCIÓN: Login con Google
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        await firebase.auth().signInWithPopup(provider);
        console.log('✅ Login con Google exitoso');
    } catch (error) {
        console.error('❌ Error con Google:', error);
        if (error.code === 'auth/popup-blocked') {
            alert('Permite ventanas emergentes (popups) para este sitio');
        } else if (error.code !== 'auth/popup-closed-by-user') {
            alert('Error con Google: ' + error.message);
        }
    }
}

// Registro
async function register() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!email || !password) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    try {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Logout
function logout() {
    firebase.auth().signOut();
    showLoginScreen();
}