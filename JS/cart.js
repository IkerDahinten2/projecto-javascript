/**
 * Lógica del Carrito y Pagos - Sinfonía Guatemalteca
 */

let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let cart = [];
let events = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    loadCart();
});

/**
 * Carga los datos del carrito desde LocalStorage
 */
function loadCart() {
    events = JSON.parse(localStorage.getItem('events') || '[]');
    cart = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`) || '[]');
    displayCart();
}

/**
 * Dibuja los elementos en el HTML
 */
function displayCart() {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');
    const totalEl = document.getElementById('cartTotal');
    const itemCount = document.getElementById('itemCount');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        emptyCart.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        itemCount.textContent = '0 artículos en tu carrito';
        return;
    }
    
    emptyCart.classList.add('hidden');
    cartSummary.classList.remove('hidden');

    let total = 0;
    cartItems.innerHTML = cart.map(item => {
        const event = events.find(e => e.id == item.eventId);
        if (!event) return '';

        const itemTotal = event.price * item.quantity;
        total += itemTotal;

        return `
            <div class="cart-item" style="display: flex; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
                <img src="${event.imageUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                <div style="flex: 1; margin-left: 1rem;">
                    <h3 style="font-size: 1rem; margin: 0;">${event.name}</h3>
                    <p style="color: #666; font-size: 0.8rem;">Cant: ${item.quantity} x Q${event.price}</p>
                </div>
                <div style="text-align: right;">
                    <p style="font-weight: 700;">Q${itemTotal.toFixed(2)}</p>
                    <button onclick="removeFromCart('${event.id}')" style="color: red; background: none; border: none; cursor: pointer;">Eliminar</button>
                </div>
            </div>`;
    }).join('');
    
    totalEl.textContent = `Q${total.toFixed(2)}`;
    itemCount.textContent = `${cart.length} artículo(s) en tu carrito`;
}

function removeFromCart(eventId) {
    cart = cart.filter(item => item.eventId != eventId);
    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    displayCart();
}

/**
 * FUNCIONES DE MODAL DE PAGO
 */
function openPaymentModal() {
    document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

/**
 * PROCESAR EL PAGO FINAL
 */
function handleCheckout(e) {
    e.preventDefault();

    // 1. Actualizar inventario de tickets
    let allEvents = JSON.parse(localStorage.getItem('events'));
    
    cart.forEach(item => {
        const eventIndex = allEvents.findIndex(ev => ev.id == item.eventId);
        if (eventIndex !== -1) {
            allEvents[eventIndex].availableTickets -= item.quantity;
        }
    });

    // 2. Guardar cambios en LocalStorage
    localStorage.setItem('events', JSON.stringify(allEvents));

    // 3. Registrar la venta para el admin (opcional pero recomendado)
    let sales = JSON.parse(localStorage.getItem('sales') || '[]');
    sales.push({
        user: currentUser.email,
        date: new Date().toLocaleString(),
        items: cart
    });
    localStorage.setItem('sales', JSON.stringify(sales));

    // 4. Limpiar Carrito
    localStorage.removeItem(`cart_${currentUser.id}`);

    alert("¡Pago exitoso! Tus tickets han sido reservados.");
    window.location.href = 'events.html';
}