/**
 * Inicio de sesión y registro.
 *
 * Nota: la autenticación ocurre en el navegador con fines académicos.
 * En producción debe validarse en un servidor; aquí al menos las contraseñas
 * se guardan como hash SHA-256 y nunca en texto plano.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const title = document.getElementById('title');

function redirectByRole(user) {
    window.location.href = user.role === 'admin' ? 'admin.html' : 'events.html';
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.toggle('hidden', !message);
}

// ---------- Pestañas ----------
function switchTab(tab) {
    const isLogin = tab === 'login';
    loginForm.classList.toggle('hidden', !isLogin);
    registerForm.classList.toggle('hidden', isLogin);
    title.textContent = isLogin ? 'Iniciar Sesión' : 'Crear Cuenta';

    document.querySelectorAll('.tab').forEach(btn => {
        const active = btn.dataset.tab === tab;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
    });
    showError('loginError', '');
    showError('registerError', '');
}

document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ---------- Inicio de sesión ----------
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showError('loginError', 'Ingresa tu correo y contraseña.');
        return;
    }

    const user = Store.findUserByEmail(email);
    const passwordHash = await sha256(password);

    // Mismo mensaje en ambos casos para no revelar qué correos existen
    if (!user || user.passwordHash !== passwordHash) {
        showError('loginError', 'Correo o contraseña incorrectos.');
        return;
    }

    Store.setSession(user);
    redirectByRole(user);
}

// ---------- Registro ----------
async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (name.length < 3) return showError('registerError', 'El nombre debe tener al menos 3 caracteres.');
    if (!EMAIL_PATTERN.test(email)) return showError('registerError', 'Ingresa un correo electrónico válido.');
    if (password.length < MIN_PASSWORD_LENGTH) {
        return showError('registerError', `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    }
    if (Store.findUserByEmail(email)) return showError('registerError', 'Ya existe una cuenta con ese correo.');

    const user = {
        id: crypto.randomUUID(),
        name,
        email,
        role: 'user',
        passwordHash: await sha256(password)
    };
    Store.addUser(user);
    Store.setSession(user);
    redirectByRole(user);
}

loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);

// ---------- Inicialización ----------
(async () => {
    try {
        await Store.init();
    } catch (error) {
        console.error(error);
        showError('loginError', 'No se pudieron cargar los datos. Abre el proyecto desde un servidor local.');
        return;
    }
    // Si ya hay una sesión activa, no tiene sentido mostrar el login
    const session = Store.getSession();
    if (session && session.id) redirectByRole(session);
})();
