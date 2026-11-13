/**
 * Carrito de compras y checkout simulado.
 */

const currentUser = Store.requireAuth();
const paymentModal = document.getElementById('paymentModal');
const paymentForm = document.getElementById('paymentForm');

// ---------- Validaciones de pago ----------
/** Algoritmo de Luhn: detecta números de tarjeta mal escritos. */
function isValidCardNumber(value) {
    const digits = value.replace(/\D/g, '');
    if (!/^\d{13,19}$/.test(digits)) return false;
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = Number(digits[i]);
        if (double) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        double = !double;
    }
    return sum % 10 === 0;
}

function isValidExpiry(value) {
    const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
    if (!match) return false;
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

/** DPI guatemalteco (13 dígitos) o NIT (dígitos con verificador opcional, p. ej. 1234567-8 o CF). */
const isValidDocument = value => /^\d{13}$/.test(value.replace(/\s/g, '')) || /^(\d{5,10}-?[\dkK]|CF)$/i.test(value.trim());
const isValidPhone = value => /^\d{8}$/.test(value.replace(/[\s-]/g, ''));
const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

function validatePayment(form) {
    if (form.cardName.value.trim().length < 3) return 'Ingresa el nombre como aparece en la tarjeta.';
    if (!isValidCardNumber(form.cardNumber.value)) return 'El número de tarjeta no es válido.';
    if (!isValidExpiry(form.cardExpiry.value.trim())) return 'La fecha de vencimiento no es válida o la tarjeta está vencida.';
    if (!/^\d{3,4}$/.test(form.cardCvv.value)) return 'El CVV debe tener 3 o 4 dígitos.';
    if (!isValidDocument(form.userDoc.value)) return 'Ingresa un DPI (13 dígitos) o NIT válido.';
    if (!isValidPhone(form.userPhone.value)) return 'El teléfono debe tener 8 dígitos.';
    if (!isValidEmail(form.userEmail.value.trim())) return 'Ingresa un correo electrónico válido.';
    return null;
}

// ---------- Carrito ----------
/** Une el carrito con los datos actuales de cada evento. */
function cartLines() {
    return Store.getCart(currentUser.id)
        .map(item => ({ item, event: Store.findEvent(item.eventId) }))
        .filter(line => line.event);
}

/** Problemas que impiden comprar (evento suspendido o sin stock suficiente). */
function lineProblem({ item, event }) {
    if (event.suspended) return 'Evento suspendido';
    if (item.quantity > event.availableTickets) return `Solo quedan ${event.availableTickets} boleto(s)`;
    return null;
}

function displayCart() {
    const lines = cartLines();
    const cartItems = document.getElementById('cartItems');
    const isEmpty = lines.length === 0;

    document.getElementById('emptyCart').classList.toggle('hidden', !isEmpty);
    document.getElementById('cartSummary').classList.toggle('hidden', isEmpty);

    const totalTickets = lines.reduce((sum, l) => sum + l.item.quantity, 0);
    document.getElementById('itemCount').textContent = `${totalTickets} boleto(s) en tu carrito`;

    let total = 0;
    cartItems.innerHTML = lines.map(line => {
        const { item, event } = line;
        const itemTotal = event.price * item.quantity;
        total += itemTotal;
        const problem = lineProblem(line);

        return `
            <div class="cart-item ${problem ? 'cart-item--blocked' : ''}">
                <img src="${escapeHtml(event.imageUrl)}" alt="${escapeHtml(event.name)}" class="cart-item__image" data-fallback>
                <div class="cart-item__info">
                    <h3 class="cart-item__name">${escapeHtml(event.name)}</h3>
                    <p class="cart-item__meta">Cant: ${item.quantity} x ${formatCurrency(event.price)}</p>
                    ${problem ? `<p class="cart-item__problem">${escapeHtml(problem)}</p>` : ''}
                </div>
                <div class="cart-item__actions">
                    <p class="cart-item__total">${formatCurrency(itemTotal)}</p>
                    <button type="button" class="btn-delete" data-remove="${escapeHtml(event.id)}">Eliminar</button>
                </div>
            </div>`;
    }).join('');

    document.getElementById('cartTotal').textContent = formatCurrency(total);
    attachImageFallback(cartItems);
}

function removeFromCart(eventId) {
    const cart = Store.getCart(currentUser.id).filter(item => String(item.eventId) !== String(eventId));
    Store.saveCart(currentUser.id, cart);
    displayCart();
}

// ---------- Modal de pago ----------
function openPaymentModal() {
    const problems = cartLines().map(lineProblem).filter(Boolean);
    if (problems.length > 0) {
        notify('Hay eventos en tu carrito que no se pueden comprar. Elimínalos para continuar.', 'error');
        return;
    }
    paymentForm.userEmail.value ||= currentUser.email || '';
    paymentModal.classList.add('active');
    paymentForm.cardName.focus();
}

function closePaymentModal() {
    paymentModal.classList.remove('active');
    document.getElementById('paymentError').classList.add('hidden');
}

// ---------- Checkout ----------
function handleCheckout(e) {
    e.preventDefault();
    const errorBox = document.getElementById('paymentError');

    const error = validatePayment(paymentForm);
    if (error) {
        errorBox.textContent = error;
        errorBox.classList.remove('hidden');
        return;
    }

    // Revalidación final con los datos ACTUALES de cada evento: el admin pudo
    // suspenderlo o el stock pudo cambiar desde que se agregó al carrito
    const lines = cartLines();
    const blocked = lines.find(lineProblem);
    if (lines.length === 0 || blocked) {
        closePaymentModal();
        displayCart();
        notify(blocked ? `No se puede completar la compra: ${lineProblem(blocked)} (${blocked.event.name}).` : 'Tu carrito está vacío.', 'error');
        return;
    }

    // 1. Descontar inventario
    const events = Store.getEvents();
    lines.forEach(({ item }) => {
        const event = events.find(ev => String(ev.id) === String(item.eventId));
        event.availableTickets -= item.quantity;
    });
    Store.saveEvents(events);

    // 2. Registrar la venta con el precio unitario del momento de la compra
    Store.addSale({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        user: currentUser.email,
        date: new Date().toISOString(),
        items: lines.map(({ item, event }) => ({
            eventId: event.id,
            eventName: event.name,
            quantity: item.quantity,
            unitPrice: Number(event.price)
        }))
    });

    // 3. Vaciar el carrito (los datos de la tarjeta no se guardan en ningún lado)
    Store.clearCart(currentUser.id);
    paymentForm.reset();
    closePaymentModal();
    displayCart();
    notify('¡Pago exitoso! Tus boletos han sido reservados.', 'success');
}

// ---------- Eventos de la interfaz ----------
document.getElementById('cartItems').addEventListener('click', e => {
    const button = e.target.closest('[data-remove]');
    if (button) removeFromCart(button.dataset.remove);
});
document.getElementById('checkoutBtn').addEventListener('click', openPaymentModal);
document.getElementById('cancelPaymentBtn').addEventListener('click', closePaymentModal);
paymentForm.addEventListener('submit', handleCheckout);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && paymentModal.classList.contains('active')) closePaymentModal();
});

// Formato automático MM/AA
paymentForm.cardExpiry.addEventListener('input', e => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
});

(async () => {
    if (!currentUser) return;
    try {
        await Store.init();
    } catch (error) {
        console.error(error);
    }
    displayCart();
})();
