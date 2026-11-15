/**
 * Capa de datos de la aplicación.
 *
 * Centraliza todo el acceso a localStorage para que cada vista no repita
 * claves ni lógica. La primera vez que se abre cualquier página se cargan los
 * datos semilla de data.json (antes solo lo hacía el catálogo, y si el admin
 * entraba primero se perdían los eventos de ejemplo).
 *
 * El inicio de sesión es opcional: el catálogo y el detalle se pueden ver
 * sin cuenta; solo el carrito y el panel administrativo la exigen.
 */
const Store = (() => {
    const KEYS = {
        seeded: 'seeded',
        seedVersion: 'seedVersion',
        users: 'users',
        events: 'events',
        cities: 'cities',
        categories: 'categories',
        sales: 'sales',
        session: 'currentUser'
    };

    /**
     * Versión de los datos semilla. Si cambia (por ejemplo, al reemplazar los
     * usuarios de prueba), los navegadores que ya tenían datos guardados
     * actualizan los usuarios por defecto sin perder eventos ni ventas.
     * Debe coincidir con "seedVersion" de data.json.
     */
    const SEED_VERSION = 2;

    /** Usuarios de prueba de versiones anteriores, que ya no son válidos. */
    const RETIRED_USER_IDS = ['1', '2'];

    /** Opción de filtro reservada: no es una ciudad/categoría real. */
    const ALL = 'Todas';

    function read(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value ?? fallback;
        } catch {
            return fallback;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    /** Carga los datos semilla la primera vez y migra datos de versiones anteriores. */
    async function init() {
        if (read(KEYS.seedVersion, 0) === SEED_VERSION) return;

        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`No se pudo cargar data.json (${response.status})`);
        const data = await response.json();

        if (read(KEYS.seeded, false)) {
            migrateUsers(data.defaultUsers);
        } else {
            write(KEYS.users, data.defaultUsers);
            write(KEYS.events, data.defaultEvents);
            write(KEYS.cities, data.cities.filter(c => c !== ALL));
            write(KEYS.categories, data.categories.filter(c => c !== ALL));
            write(KEYS.sales, []);
            write(KEYS.seeded, true);
        }
        write(KEYS.seedVersion, SEED_VERSION);
    }

    /**
     * Reemplaza los usuarios de prueba por los de data.json y conserva las
     * cuentas que registró la gente. Si la sesión activa era de un usuario
     * retirado, se cierra.
     */
    function migrateUsers(defaultUsers) {
        const defaultIds = defaultUsers.map(u => u.id);
        const defaultEmails = defaultUsers.map(u => u.email.toLowerCase());
        const registered = read(KEYS.users, []).filter(u =>
            !RETIRED_USER_IDS.includes(u.id)
            && !defaultIds.includes(u.id)
            && !defaultEmails.includes(u.email.toLowerCase())
        );
        write(KEYS.users, [...defaultUsers, ...registered]);

        const session = read(KEYS.session, null);
        if (session && RETIRED_USER_IDS.includes(session.id)) clearSession();
    }

    // ---------- Sesión ----------
    /** Usuario con sesión iniciada, o null si es un visitante. */
    function getSession() {
        const session = read(KEYS.session, null);
        return session && session.id ? session : null;
    }

    const isLoggedIn = () => getSession() !== null;

    /** URL del login que, al iniciar sesión, regresa a la página indicada. */
    function loginUrl(next = window.location.pathname.split('/').pop() + window.location.search) {
        return `login.html?next=${encodeURIComponent(next || 'events.html')}`;
    }

    function setSession(user) {
        // Nunca se guarda el hash de la contraseña en la sesión
        const { id, name, email, role } = user;
        write(KEYS.session, { id, name, email, role });
    }

    function clearSession() {
        localStorage.removeItem(KEYS.session);
    }

    /**
     * Protege una página que exige cuenta (carrito, panel admin): redirige al
     * login (y luego de vuelta aquí) si no hay sesión, o al catálogo si se
     * requiere un rol que el usuario no tiene. Devuelve el usuario.
     */
    function requireAuth(role) {
        const user = getSession();
        if (!user) {
            window.location.replace(loginUrl());
            return null;
        }
        if (role && user.role !== role) {
            window.location.replace('events.html');
            return null;
        }
        return user;
    }

    // ---------- Usuarios ----------
    const getUsers = () => read(KEYS.users, []);
    const findUserByEmail = email => getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());

    function addUser(user) {
        const users = getUsers();
        users.push(user);
        write(KEYS.users, users);
    }

    // ---------- Eventos ----------
    const getEvents = () => read(KEYS.events, []);
    const saveEvents = events => write(KEYS.events, events);
    const findEvent = id => getEvents().find(e => String(e.id) === String(id));

    // ---------- Parámetros ----------
    const getCities = () => read(KEYS.cities, []);
    const saveCities = cities => write(KEYS.cities, cities);
    const getCategories = () => read(KEYS.categories, []);
    const saveCategories = categories => write(KEYS.categories, categories);

    // ---------- Carrito (uno por usuario) ----------
    const cartKey = userId => `cart_${userId}`;
    const getCart = userId => read(cartKey(userId), []);
    const saveCart = (userId, cart) => write(cartKey(userId), cart);
    const clearCart = userId => localStorage.removeItem(cartKey(userId));
    const cartCount = userId => getCart(userId).reduce((sum, item) => sum + item.quantity, 0);

    /** Boletos de un evento que el usuario ya tiene en su carrito. */
    const quantityInCart = (userId, eventId) =>
        getCart(userId).filter(i => String(i.eventId) === String(eventId)).reduce((s, i) => s + i.quantity, 0);

    // ---------- Ventas ----------
    const getSales = () => read(KEYS.sales, []);

    function addSale(sale) {
        const sales = getSales();
        sales.push(sale);
        write(KEYS.sales, sales);
    }

    return {
        ALL, init,
        getSession, setSession, clearSession, isLoggedIn, loginUrl, requireAuth,
        getUsers, findUserByEmail, addUser,
        getEvents, saveEvents, findEvent,
        getCities, saveCities, getCategories, saveCategories,
        getCart, saveCart, clearCart, cartCount, quantityInCart,
        getSales, addSale
    };
})();
