/**
 * Detalle de un evento y agregado al carrito.
 */

const currentUser = Store.requireAuth();
let currentEvent = null;

/** Boletos que todavía puede agregar este usuario (stock menos lo que ya tiene en el carrito). */
function remainingForUser(event) {
    return Math.max(0, event.availableTickets - Store.quantityInCart(currentUser.id, event.id));
}

function displayEventDetail(event) {
    const container = document.getElementById('eventDetail');
    const isSuspended = event.suspended === true;
    const remaining = remainingForUser(event);
    const noStock = event.availableTickets <= 0;
    const canBuy = !isSuspended && remaining > 0;
    const inCart = Store.quantityInCart(currentUser.id, event.id);

    let buttonText = 'Agregar al Carrito';
    if (isSuspended) buttonText = 'No Disponible';
    else if (noStock) buttonText = 'Agotado';
    else if (remaining === 0) buttonText = 'Límite alcanzado';

    container.innerHTML = `
        <div class="detail-grid">
            <div class="image-section">
                <img src="${escapeHtml(event.imageUrl)}" alt="${escapeHtml(event.name)}"
                     class="detail-image ${isSuspended ? 'is-suspended' : ''}" data-fallback>
            </div>

            <div class="info-section">
                <div class="badge-row">
                    <span class="badge badge-purple">${escapeHtml(event.category)}</span>
                    ${isSuspended ? '<span class="badge badge-red">🚫 Suspendido</span>' : ''}
                    ${noStock && !isSuspended ? '<span class="badge badge-red">Agotado</span>' : ''}
                </div>

                <h1 class="event-title">${escapeHtml(event.name)}</h1>

                <div class="detail-list">
                    <p><strong>Fecha:</strong> ${formatDate(event.date)}</p>
                    <p><strong>Hora:</strong> ${escapeHtml(event.time || '19:00')}</p>
                    <p><strong>Ubicación:</strong> ${escapeHtml(event.city)}</p>
                    <p><strong>Disponibles:</strong> ${Number(event.availableTickets)} tickets</p>
                    ${inCart > 0 ? `<p><strong>En tu carrito:</strong> ${inCart}</p>` : ''}
                </div>

                <p class="event-description-full">${escapeHtml(event.description || '')}</p>

                <form id="purchaseForm" class="pricing-card ${isSuspended ? 'is-suspended' : ''}">
                    <p class="price-large">${formatCurrency(event.price)}</p>

                    <div class="purchase-controls">
                        <label for="purchaseQty" class="visually-hidden">Cantidad de boletos</label>
                        <input type="number" id="purchaseQty" value="1" min="1" max="${Math.max(remaining, 1)}"
                               class="input qty-input" ${canBuy ? '' : 'disabled'} required>
                        <button type="submit" class="btn ${canBuy ? 'btn-primary' : 'btn-secondary'}" ${canBuy ? '' : 'disabled'}>
                            ${buttonText}
                        </button>
                    </div>

                    ${isSuspended ? '<p class="suspended-note">Este evento ha sido pausado por la administración.</p>' : ''}
                </form>
            </div>
        </div>
    `;

    attachImageFallback(container);
    document.getElementById('purchaseForm').addEventListener('submit', addToCart);
}

function addToCart(e) {
    e.preventDefault();

    // Se vuelve a leer el evento por si el admin lo modificó mientras la página estaba abierta
    const event = Store.findEvent(currentEvent.id);
    if (!event || event.suspended) {
        notify('Operación no permitida: el evento se encuentra suspendido.', 'error');
        return;
    }

    const qty = Number.parseInt(document.getElementById('purchaseQty').value, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
        notify('Ingresa una cantidad válida.', 'error');
        return;
    }

    // Se considera lo que el usuario YA tiene en el carrito (antes se podía superar el stock)
    const remaining = remainingForUser(event);
    if (qty > remaining) {
        notify(`Solo puedes agregar ${remaining} boleto(s) más de este evento.`, 'error');
        return;
    }

    const cart = Store.getCart(currentUser.id);
    const existing = cart.find(item => String(item.eventId) === String(event.id));
    if (existing) existing.quantity += qty;
    else cart.push({ eventId: event.id, quantity: qty });

    Store.saveCart(currentUser.id, cart);
    window.location.href = 'cart.html';
}

function showErrorState() {
    // El id viene de la URL: no se inserta en el HTML para evitar XSS
    document.getElementById('eventDetail').innerHTML = `
        <div class="card not-found">
            <h2>Evento no encontrado</h2>
            <p>El evento que buscas no existe o fue eliminado.</p>
            <a class="btn btn-primary" href="events.html">Volver</a>
        </div>`;
}

async function init() {
    if (!currentUser) return;
    const eventId = new URLSearchParams(window.location.search).get('id');
    if (!eventId) {
        window.location.replace('events.html');
        return;
    }

    try {
        await Store.init();
    } catch (error) {
        console.error(error);
    }

    currentEvent = Store.findEvent(eventId);
    if (!currentEvent) showErrorState();
    else displayEventDetail(currentEvent);
}

init();
